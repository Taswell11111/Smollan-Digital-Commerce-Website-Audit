import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { validateTargetUrl, safeFetch, readResponseBodyWithLimit } from './src/utils/ssrf.ts';
import { senderConfig } from './src/config/sender.ts';
import { calculateScores } from './src/utils/scoring.ts';
import { CATEGORY_RULESET, CATEGORY_WEIGHTS, RULESET_VERSION, SCHEMA_VERSION } from './src/config/ruleset.ts';
import { callBrowserWorker } from './server/workerClient.ts';
import { parseCrawlerHtml } from './src/utils/crawlerHtml.ts';
import { collectRenderedProductEvidence, extractProductSignals } from './src/utils/firecrawl.ts';
import { readStorage, writeStorage, StorageCorruptError } from './server/storage.ts';
import { extractJsonLdTypes, evaluateAiBotAccess, isPathAllowed, REQUIRED_SCHEMA_TYPES, AI_BOTS } from './src/utils/measuredSignals.ts';
import { SessionStore, tokenMatches, readCookie, createAuthGuard, productionAuthConfigError, SESSION_COOKIE, SESSION_TTL_MS } from './server/auth.ts';
import { auditPageSource } from './server/qaSourceAuditor.ts';
import { generateQaExcelWorkbook } from './server/qaExcelBridge.ts';

/** Single model id for every Gemini call. Verify it is available on the account before deploying. */
const AI_MODEL = 'gemini-3.1-flash-lite';

export function isShortText(value: unknown, maxWords: number): value is string {
  if (typeof value !== 'string') return false;
  const t = value.trim();
  return t.length > 0 && !/[\r\n]/.test(t) && t.split(/\s+/).length <= maxWords;
}

/** Audits saved before the measured-only change carry removed fields; drop them when read. */
export function sanitizeLegacyAudit(a: any) {
  if (a && a.agenticCommerce && !a.agenticCommerce.measured) delete a.agenticCommerce;
  if (a && 'executionCost' in a) delete a.executionCost;
  return a;
}

const app = express();
app.set('trust proxy', 1);
// Reduced JSON body limit to 100kb
app.use(express.json({ limit: '100kb' }));

const API_TOKEN = process.env.API_TOKEN || '';
const sessions = new SessionStore();
// Every /api route below requires a bearer token or a session cookie when API_TOKEN is set.
app.use('/api', createAuthGuard({ token: API_TOKEN || undefined, sessions }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: { error: 'Too many login attempts. Try again later.' }
});

app.get('/api/session', (req: Request, res: Response) => {
  if (!API_TOKEN) return res.json({ authenticated: true, authRequired: false });
  if (sessions.isValid(readCookie(req.headers.cookie, SESSION_COOKIE))) {
    return res.json({ authenticated: true, authRequired: true });
  }
  res.status(401).json({ authenticated: false, authRequired: true });
});

app.post('/api/session', loginLimiter, (req: Request, res: Response) => {
  if (!API_TOKEN) return res.json({ authenticated: true, authRequired: false });
  const providedToken = req.body?.token;
  if (!tokenMatches(providedToken, API_TOKEN)) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  const sid = sessions.create();
  const isHttpsOrProd = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const sameSite = isHttpsOrProd ? '; Secure; SameSite=None' : '; SameSite=Strict';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${sid}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${sameSite}`);
  res.json({ authenticated: true, authRequired: true, token: typeof providedToken === 'string' ? providedToken.trim().replace(/^["']|["']$/g, '') : undefined });
});

app.post('/api/logout', (req: Request, res: Response) => {
  sessions.revoke(readCookie(req.headers.cookie, SESSION_COOKIE));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  res.json({ success: true });
});

// Tracking audit progress
export const auditStatusMap = new Map<string, { status: 'running' | 'complete' | 'failed', logs: string[], result?: any, error?: string }>();

function logAudit(auditId: string, message: string) {
  const status = auditStatusMap.get(auditId);
  if (status) {
    status.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }
}

const auditCreatedAt = new Map<string, number>();
const AUDIT_STATUS_TTL_MS = 2 * 60 * 60 * 1000;

/** Drops finished audit statuses older than the TTL. Running audits are never dropped. */
export function pruneAuditStatus(now = Date.now()) {
  for (const [id, created] of auditCreatedAt) {
    if (now - created < AUDIT_STATUS_TTL_MS) continue;
    if (auditStatusMap.get(id)?.status === 'running') continue;
    auditStatusMap.delete(id);
    auditCreatedAt.delete(id);
  }
}

/** Marks a running audit cancelled. The pipeline observes this at its checkpoints and persists nothing. */
export function cancelAuditRecord(auditId: string): 'not_found' | 'cancelled' | 'not_running' {
  const status = auditStatusMap.get(auditId);
  if (!status) return 'not_found';
  if (status.status !== 'running') return 'not_running';
  auditStatusMap.set(auditId, {
    status: 'failed',
    logs: [...status.logs, '[SYSTEM] Audit cancelled by user.'],
    error: 'cancelled'
  });
  return 'cancelled';
}

function checkCancelled(auditId: string) {
  const status = auditStatusMap.get(auditId);
  if (status?.status === 'failed' && status.error === 'cancelled') {
    throw new Error('cancelled');
  }
}

// Rate Limiters per IP
const auditLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: { error: 'Too many audit requests from this IP. Please try again after 10 minutes.' }
});

const inspectLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: { error: 'Too many URL inspection requests from this IP. Please try again after 10 minutes.' }
});

const pitchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: { error: 'Too many sales pitch requests from this IP. Please try again after 10 minutes.' }
});

const PORT = Number(process.env.PORT) || 3000;
// Vitest imports this module; never start Vite or bind a port in that case.
const IS_TEST = !!process.env.VITEST;
if (!IS_TEST) {
  const authConfigError = productionAuthConfigError(process.env);
  if (authConfigError) {
    console.error(`FATAL: ${authConfigError}`);
    process.exit(1);
  }
}

// Shared Gemini client utility with aistudio-build user-agent telemetry
let cachedAI: GoogleGenAI | null = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  if (!cachedAI) {
    cachedAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return cachedAI;
}

async function scrapeRenderedPageWithFirecrawl(url: string, timeoutMs: number) {
  const boundedTimeout = Math.max(1, Math.min(timeoutMs, 7_000));
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || '';

  if (firecrawlKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), boundedTimeout);
      const res = await safeFetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          onlyMainContent: false,
          waitFor: Math.min(1_500, boundedTimeout),
          timeout: boundedTimeout
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.res.ok) {
        const text = await readResponseBodyWithLimit(res.res, 3 * 1024 * 1024);
        const payload = JSON.parse(text || '{}');
        const data = payload?.data ?? payload;
        if (typeof data?.html === 'string' && data.html.length > 0) {
          return {
            html: data.html,
            sourceUrl: data?.metadata?.sourceURL || data?.metadata?.url || data?.sourceURL || data?.url
          };
        }
      }
    } catch {
      // Fallback to direct fetch below
    }
  }

  // Google AI Studio aligned DOM scraper fallback
  const fetchRes = await safeFetch(url, { maxRedirects: 4 });
  const html = await readResponseBodyWithLimit(fetchRes.res, 2 * 1024 * 1024);
  return { html, sourceUrl: fetchRes.finalUrl };
}

// Storage directory setup
const STORAGE_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const AUDITS_FILE = path.join(STORAGE_DIR, 'audits.json');
const LEADS_FILE = path.join(STORAGE_DIR, 'leads.json');
const SERVICES_FILE = path.join(STORAGE_DIR, 'services.json');

// Default Service Catalogue based on ecompletecommerce.co.za & Smollan capabilities
const defaultServices = [
  {
    id: 'srv-1',
    category: 'Ecommerce Strategy & Consulting',
    name: 'Digital Maturity & Roadmap Consulting',
    description: 'Strategic advisory on platform selection, omnichannel architecture, and commercial expansion.'
  },
  {
    id: 'srv-2',
    category: 'Ecommerce Website Development & Migration',
    name: 'Enterprise Storefront Engineering',
    description: 'Custom React/Shopify/Shopware development, checkout optimisation, and lightning-fast storefronts.'
  },
  {
    id: 'srv-3',
    category: 'UX/UI & Conversion-Rate Optimisation',
    name: 'Conversion Rate Optimisation (CRO) & UX Audit',
    description: 'Eliminating checkout friction, mobile layout fixes, size guides, and micro-interaction enhancements.'
  },
  {
    id: 'srv-4',
    category: 'Website Performance & Technical Optimisation',
    name: 'Core Web Vitals & Speed Acceleration',
    description: 'LCP, INP, and CLS tuning, asset bundling, image pipelines, and edge caching.'
  },
  {
    id: 'srv-5',
    category: 'SEO & Digital Marketing',
    name: 'Technical SEO & Discoverability',
    description: 'Structured data schema, meta optimization, internal linking architecture, and indexation hygiene.'
  },
  {
    id: 'srv-6',
    category: 'Product Catalogue & Merchandising Management',
    name: 'PIM & Merchandising Excellence',
    description: 'Rich descriptions, size guides, attribute standardisation, and promotional badging.'
  },
  {
    id: 'srv-7',
    category: 'Analytics & Business Intelligence',
    name: 'Advanced Attribution & GA4 Analytics',
    description: 'Event tracking, user journey funnel reporting, and dead-click detection.'
  },
  {
    id: 'srv-8',
    category: 'Customer Relationship Management & Support',
    name: 'Customer Experience & CRM Integration',
    description: 'Post-purchase loyalty loops, WhatsApp/SMS marketing, and support ticketing.'
  },
  {
    id: 'srv-9',
    category: 'Fulfilment & Operational Integration',
    name: 'Logistics & Order Fulfilment Sync',
    description: 'ERP/WMS integration, real-time stock thresholds, and delivery promise widgets.'
  }
];

if (!fs.existsSync(SERVICES_FILE)) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(defaultServices, null, 2));
}


const BENCHMARKS_FILE = path.join(STORAGE_DIR, 'benchmarks.json');

function getIndustryBenchmarks(): Record<string, { value: number; source: string; sourceDate: string; notes: string }> {
  try {
    if (fs.existsSync(BENCHMARKS_FILE)) {
      return JSON.parse(fs.readFileSync(BENCHMARKS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading benchmarks.json:', e);
  }
  return {};
}

function calculateIndustryBenchmarks(categoryResults: Record<string, { score: number }>) {
  const benchmarksData = getIndustryBenchmarks();
  const hasData = Object.keys(benchmarksData).length > 0;
  if (!hasData) {
    return {
      available: false,
      message: 'Verified industry benchmark dataset unavailable.'
    };
  }

  const categoryBenchmarks: Record<string, {
    benchmark: number;
    delta: number;
    status: 'Lagging' | 'On Par' | 'Outperforming';
    source: string;
    sourceDate: string;
    notes: string;
  }> = {};
  let totalBenchmark = 0;
  let count = 0;

  Object.entries(categoryResults).forEach(([cat, res]) => {
    const bEntry = benchmarksData[cat];
    if (bEntry && typeof bEntry.value === 'number') {
      const benchmark = bEntry.value;
      const delta = res.score - benchmark;
      let status: 'Lagging' | 'On Par' | 'Outperforming' = 'On Par';
      if (delta <= -4) status = 'Lagging';
      else if (delta >= 4) status = 'Outperforming';

      categoryBenchmarks[cat] = {
        benchmark,
        delta,
        status,
        source: bEntry.source || 'Verified Corpus',
        sourceDate: bEntry.sourceDate || '2024',
        notes: bEntry.notes || ''
      };
      totalBenchmark += benchmark;
      count++;
    }
  });

  const industryAverage = count > 0 ? Math.round(totalBenchmark / count) : undefined;

  return {
    available: true,
    industryAverage,
    categoryBenchmarks
  };
}

// Server-side crawler implementation
export async function crawlWebsite(targetUrl: string, depth: 'quick' | 'standard' | 'deep', auditId?: string, customMaxPages?: number) {
  const parsedMax = Number(customMaxPages);
  const maxPages = (!isNaN(parsedMax) && parsedMax > 0)
    ? parsedMax
    : (depth === 'quick' ? 5 : depth === 'standard' ? 25 : 100);
  if (auditId) logAudit(auditId, `Starting crawl for ${targetUrl} (target budget: ${maxPages} pages, depth: ${depth})`);
  const visited = new Set<string>();
  const queue: string[] = [targetUrl];
  // robots.txt is fetched once per crawl and honoured for every URL below.
  const robots = await fetchRobotsForAudit(targetUrl);
  const robotsBlocked: string[] = [];
  if (auditId && robots.status === 'error') logAudit(auditId, 'robots.txt could not be retrieved; crawling proceeds and access is recorded as not determined.');
  const pagesInspected: any[] = [];
  const failedPages: any[] = [];
  const productCandidateUrls = new Set<string>();

  const baseParsed = new URL(targetUrl);
  const normalizeHost = (h: string) => h.replace(/^www\./i, '').toLowerCase();
  let baseDomain = normalizeHost(baseParsed.hostname);

  let finalUrlIsHttps = false;
  let validCertHandshake = true;
  let httpToHttpsRedirect = false;
  let privacyPolicyFound = false;
  let totalTrustMarkers = 0;

  // Probe HTTP to HTTPS redirection check
  try {
    const probeUrl = `http://${baseParsed.hostname}`;
    const probeController = new AbortController();
    const probeTimeout = setTimeout(() => probeController.abort(), 4000);
    const probeResult = await safeFetch(probeUrl, {
      method: 'HEAD',
      signal: probeController.signal,
      maxRedirects: 3
    });
    clearTimeout(probeTimeout);
    if (probeResult.finalUrl.startsWith('https://') || probeResult.redirectCount > 0) {
      httpToHttpsRedirect = true;
    }
  } catch {
    // Probe failed or connection refused on plain HTTP
  }

  while (queue.length > 0 && pagesInspected.length < maxPages) {
    if (auditId) checkCancelled(auditId);
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    const pathWithQuery = (() => { const u = new URL(currentUrl); return `${u.pathname}${u.search}`; })();
    if (!isPathAllowed(robots.text, 'SmollanDigitalAuditor', pathWithQuery)) {
      robotsBlocked.push(currentUrl);
      if (currentUrl === targetUrl) {
        // A blocked homepage means nothing can be audited; surface it as the access notice.
        failedPages.push({ url: currentUrl, status: 0, error: 'Disallowed by robots.txt' });
      }
      if (auditId) logAudit(auditId, `Skipped (robots.txt): ${currentUrl}`);
      continue;
    }

    try {
      // Record TTFB separately: elapsed time until HTTP response headers arrive
      const ttfbStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const safeResult = await safeFetch(currentUrl, {
        headers: {
          'User-Agent': 'SmollanDigitalAuditor/1.0 (+https://ecompletecommerce.co.za/auditor)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal,
        maxRedirects: 5
      });

      const ttfbMs = Date.now() - ttfbStart;
      clearTimeout(timeoutId);

      const res = safeResult.res;
      if (safeResult.finalUrl.startsWith('https://')) {
        finalUrlIsHttps = true;
      }
      if (targetUrl.startsWith('http://') && safeResult.finalUrl.startsWith('https://')) {
        httpToHttpsRedirect = true;
      }
      if (pagesInspected.length === 0 && safeResult.finalUrl) {
        try {
          const finalParsed = new URL(safeResult.finalUrl);
          baseDomain = normalizeHost(finalParsed.hostname);
        } catch {}
      }

      if (!res.ok) {
        failedPages.push({ url: currentUrl, status: res.status, error: `HTTP ${res.status} ${res.statusText}` });
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        continue;
      }

      // Download body time measured separately
      const downloadStart = Date.now();
      const html = await readResponseBodyWithLimit(res, 2 * 1024 * 1024);
      const downloadTimeMs = Date.now() - downloadStart;
      const loadTimeMs = ttfbMs + downloadTimeMs;

      const { $, $clean, visibleText, bodyText } = parseCrawlerHtml(html);
      const jsonLdTypes = extractJsonLdTypes(html);
      const productSignals = extractProductSignals($clean, visibleText, currentUrl);

      // Extract metadata
      const title = $('title').text().trim() || 'Untitled Page';
      const description = $('meta[name="description"]').attr('content')?.trim() || '';
      const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
      const h2s = $('h2').map((_, el) => $(el).text().trim()).get();

      // Classify page type (improved robustness)
      let pageType = 'content';
      const pathLower = new URL(currentUrl).pathname.toLowerCase();
      const htmlLower = html.toLowerCase();

      if (pathLower === '/' || pathLower === '') {
        pageType = 'homepage';
      } else if (
        pathLower.includes('/product') || 
        pathLower.includes('/item') || 
        pathLower.includes('/p/') || 
        pathLower.includes('/pd/') ||
        pathLower.includes('/sku-') || 
        jsonLdTypes.includes('Product') ||
        (productSignals.hasAddToCart && (productSignals.hasPrice || productSignals.hasStock)) ||
        $('.product-single, .product-main, .pdp, [itemtype*="Product"], .product-view, .product-detail, [data-product-id], form[action*="/cart/add"], button[name="add"]').length > 0
      ) {
        pageType = 'product';
      } else if (pathLower.includes('/collection') || pathLower.includes('/category') || pathLower.includes('/shop') || pathLower.includes('/search') || pathLower.includes('/c/') || $('.collection, .category-products, .product-list, .plp, .category-view').length > 0) {
        pageType = 'category';
      } else if (pathLower.includes('/cart') || pathLower.includes('/basket') || pathLower.includes('/bag') || $('.cart-container, #cart, .mini-cart, .shopping-cart, .bag-container').length > 0 || bodyText.includes('shopping bag') || bodyText.includes('your cart') || bodyText.includes('view cart')) {
        pageType = 'cart';
      } else if (pathLower.includes('/checkout') || pathLower.includes('/pay') || pathLower.includes('/order') || $('[id*="checkout"], [class*="checkout"], .checkout-container').length > 0 || bodyText.includes('shipping address') || bodyText.includes('payment method') || bodyText.includes('secure checkout')) {
        pageType = 'checkout';
      } else if (pathLower.includes('/delivery') || pathLower.includes('/shipping') || pathLower.includes('/returns') || pathLower.includes('/courier') || bodyText.includes('delivery information') || bodyText.includes('shipping policy') || bodyText.includes('track order')) {
        pageType = 'delivery';
      } else if (pathLower.includes('/contact') || pathLower.includes('/help') || pathLower.includes('/faq') || pathLower.includes('/support')) {
        pageType = 'help';
      }

      // Elements inspection
      const linksCount = $('a').length;

      // Navigation: count links inside <nav> or <header> elements, not all <a> tags
      const navLinksCount = $('nav a, header a').length;

      const images = $('img');
      const imagesCount = images.length;
      let missingAltCount = 0;
      images.each((_, img) => {
        if (!$(img).attr('alt') || $(img).attr('alt')?.trim() === '') {
          missingAltCount++;
        }
      });

      const buttons = $('button, a.btn, input[type="submit"]').map((_, el) => $(el).text().trim()).get().filter(Boolean);

      const hasPrice = productSignals.hasPrice;

      // Size guide: visible text (strip <script>/<style>) requiring link or heading with "size guide" or "size chart"
      const sizeGuideRegex = /size\s*guide|size\s*chart/i;
      let hasSizeGuide = false;
      $clean('a, h1, h2, h3, h4, h5, h6, button').each((_, el) => {
        const txt = $clean(el).text();
        const href = $clean(el).attr('href') || '';
        if (sizeGuideRegex.test(txt) || sizeGuideRegex.test(href)) {
          hasSizeGuide = true;
          return false;
        }
      });

      const hasCanonical = $('link[rel="canonical"]').length > 0;
      const hasMetaViewport = $('meta[name="viewport"]').length > 0;

      // Privacy policy detection on homepage or footer
      $('footer a, a').each((_, el) => {
        const isFooter = $(el).parents('footer').length > 0;
        const isHome = pageType === 'homepage';
        if (isFooter || isHome) {
          const txt = $(el).text().toLowerCase();
          const href = ($(el).attr('href') || '').toLowerCase();
          if (
            href.includes('privacy') ||
            href.includes('popia') ||
            txt.includes('privacy policy') ||
            txt.includes('privacy notice') ||
            txt.includes('popia') ||
            txt.includes('data protection')
          ) {
            privacyPolicyFound = true;
          }
        }
      });

      // Trust markers: count review or rating widgets by selector or vendor script
      const reviewWidgets = $('[class*="review" i], [class*="rating" i], [id*="review" i], [id*="rating" i], script[src*="review" i], script[src*="rating" i], script[src*="yotpo" i], script[src*="judge.me" i], script[src*="trustpilot" i], script[src*="loox" i], script[src*="stamped" i]');
      totalTrustMarkers = Math.max(totalTrustMarkers, reviewWidgets.length);

      // Extract internal links for queue across all depths (up to maxPages)
      if (pagesInspected.length + queue.length < maxPages * 3) {
        const navLinks: string[] = [];
        const contentLinks: string[] = [];

        $('a[href]').each((_, el) => {
          const rawHref = $(el).attr('href')?.trim();
          if (!rawHref || 
              rawHref.startsWith('#') || 
              rawHref.startsWith('javascript:') || 
              rawHref.startsWith('mailto:') || 
              rawHref.startsWith('tel:') ||
              rawHref.startsWith('data:')) {
            return;
          }
          try {
            const resolved = new URL(rawHref, currentUrl);
            resolved.hash = ''; // strip anchor fragment
            const resolvedStr = resolved.toString();
            
            const isSameDomain = normalizeHost(resolved.hostname) === baseDomain;
            if (isSameDomain && !visited.has(resolvedStr) && !queue.includes(resolvedStr)) {
              // Prioritize header navigation tabs, category menus, and top-level links
              const isNav = $(el).parents('nav, header, [role="navigation"], .menu, .nav, .navigation, .site-header, #menu, #nav').length > 0;
              const productPath = /(?:^|\/)(?:products?|items?|p|sku-[^/]+|dp)(?:\/|$)/i.test(resolved.pathname);
              const productContainer = $(el).closest('[class*="product"], [data-product-id], [itemtype*="Product"]').length > 0;
              // Product candidates feed a second fetch path, so they obey robots.txt too.
              const candidatePath = `${resolved.pathname}${resolved.search}`;
              if ((productPath || productContainer) && isPathAllowed(robots.text, 'SmollanDigitalAuditor', candidatePath)) {
                productCandidateUrls.add(resolvedStr);
              }

              if (isNav) {
                navLinks.push(resolvedStr);
              } else {
                contentLinks.push(resolvedStr);
              }
            }
          } catch {}
        });

        // Queue navigation tab links first to guarantee all website tabs are crawled, followed by body links
        const prioritizedLinks = [...navLinks, ...contentLinks];
        for (const link of prioritizedLinks) {
          if (queue.length < 60 && !queue.includes(link) && !visited.has(link)) {
            queue.push(link);
          }
        }
      }

      const pageScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(currentUrl)}?w=960`;
      const pageFallbackScreenshot = `https://image.thum.io/get/width/960/crop/650/${encodeURIComponent(currentUrl)}`;

      pagesInspected.push({
        url: currentUrl,
        pageType,
        status: res.status,
        loadTimeMs,
        ttfbMs,
        downloadTimeMs,
        title,
        description,
        h1s,
        h2s,
        linksCount,
        navLinksCount,
        imagesCount,
        missingAltCount,
        buttons: buttons.slice(0, 10),
        hasPrice,
        hasStock: productSignals.hasStock,
        hasAddToCart: productSignals.hasAddToCart,
        evidenceSources: ['direct_html'],
        hasSizeGuide,
        jsonLdTypes,
        hasCanonical,
        hasMetaViewport,
        screenshotUrl: pageScreenshot,
        fallbackScreenshotUrl: pageFallbackScreenshot
      });

      if (auditId) {
        logAudit(auditId, `Inspected [${pageType}]: ${currentUrl} (${pagesInspected.length}/${maxPages} pages)`);
      }

    } catch (err: any) {
      const errMsg = err.message || 'Timeout or connection error';
      if (/CERT_|TLS_|SSL_/i.test(errMsg)) {
        validCertHandshake = false;
      }
      failedPages.push({ url: currentUrl, status: 0, error: errMsg });
    }
  }

  // Collect rendered product evidence fallback if direct HTML missed required signals
  const renderedFallback = await collectRenderedProductEvidence({
    targetUrl,
    pagesInspected,
    productCandidateUrls: Array.from(productCandidateUrls),
    isAllowed: (url: string) => {
      const u = new URL(url);
      return isPathAllowed(robots.text, 'SmollanDigitalAuditor', `${u.pathname}${u.search}`);
    },
    scrapePage: scrapeRenderedPageWithFirecrawl
  });

  for (const renderedPage of renderedFallback.evidence) {
    const inspectedPage = pagesInspected.find((page: any) => {
      try {
        const direct = new URL(page.url);
        const rendered = new URL(renderedPage.url);
        direct.hash = '';
        rendered.hash = '';
        if (direct.pathname.length > 1) direct.pathname = direct.pathname.replace(/\/+$/, '');
        if (rendered.pathname.length > 1) rendered.pathname = rendered.pathname.replace(/\/+$/, '');
        return direct.toString() === rendered.toString();
      } catch {
        return page.url === renderedPage.url;
      }
    });
    if (inspectedPage) {
      inspectedPage.hasPrice = inspectedPage.hasPrice || renderedPage.hasPrice;
      inspectedPage.hasStock = inspectedPage.hasStock || renderedPage.hasStock;
      inspectedPage.hasAddToCart = inspectedPage.hasAddToCart || renderedPage.hasAddToCart;
      inspectedPage.evidenceSources = Array.from(new Set([...(inspectedPage.evidenceSources || ['direct_html']), 'Firecrawl']));
    }
  }

  if (auditId) {
    if (renderedFallback.status === 'not_needed') {
      logAudit(auditId, 'Rendered product evidence fallback skipped: direct HTML contained required product signals.');
    } else if (renderedFallback.status === 'unavailable') {
      logAudit(auditId, `Rendered product evidence fallback unavailable: ${renderedFallback.reason || 'no response'}`);
    } else {
      logAudit(auditId, `Rendered ${renderedFallback.attemptedUrls.length} page(s); measured product evidence: ${renderedFallback.evidence.length}.`);
    }
  }

  return {
    pagesInspected,
    failedPages,
    robots,
    robotsBlocked,
    pagesDiscoveredCount: visited.size,
    renderedProductEvidence: renderedFallback.evidence,
    unavailableProductEvidenceUrls: renderedFallback.unavailableUrls,
    renderedFallback: {
      status: renderedFallback.status,
      attemptedUrls: renderedFallback.attemptedUrls,
      ...(renderedFallback.reason ? { reason: renderedFallback.reason } : {})
    },
    tlsInfo: {
      isHttps: finalUrlIsHttps,
      validCert: validCertHandshake,
      httpToHttpsRedirect
    },
    privacyPolicyFound,
    trustMarkersCount: totalTrustMarkers
  };
}

// API Routes
app.get('/api/services', (req: Request, res: Response) => {
  const services = readStorage(SERVICES_FILE);
  res.json(services);
});

app.post('/api/services', (req: Request, res: Response) => {
  const services = req.body;
  if (!Array.isArray(services)) {
    return res.status(400).json({ error: 'Services body must be an array.' });
  }
  if (services.length > 50) {
    return res.status(400).json({ error: 'Maximum of 50 services allowed.' });
  }
  for (const item of services) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      typeof item.category !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.description !== 'string'
    ) {
      return res.status(400).json({
        error: 'Each service item must have id, category, name, and description as strings.'
      });
    }
  }
  writeStorage(SERVICES_FILE, services);
  res.json({ success: true, services });
});

app.get('/api/audits', (req: Request, res: Response) => {
  const audits = readStorage(AUDITS_FILE);
  const enriched = audits.map((a: any) => {
    sanitizeLegacyAudit(a);
    if (!a.industryBenchmarks && a.categoryResults) {
      a.industryBenchmarks = calculateIndustryBenchmarks(a.categoryResults);
    }
    return a;
  });
  res.json(enriched);
});

app.get('/api/sender', (req: Request, res: Response) => {
  res.json(senderConfig);
});

app.get('/api/leads', (req: Request, res: Response) => {
  const leads = readStorage(LEADS_FILE);
  res.json(leads);
});

app.get('/api/audit/status/:auditId', (req: Request, res: Response) => {
  const status = auditStatusMap.get(req.params.auditId);
  if (!status) {
    return res.status(404).json({ error: 'Audit not found' });
  }
  res.json(status);
});

app.delete('/api/audit/cancel/:auditId', (req: Request, res: Response) => {
  const outcome = cancelAuditRecord(req.params.auditId);
  if (outcome === 'not_found') {
    return res.status(404).json({ error: 'Audit not found' });
  }
  res.json({ success: true, outcome });
});

// Fast URL inspection & screenshot verification endpoint with SSRF protection and abuse limits
app.post('/api/inspect-url', inspectLimiter, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Target URL is required for inspection.' });
    }

    const validation = await validateTargetUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const targetUrl = validation.normalizedUrl!;
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    let safeResult: { res: globalThis.Response; finalUrl: string; redirectCount: number };
    try {
      safeResult = await safeFetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal,
        maxRedirects: 5
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      return res.status(400).json({
        success: false,
        error: `Could not connect to ${targetUrl}: ${fetchErr.message || 'Connection failed or timed out.'}`
      });
    }
    clearTimeout(timeoutId);

    const fetchRes = safeResult.res;
    const responseTimeMs = Date.now() - startTime;
    const finalUrl = safeResult.finalUrl || targetUrl;
    const finalParsed = new URL(finalUrl);
    const domain = finalParsed.hostname;

    let pageTitle = domain;
    let metaDescription = '';
    let ogImage = '';
    let favicon = `${finalParsed.origin}/favicon.ico`;
    let platform = 'Custom eCommerce Web Architecture';

    let internalLinksCount = 0;
    let availablePagesCount = 1;
    let sampleDiscoveredUrls: string[] = ['/'];
    let sitemapUrlCount = 0;
    let hasSitemap = false;
    try {
      const html = await readResponseBodyWithLimit(fetchRes, 2 * 1024 * 1024);
      const $ = cheerio.load(html);

      pageTitle = $('title').first().text().trim() || domain;
      metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                        $('meta[property="og:description"]').attr('content')?.trim() || '';
      ogImage = $('meta[property="og:image"]').attr('content')?.trim() || 
                $('meta[name="twitter:image"]').attr('content')?.trim() || '';
      
      const iconHref = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').first().attr('href');
      if (iconHref) {
        favicon = iconHref.startsWith('http') ? iconHref : new URL(iconHref, finalUrl).toString();
      }

      // Count unique internal links as a proxy for site scale and crawlable scope
      const normalizeHost = (h: string) => h.replace(/^www\./i, '').toLowerCase();
      const targetHost = normalizeHost(domain);
      const discoveredUrls = new Set<string>();

      // Add homepage as first discovered path
      try {
        discoveredUrls.add(new URL(finalUrl).pathname || '/');
      } catch {}

      $('a[href]').each((_, el) => {
        const rawHref = $(el).attr('href')?.trim();
        if (rawHref && 
            !rawHref.startsWith('#') && 
            !rawHref.startsWith('javascript:') && 
            !rawHref.startsWith('mailto:') && 
            !rawHref.startsWith('tel:') &&
            !rawHref.startsWith('data:')) {
          try {
            const resolved = new URL(rawHref, finalUrl);
            if (normalizeHost(resolved.hostname) === targetHost) {
              const pathname = resolved.pathname;
              // Exclude static media, binary files, stylesheets, scripts
              if (!/\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|pdf|zip|mp4|webm|ico)$/i.test(pathname)) {
                discoveredUrls.add(pathname || '/');
              }
            }
          } catch {}
        }
      });
      internalLinksCount = discoveredUrls.size;

      // Check for sitemap with SSRF-safe probe and extract discovered sitemap URLs
      try {
        const sitemapUrl = new URL('/sitemap.xml', finalUrl).toString();
        const sitemapRes = await safeFetch(sitemapUrl, { method: 'GET', maxRedirects: 4 });
        if (sitemapRes.res.ok) {
          hasSitemap = true;
          const sitemapText = await readResponseBodyWithLimit(sitemapRes.res, 512 * 1024);
          const locMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/gi) || [];
          sitemapUrlCount = locMatches.length;
          for (const m of locMatches) {
            const locUrl = m.replace(/<\/?loc>/gi, '').trim();
            try {
              const parsedLoc = new URL(locUrl);
              if (normalizeHost(parsedLoc.hostname) === targetHost) {
                const path = parsedLoc.pathname;
                if (!/\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|pdf|zip|mp4|webm|ico)$/i.test(path)) {
                  discoveredUrls.add(path || '/');
                }
              }
            } catch {}
          }
        }
      } catch {}

      // Fallback check for /sitemap_index.xml if /sitemap.xml yielded nothing
      if (!hasSitemap) {
        try {
          const sitemapIndexUrl = new URL('/sitemap_index.xml', finalUrl).toString();
          const sitemapIndexRes = await safeFetch(sitemapIndexUrl, { method: 'GET', maxRedirects: 4 });
          if (sitemapIndexRes.res.ok) {
            hasSitemap = true;
            const sitemapText = await readResponseBodyWithLimit(sitemapIndexRes.res, 512 * 1024);
            const locMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/gi) || [];
            sitemapUrlCount = locMatches.length;
          }
        } catch {}
      }

      // Compute total available pages and clean sample URLs for pre-audit selection
      availablePagesCount = Math.max(discoveredUrls.size, 1);
      sampleDiscoveredUrls = Array.from(discoveredUrls).slice(0, 20);

      // Detect eCommerce platform
      const htmlLower = html.toLowerCase();
      if (htmlLower.includes('cdn.shopify.com') || htmlLower.includes('window.shopify') || htmlLower.includes('shopify-section')) {
        platform = 'Shopify';
      } else if (htmlLower.includes('mage/cookies') || htmlLower.includes('magento') || htmlLower.includes('varien/form')) {
        platform = 'Adobe Commerce / Magento';
      } else if (htmlLower.includes('wp-content') || htmlLower.includes('woocommerce')) {
        platform = 'WooCommerce';
      } else if (htmlLower.includes('bigcommerce') || htmlLower.includes('cdn11.bigcommerce.com')) {
        platform = 'BigCommerce';
      } else if (htmlLower.includes('salesforce') || htmlLower.includes('demandware.static')) {
        platform = 'Salesforce Commerce Cloud';
      } else if (htmlLower.includes('__next') || htmlLower.includes('_next/static')) {
        platform = 'Next.js / Headless Commerce';
      } else if (htmlLower.includes('prestashop')) {
        platform = 'PrestaShop';
      }
    } catch (parseErr) {
      console.warn('Error parsing inspected page HTML:', parseErr);
    }

    const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(finalUrl)}?w=960`;
    const fallbackScreenshotUrl = `https://image.thum.io/get/width/960/crop/650/${encodeURIComponent(finalUrl)}`;

    return res.json({
      success: true,
      inputUrl: url,
      resolvedUrl: finalUrl,
      domain,
      pageTitle,
      metaDescription,
      favicon,
      ogImage,
      screenshotUrl,
      fallbackScreenshotUrl,
      httpStatus: fetchRes.status,
      responseTimeMs,
      platform,
      internalLinksCount,
      availablePagesCount,
      pagesDiscoveredCount: availablePagesCount,
      sampleDiscoveredUrls,
      sitemapUrlCount,
      hasSitemap,
      isHttps: finalUrl.startsWith('https://'),
      securityStatus: finalUrl.startsWith('https://') ? 'Valid TLS / HTTPS Encrypted' : 'Non-SSL (HTTP Only)'
    });
  } catch (err: any) {
    console.error('Inspect URL error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to inspect URL' });
  }
});

// Endpoint to preview available pages for scraping before running full audit
app.post('/api/discover-pages', inspectLimiter, async (req: Request, res: Response) => {
  try {
    const { url, depth } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Target URL is required.' });
    }
    const validation = await validateTargetUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const targetUrl = validation.normalizedUrl!;
    const crawlResult = await crawlWebsite(targetUrl, depth || 'standard', undefined, 50);
    res.json({
      success: true,
      discoveredCount: crawlResult.pagesDiscoveredCount,
      inspectedCount: crawlResult.pagesInspected.length,
      pages: crawlResult.pagesInspected.map(p => ({
        url: p.url,
        title: p.title,
        pageType: p.pageType,
        status: p.status
      })),
      failedPages: crawlResult.failedPages
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to discover pages.' });
  }
});

/** Fetches robots.txt once for the audit. Errors are reported as 'error', never assumed open or closed. */
async function fetchRobotsForAudit(targetUrl: string): Promise<{ status: 'fetched' | 'absent' | 'error'; text: string | null }> {
  try {
    const origin = new URL(targetUrl).origin;
    const r = await safeFetch(`${origin}/robots.txt`, {
      method: 'GET',
      maxRedirects: 4,
      headers: { 'User-Agent': 'SmollanDigitalAuditor/1.0 (+https://ecompletecommerce.co.za/auditor)' }
    });
    // 404 means no robots rules apply, so every bot is allowed; use empty text.
    if (r.res.status === 404) return { status: 'absent', text: '' };
    if (!r.res.ok) return { status: 'error', text: null };
    return { status: 'fetched', text: await readResponseBodyWithLimit(r.res, 512 * 1024) };
  } catch {
    return { status: 'error', text: null };
  }
}

// Deterministic Measured Findings Builder - zero invented or mock findings
function buildMeasuredFindings(
  pagesInspected: any[],
  failedPages: any[],
  targetUrl: string,
  renderedProductEvidence: any[] = [],
  unavailableProductEvidenceUrls: string[] = []
): any[] {
  const findings: any[] = [];
  let idCounter = 1;

  const nextId = () => {
    const id = `MSR-${String(idCounter).padStart(2, '0')}`;
    idCounter++;
    return id;
  };

  // 1. Missing Alt Attributes (Accessibility)
  const pagesWithMissingAlt = pagesInspected.filter(p => p.missingAltCount > 0);
  for (const page of pagesWithMissingAlt) {
    findings.push({
      id: nextId(),
      title: 'Images missing descriptive alt attributes',
      category: 'Accessibility',
      affectedUrl: page.url,
      observedEvidence: `${page.missingAltCount} of ${page.imagesCount} images missing alt text`,
      businessImpact: 'Degrades screen-reader accessibility and hinders image indexation.',
      severity: 'Essential',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Add descriptive alt text to all product and UI images.',
      serviceLine: 'UX/UI & Conversion-Rate Optimisation',
      source: 'measured'
    });
  }

  // 2. Mobile Viewport Missing (Mobile Optimisation)
  const pagesMissingViewport = pagesInspected.filter(p => !p.hasMetaViewport);
  for (const page of pagesMissingViewport) {
    findings.push({
      id: nextId(),
      title: 'Missing mobile viewport meta tag',
      category: 'Mobile Optimisation',
      affectedUrl: page.url,
      observedEvidence: 'HTML head lacks <meta name="viewport"> configuration tag',
      businessImpact: 'Mobile viewports render in desktop scale, causing severe interaction friction.',
      severity: 'Essential',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Add responsive viewport meta tag with width=device-width, initial-scale=1.',
      serviceLine: 'Ecommerce Website Development & Migration',
      source: 'measured'
    });
  }

  // 3. High Latency / Slow TTFB (Page Speed)
  const slowPages = pagesInspected.filter(p => p.loadTimeMs > 2000);
  for (const page of slowPages) {
    findings.push({
      id: nextId(),
      title: 'Elevated server response latency',
      category: 'Page Speed',
      affectedUrl: page.url,
      observedEvidence: `Server response time measured at ${page.loadTimeMs}ms`,
      businessImpact: 'Slower initial server response increases bounce rate on entry pages.',
      severity: 'Recommended',
      confidence: 'High',
      effort: 'medium',
      proposedRemedy: 'Optimize database queries, apply page-level caching, and utilize edge CDN distribution.',
      serviceLine: 'Ecommerce Website Development & Migration',
      source: 'measured'
    });
  }

  // 4. Missing Canonical URL (SEO Foundations)
  const pagesMissingCanonical = pagesInspected.filter(p => !p.hasCanonical);
  for (const page of pagesMissingCanonical) {
    findings.push({
      id: nextId(),
      title: 'Canonical URL reference missing',
      category: 'SEO Foundations',
      affectedUrl: page.url,
      observedEvidence: 'HTML head missing <link rel="canonical"> tag',
      businessImpact: 'Allows duplicate content indexing across URL query variations.',
      severity: 'Recommended',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Implement self-referencing canonical tag on all indexed pages.',
      serviceLine: 'SEO & Discoverability',
      source: 'measured'
    });
  }

  // 5. Product Page missing Sizing Guide (only flagged for retail products with prices and sizing variants)
  const productsMissingSize = pagesInspected.filter(p => {
    if (p.pageType !== 'product' || p.hasSizeGuide) return false;
    return p.hasPrice && /(?:select\s*size|size:|sizing|shoes|footwear|apparel|clothing|dress|shirt|pants|jacket|uk\s*\d|eu\s*\d|\bsmall\b|\bmedium\b|\blarge\b|\bxs\b|\bxl\b|\bxxl\b)/i.test((p.title || '') + ' ' + (p.description || '') + ' ' + (p.url || ''));
  });
  for (const page of productsMissingSize) {
    findings.push({
      id: nextId(),
      title: 'Size guide absent on product detail page',
      category: 'Conversion Efficiency',
      affectedUrl: page.url,
      observedEvidence: 'Product detail page has no sizing guide trigger adjacent to variants',
      businessImpact: 'Increases sizing hesitation and cart abandonment on apparel and footwear items.',
      severity: 'Essential',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Add inline modal or drawer sizing guide next to the variant selector.',
      serviceLine: 'UX/UI & Conversion-Rate Optimisation',
      source: 'measured'
    });
  }

  // 6. Product price, availability, and purchase controls from direct or rendered evidence
  const evidenceUrlKey = (url: string) => {
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      return parsed.toString();
    } catch {
      return url;
    }
  };

  const productEvidenceMap = new Map<string, any>();
  pagesInspected.filter(page => page.pageType === 'product').forEach(page => {
    productEvidenceMap.set(evidenceUrlKey(page.url), {
      ...page,
      sources: page.evidenceSources?.length ? [...page.evidenceSources] : ['direct_html']
    });
  });

  renderedProductEvidence.filter(page => page.isProductPage).forEach(page => {
    const key = evidenceUrlKey(page.url);
    const existing = productEvidenceMap.get(key);
    if (existing) {
      existing.hasPrice = existing.hasPrice === true || page.hasPrice;
      existing.hasStock = existing.hasStock === true || page.hasStock;
      existing.hasAddToCart = existing.hasAddToCart === true || page.hasAddToCart;
      if (!existing.sources.includes(page.source)) existing.sources.push(page.source);
    } else {
      productEvidenceMap.set(key, { ...page, sources: [page.source] });
    }
  });

  const unavailableKeys = new Set(unavailableProductEvidenceUrls.map(evidenceUrlKey));

  for (const page of productEvidenceMap.values()) {
    if (unavailableKeys.has(evidenceUrlKey(page.url))) continue;
    const sourceName = page.sources.includes('Firecrawl') ? 'Firecrawl-rendered HTML' : 'direct HTML';

    if (page.hasPrice === false) {
      findings.push({
        id: nextId(),
        title: 'Product pricing data not visible to crawler',
        category: 'Product Merchandising',
        affectedUrl: page.url,
        observedEvidence: `No currency or price pattern detected in ${sourceName}.`,
        businessImpact: 'Shoppers and search crawlers cannot determine item price directly from HTML.',
        severity: 'Essential',
        confidence: 'High',
        effort: 'medium',
        proposedRemedy: 'Ensure server-rendered pricing elements with structured Product schema.',
        serviceLine: 'Product Catalogue & Merchandising Management',
        source: 'measured'
      });
    }

    if (page.hasStock === false) {
      findings.push({
        id: nextId(),
        title: 'Product availability is not visible',
        category: 'Product Merchandising',
        affectedUrl: page.url,
        observedEvidence: `No stock or availability status detected in ${sourceName}.`,
        businessImpact: 'Shoppers cannot confirm whether the product can be purchased before adding it to the cart.',
        severity: 'Recommended',
        confidence: 'High',
        effort: 'low',
        proposedRemedy: 'Display a clear stock or availability message next to product options.',
        serviceLine: 'Product Catalogue & Merchandising Management',
        source: 'measured'
      });
    }

    if (page.hasAddToCart === false) {
      findings.push({
        id: nextId(),
        title: 'Add-to-cart control not detected',
        category: 'Conversion Efficiency',
        affectedUrl: page.url,
        observedEvidence: `No add-to-cart or buy-now control detected in ${sourceName}.`,
        businessImpact: 'Shoppers may be unable to identify how to begin a purchase from the product page.',
        severity: 'Essential',
        confidence: 'High',
        effort: 'medium',
        proposedRemedy: 'Expose a clear, accessible purchase control on the product page.',
        serviceLine: 'UX/UI & Conversion-Rate Optimisation',
        source: 'measured'
      });
    }
  }

  // 7. Broken / Failed URLs (Technical Resilience)
  for (const fp of failedPages) {
    findings.push({
      id: nextId(),
      title: 'Failed page request or broken link',
      category: 'Technical Resilience',
      affectedUrl: fp.url,
      observedEvidence: `HTTP error status ${fp.status}: ${fp.error}`,
      businessImpact: 'Direct 4xx/5xx failure breaks shopper journey and harms search crawl efficiency.',
      severity: 'Essential',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Fix broken internal link or configure 301 permanent redirect.',
      serviceLine: 'Ecommerce Website Development & Migration',
      source: 'measured'
    });
  }

  // 8. Missing Meta Description (SEO Foundations)
  const pagesMissingDesc = pagesInspected.filter(p => !p.description || p.description.trim() === '');
  for (const page of pagesMissingDesc) {
    findings.push({
      id: nextId(),
      title: 'Empty meta description tag',
      category: 'SEO Foundations',
      affectedUrl: page.url,
      observedEvidence: 'Meta description tag is missing or empty in head',
      businessImpact: 'Search engines display arbitrary text in search results, reducing CTR.',
      severity: 'Content & Settings',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Add unique, concise meta description summarizing the page content.',
      serviceLine: 'SEO & Discoverability',
      source: 'measured'
    });
  }

  // 9. Missing H1 Heading (SEO Foundations)
  const pagesMissingH1 = pagesInspected.filter(p => !p.h1s || p.h1s.length === 0);
  for (const page of pagesMissingH1) {
    findings.push({
      id: nextId(),
      title: 'Primary H1 heading missing',
      category: 'SEO Foundations',
      affectedUrl: page.url,
      observedEvidence: 'Page document structure contains 0 H1 elements',
      businessImpact: 'Weakens semantic document hierarchy for accessibility screen readers.',
      severity: 'Content & Settings',
      confidence: 'High',
      effort: 'low',
      proposedRemedy: 'Include a single descriptive H1 heading at the top of the main content.',
      serviceLine: 'SEO & Discoverability',
      source: 'measured'
    });
  }

  return findings;
}

// Build deterministic executive verdict purely from measured checks
function buildMeasuredVerdict(categoryResults: Record<string, { score: number; checks: any[] }>) {
  let totalChecks = 0;
  let failedOrPartialChecks = 0;

  Object.values(categoryResults).forEach(cat => {
    (cat.checks || []).forEach((c: any) => {
      totalChecks++;
      if (c.status === 'fail' || c.status === 'partial') {
        failedOrPartialChecks++;
      }
    });
  });

  const sortedCats = Object.entries(categoryResults).sort((a, b) => a[1].score - b[1].score);
  const weakest = sortedCats[0] || ['Conversion Efficiency', { score: 60 }];
  const strongest = sortedCats[sortedCats.length - 1] || ['Security & TLS', { score: 95 }];

  return {
    headline: `Measured: ${failedOrPartialChecks} of ${totalChecks} checks failed. Lowest area: ${weakest[0]} (${weakest[1].score}%).`,
    summaryText: `Strongest area: ${strongest[0]} (${strongest[1].score}%). Prioritize remediation on ${weakest[0]} to eliminate measured friction points.`
  };
}

// Run audit endpoint using most affordable model: gemini-3.1-flash-lite (with rate limiting and SSRF protection)
export async function runAudit(auditId: string, params: any) {
  try {
    const { url, businessName, businessCategory, targetMarket, primaryObjective, depth, siteType, mode, allowCartJourney, cartJourneyConfirmed, maxPages } = params;
    const targetUrl = url;
    const auditDepth = depth;
    const auditStartTime = Date.now();

    logAudit(auditId, 'Initializing audit...');

    // 1. Crawl the website
    const crawlResult = await crawlWebsite(targetUrl, auditDepth, auditId, maxPages);
    checkCancelled(auditId);
    
    // Critical Path Check: Ensure homepage is accessible
    const homepage = crawlResult.pagesInspected.find(p => p.pageType === 'homepage');
    let crawlErrorNotice: string | null = null;
    if (!homepage) {
        const error = crawlResult.failedPages.length > 0 ? crawlResult.failedPages[0].error : 'Homepage unreachable';
        logAudit(auditId, `Crawl notice: Homepage inaccessible (${error}). Proceeding with diagnostic evaluation and recovery plan...`);
        crawlErrorNotice = error;
    } else {
        logAudit(auditId, 'Crawl complete. Necessary sections verified.');
    }

    // 1b. Call browser worker for rendered checks (if homepage accessible)
    let workerDurationMs = 0;
    let workerResults: Record<string, any> = {};
    // Only the homepage is evaluated by the worker today; collection/product/cart are not implemented.
    const scenariosRun = ['home'];
    if (homepage) {
      logAudit(auditId, 'Initiating rendered checks...');
      try {
        const workerCheckIds = CATEGORY_RULESET.flatMap(c => c.checks.map(chk => chk.id));
        const workerRes = await callBrowserWorker({
          url: targetUrl,
          scenario: 'home',
          checkIds: workerCheckIds,
          allowCartJourney: !!allowCartJourney && !!cartJourneyConfirmed
        });
        checkCancelled(auditId);
        logAudit(auditId, 'Rendered checks complete.');
        workerDurationMs = workerRes.durationMs;
        if (workerRes && workerRes.results) {
          workerResults = workerRes.results;
        }
      } catch (workerErr: any) {
        logAudit(auditId, `Rendered check notice: ${workerErr.message || 'Worker skipped'}`);
      }
    }

    // 2. Calculate scores deterministically
    logAudit(auditId, 'Calculating scores...');
    const scoring = calculateScores({
      pagesInspected: crawlResult.pagesInspected,
      failedPages: crawlResult.failedPages,
      pagesDiscoveredCount: crawlResult.pagesDiscoveredCount,
      tlsInfo: crawlResult.tlsInfo,
      privacyPolicyFound: crawlResult.privacyPolicyFound,
      trustMarkersCount: crawlResult.trustMarkersCount,
      homepageReachable: !!homepage,
      homepageFailReason: crawlErrorNotice || undefined,
      workerResults,
      renderedProductEvidence: crawlResult.renderedProductEvidence,
      unavailableProductEvidenceUrls: crawlResult.unavailableProductEvidenceUrls,
      renderedFallback: crawlResult.renderedFallback
    });
    checkCancelled(auditId);

    // 3. Build deterministic measured findings from failed or partial checks
    logAudit(auditId, 'Compiling findings...');
    const measuredFindings = buildMeasuredFindings(
      crawlResult.pagesInspected,
      crawlResult.failedPages,
      targetUrl,
      crawlResult.renderedProductEvidence,
      crawlResult.unavailableProductEvidenceUrls
    );

    // If crawl encountered an error notice or no pages inspected, prepend critical accessibility finding
    if (crawlErrorNotice || crawlResult.pagesInspected.length === 0) {
      measuredFindings.unshift({
        id: 'MSR-00',
        title: 'Storefront Accessibility & Bot Access Restricted',
        category: 'Technical Resilience and Security',
        affectedUrl: targetUrl,
        observedEvidence: crawlErrorNotice || 'Target storefront returned error or blocked crawler access.',
        businessImpact: 'Prevents search engine indexing, automated commerce benchmarking, and third-party commercial verification, dampening reach and conversion.',
        severity: 'Essential',
        confidence: 'High',
        effort: 'medium',
        proposedRemedy: 'Whitelist Smollan Digital Auditor in Cloudflare / AWS WAF rules, inspect origin server HTTP 200 responses, and ensure public catalog paths are accessible.',
        serviceLine: 'Website Performance & Technical Optimisation',
        source: 'measured'
      });
    }

    // 4. Build deterministic executive verdict from category scores
    let executiveVerdict = buildMeasuredVerdict(scoring.categoryResults);
    if (crawlErrorNotice) {
      executiveVerdict = {
        headline: `Diagnostic Notice: Storefront access restriction (${crawlErrorNotice}). Score reached: ${scoring.overallScore}/100.`,
        summaryText: `Automated inspection encountered server or bot restrictions. Implement Technical Resilience and WAF allowlisting to recover up to ${scoring.projectedOverallScore}/100.`
      };
    }
    let activeFindings = measuredFindings;
    let aiNarrativeStatus: 'generated' | 'unavailable' = 'unavailable';

    // (AI narrative generation logic, using standard implementation)
    // Build crawled URL set and input string for strict validation
    const crawledUrlSet = new Set<string>();
    crawledUrlSet.add(targetUrl);
    crawlResult.pagesInspected.forEach(p => crawledUrlSet.add(p.url));
    crawlResult.failedPages.forEach(p => crawledUrlSet.add(p.url));

    const inputDataString = JSON.stringify({ categoryResults: scoring.categoryResults, measuredFindings });
    const inputNumbers = new Set(inputDataString.match(/\b\d+(\.\d+)?\b/g) || []);

    // AI is used for verdict wording only. It cannot add, remove or change findings or scores.
    const ai = getAI();
    if (ai && measuredFindings.length > 0 && !crawlErrorNotice) {
      try {
        const prompt = `You are an eCommerce auditor. Write a short executive verdict for ${targetUrl}. Measured score: ${scoring.overallScore}/100. Do not invent facts, figures or percentages. Return JSON only: {"executiveVerdict": {"headline": "under 12 words", "summaryText": "under 35 words"}}`;
        const response = await ai.models.generateContent({ model: AI_MODEL, contents: prompt, config: { responseMimeType: 'application/json' } });
        const parsed = JSON.parse(response.text || '{}');
        const v = parsed?.executiveVerdict;
        if (isShortText(v?.headline, 12) && isShortText(v?.summaryText, 35)) {
          executiveVerdict = { headline: v.headline.trim(), summaryText: v.summaryText.trim() };
          aiNarrativeStatus = 'generated';
        } else {
          logAudit(auditId, 'AI verdict rejected (wrong shape or length); using the measured verdict.');
        }
      } catch {
        logAudit(auditId, 'AI verdict unavailable; using the measured verdict.');
      }
    }

    const essentialCount = activeFindings.filter(f => f.severity === 'Essential').length;
    const isComparison = mode === 'comparison';

    // Measured run statistics only. No cost estimates: those were fabricated constants.
    const runStats = {
      executionTimeMs: Date.now() - auditStartTime,
      pagesScannedCount: crawlResult.pagesInspected.length
    };

    // Agentic-commerce signals: measured on inspected pages and robots.txt only.
    // No readiness score, layer scores, market figures or vendor capability claims.
    const robots = crawlResult.robots;
    const jsonLdTypesFound = Array.from(new Set(crawlResult.pagesInspected.flatMap((p: any) => p.jsonLdTypes || []))).sort();
    const pagesWithJsonLd = crawlResult.pagesInspected.filter((p: any) => (p.jsonLdTypes || []).length > 0).length;
    const agenticCommerce = {
      measured: {
        jsonLd: {
          typesFound: jsonLdTypesFound,
          requiredTypes: [...REQUIRED_SCHEMA_TYPES],
          missingRequiredTypes: REQUIRED_SCHEMA_TYPES.filter(t => !jsonLdTypesFound.includes(t)),
          pagesWithJsonLd,
          pagesInspected: crawlResult.pagesInspected.length
        },
        robots: {
          status: robots.status,
          aiBots: evaluateAiBotAccess(robots.text, AI_BOTS)
        },
        https: targetUrl.startsWith('https://')
      },
      notMeasured: [
        'GTIN and MPN catalogue coverage (needs catalogue or feed access)',
        'Live inventory and price sync latency (needs API or feed access)',
        'Agent checkout and payment protocol readiness (needs merchant configuration)',
        'Share of AI-assistant answers or citations (needs external query testing)',
        'Conversion or revenue impact (needs analytics access)'
      ]
    };

    const auditRecord = {
      id: `AUD-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      url: targetUrl,
      businessName: businessName || new URL(targetUrl).hostname,
      businessCategory: businessCategory || 'Ecommerce / Retail',
      targetMarket: targetMarket || 'South Africa',
      primaryObjective: primaryObjective || 'sales',
      primaryKeyword: params.primaryKeyword,
      depth: auditDepth,
      siteType: siteType || (businessCategory?.toLowerCase().includes('service') || businessCategory?.toLowerCase().includes('agency') || businessCategory?.toLowerCase().includes('consulting') ? 'service' : 'ecommerce'),
      schemaVersion: SCHEMA_VERSION,
      rulesetVersion: scoring.rulesetVersion,
      overallScore: scoring.overallScore,
      projectedOverallScore: scoring.projectedOverallScore,
      scoreUplift: scoring.scoreUplift,
      categoryResults: scoring.categoryResults,
      measurements: scoring.measurements,
      industryBenchmarks: calculateIndustryBenchmarks(scoring.categoryResults),
      pagesInspected: crawlResult.pagesInspected,
      crawlSummary: { discovered: crawlResult.pagesDiscoveredCount, inspected: crawlResult.pagesInspected.length, failed: crawlResult.failedPages.length, robotsBlocked: crawlResult.robotsBlocked.length },
      metrics: {
        sessions: { value: 'Requires Analytics Integration', status: 'customer_data_required' },
        pageSpeed: { value: crawlResult.pagesInspected.length > 0 ? `${Math.round(crawlResult.pagesInspected.reduce((a, b) => a + b.loadTimeMs, 0) / (crawlResult.pagesInspected.length || 1))}ms` : 'N/A', status: 'measured' },
        performanceScore: { value: scoring.overallScore.toString(), status: 'measured' },
        brokenLinks: { value: crawlResult.failedPages.length.toString(), status: 'measured' }
      },
      executiveVerdict,
      findings: activeFindings,
      summaryCounts: { total: activeFindings.length, essential: essentialCount, recommended: activeFindings.filter(f => f.severity === 'Recommended').length, content: activeFindings.filter(f => f.severity === 'Content & Settings').length },
      aiNarrativeStatus,
      type: isComparison ? ('competitor' as const) : ('prospect' as const),
      workerDurationMs,
      scenariosRun,
      cartJourneyRun: false, // not implemented; see docs/KNOWN_LIMITATIONS.md item 5
      auditError: crawlErrorNotice,
      agenticCommerce,
      runStats,
      evaluationNotice: crawlErrorNotice ? {
        type: 'error' as const,
        title: 'Crawl Access Restriction Detected',
        description: crawlErrorNotice,
        remediationSteps: [
          'Allowlist Smollan Digital Auditor in Cloudflare / AWS WAF rules',
          'Inspect server error logs and verify HTTP 200 responses on public URLs',
          'Enforce valid TLS / HTTPS certificates and eliminate redirect loops',
          'Engage Smollan Cloud Engineering to optimize TTFB and edge acceleration'
        ],
        affectedUrl: targetUrl
      } : undefined
    };

    checkCancelled(auditId);
    const audits = readStorage(AUDITS_FILE);
    audits.unshift(auditRecord);
    writeStorage(AUDITS_FILE, audits);

    let leadRecord: any = null;
    if (!isComparison) {
      leadRecord = {
        id: `LEAD-${crypto.randomUUID()}`,
        auditId: auditRecord.id,
        businessName: auditRecord.businessName,
        domain: targetUrl,
        overallScore: scoring.overallScore,
        projectedScore: scoring.projectedOverallScore,
        priority: scoring.overallScore < 70 ? 'High' : scoring.overallScore < 85 ? 'Medium' : 'Low',
        priorityReason: crawlErrorNotice 
          ? `Storefront returned access error (${crawlErrorNotice}). Score reached ${scoring.overallScore}/100. Urgent remediation required.`
          : `Storefront overall score measured at ${scoring.overallScore}/100 with ${essentialCount} essential friction point(s) identified.`,
        status: 'New',
        topFindings: activeFindings.slice(0, 3),
        recommendedServices: Array.from(new Set(activeFindings.map(f => f.serviceLine))),
        createdAt: new Date().toISOString()
      };
      const leads = readStorage(LEADS_FILE);
      leads.unshift(leadRecord);
      writeStorage(LEADS_FILE, leads);
    }
    
    logAudit(auditId, 'Audit complete.');
    auditStatusMap.set(auditId, { 
      status: 'complete', 
      logs: auditStatusMap.get(auditId)!.logs, 
      result: { audit: auditRecord, lead: leadRecord } 
    });
  } catch (err: any) {
    if (err?.message === 'cancelled') {
      logAudit(auditId, 'Audit cancelled; no record was persisted.');
      return;
    }
    if (err instanceof StorageCorruptError) {
      logAudit(auditId, `Audit aborted: ${err.message}`);
      auditStatusMap.set(auditId, { status: 'failed', logs: auditStatusMap.get(auditId)!.logs, error: 'storage_corrupt' });
      return;
    }
    logAudit(auditId, `Evaluation notice: ${err.message}. Building diagnostic evaluation report...`);
    const scoring = calculateScores({
      pagesInspected: [],
      failedPages: [{ url: params.url, status: 500, error: err.message }],
      homepageReachable: false,
      homepageFailReason: err.message
    });
    const emergencyFindings = [{
      id: 'ERR-01',
      title: 'Storefront Diagnostic Evaluation Exception',
      category: 'Technical Resilience and Security',
      affectedUrl: params.url,
      observedEvidence: err.message || 'Evaluation process encountered an access or execution exception',
      businessImpact: 'Storefront technical evaluation encountered an error. Technical review required.',
      severity: 'Essential' as const,
      confidence: 'High' as const,
      effort: 'medium' as const,
      proposedRemedy: 'Review network connectivity, ensure target storefront is online, and allowlist audit bots in WAF.',
      serviceLine: 'Website Performance & Technical Optimisation',
      source: 'measured' as const
    }];
    const emergencyAudit = {
      id: `AUD-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      url: params.url,
      businessName: params.businessName || 'Storefront Prospect',
      businessCategory: params.businessCategory || 'Ecommerce',
      targetMarket: params.targetMarket || 'South Africa',
      primaryObjective: params.primaryObjective || 'sales',
      primaryKeyword: params.primaryKeyword,
      depth: params.depth || 'standard',
      schemaVersion: SCHEMA_VERSION,
      rulesetVersion: scoring.rulesetVersion,
      overallScore: scoring.overallScore,
      projectedOverallScore: scoring.projectedOverallScore,
      scoreUplift: scoring.scoreUplift,
      categoryResults: scoring.categoryResults,
      measurements: scoring.measurements,
      industryBenchmarks: calculateIndustryBenchmarks(scoring.categoryResults),
      pagesInspected: [],
      crawlSummary: { discovered: 1, inspected: 0, failed: 1 },
      metrics: {
        sessions: { value: 'Requires Analytics Integration', status: 'customer_data_required' },
        pageSpeed: { value: 'N/A', status: 'measured' },
        performanceScore: { value: scoring.overallScore.toString(), status: 'measured' },
        brokenLinks: { value: '1', status: 'measured' }
      },
      executiveVerdict: {
        headline: `Evaluation Completed with Diagnostic Notice: ${err.message}`,
        summaryText: `The evaluation reached a score of ${scoring.overallScore}/100 with essential fixes identified to recover up to ${scoring.projectedOverallScore}/100.`
      },
      findings: emergencyFindings,
      summaryCounts: { total: 1, essential: 1, recommended: 0, content: 0 },
      auditError: err.message,
      evaluationNotice: {
        type: 'error' as const,
        title: 'Evaluation Error Encountered',
        description: err.message,
        remediationSteps: [
          'Verify storefront URL and ensure the domain resolves to an active web server',
          'Whitelist Smollan Digital Auditor in Cloudflare / WAF',
          'Check server response codes and SSL configuration'
        ],
        affectedUrl: params.url
      }
    };
    const emergencyLead = {
      id: `LEAD-${crypto.randomUUID()}`,
      auditId: emergencyAudit.id,
      businessName: emergencyAudit.businessName,
      domain: params.url,
      overallScore: scoring.overallScore,
      projectedScore: scoring.projectedOverallScore,
      priority: 'High' as const,
      priorityReason: `Evaluation encountered error: ${err.message}. Urgent infrastructure review recommended.`,
      status: 'New',
      topFindings: emergencyFindings,
      recommendedServices: ['Website Performance & Technical Optimisation'],
      createdAt: new Date().toISOString()
    };
    const audits = readStorage(AUDITS_FILE);
    audits.unshift(emergencyAudit);
    writeStorage(AUDITS_FILE, audits);
    auditStatusMap.set(auditId, {
      status: 'complete',
      logs: auditStatusMap.get(auditId)!.logs,
      result: { audit: emergencyAudit, lead: emergencyLead }
    });
  }
}

app.post('/api/audit', auditLimiter, async (req: Request, res: Response) => {
  const { url, depth, maxPages } = req.body || {};
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Target URL is required.' });
  }

  const validation = await validateTargetUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  // Cap maxPages to a maximum allowed ceiling of 100 pages
  let cappedMaxPages: number | undefined = undefined;
  if (typeof maxPages === 'number' && !isNaN(maxPages)) {
    cappedMaxPages = Math.min(100, Math.max(1, maxPages));
  } else if (typeof maxPages === 'string') {
    const parsed = parseInt(maxPages, 10);
    if (!isNaN(parsed)) {
      cappedMaxPages = Math.min(100, Math.max(1, parsed));
    }
  }

  const auditParams = {
    ...req.body,
    url: validation.normalizedUrl!,
    depth: ['quick', 'standard', 'deep'].includes(depth) ? depth : 'standard',
    maxPages: cappedMaxPages
  };

  pruneAuditStatus();
  const auditId = `AUD-${crypto.randomUUID()}`;
  auditStatusMap.set(auditId, { status: 'running', logs: ['[SYSTEM] Audit queued.'] });
  auditCreatedAt.set(auditId, Date.now());
  
  runAudit(auditId, auditParams).catch(console.error);

  res.json({ auditId });
});


// Generate email pitch endpoint via affordable gemini-3.1-flash-lite (with rate limiting and sender compliance)
app.post('/api/pitch', pitchLimiter, async (req: Request, res: Response) => {
  try {
    const { domain, brandName, overallScore, weakestCategory, strongestCategory, topFindings } = req.body;

    const resolvedWeakest = weakestCategory || 'storefront conversion paths';
    const resolvedStrongest = strongestCategory || 'core digital foundation';

    // Fallback options based purely on measured values without inventing unmeasured facts
    const defaultOptions = [
      {
        subject: `Measured Audit: Friction Points on ${brandName || domain}`,
        angle: 'Verified Commercial Friction Analysis',
        hook: `Following our measured technical and CRO assessment of ${domain} (overall score: ${overallScore}/100), our specialists verified specific friction points in ${resolvedWeakest}.`
      },
      {
        subject: `Storefront Inspection Findings: ${brandName || domain}`,
        angle: 'Deterministic Storefront Performance',
        hook: `Our technical crawl of ${domain} assessed performance across our automated storefront checklist. While ${resolvedStrongest} performed well, measured gaps were identified in ${resolvedWeakest}.`
      },
      {
        subject: `Audit Results & Recommendations: ${brandName || domain}`,
        angle: 'Targeted Remediation & Enhancement',
        hook: `We recently executed an automated storefront evaluation across ${domain}. Review of the verified DOM signals identified high-leverage opportunities in ${resolvedWeakest}.`
      }
    ];

    const senderBlock = {
      name: senderConfig.name,
      company: senderConfig.company,
      contactReason: senderConfig.contactReason,
      optOutNotice: senderConfig.optOutNotice
    };

    const ai = getAI();
    if (!ai) {
      return res.json({
        subjectLines: defaultOptions.map(o => o.subject),
        pitchOptions: defaultOptions,
        salutation: `Dear ${brandName || 'Digital Commerce'} Team,`,
        hook: defaultOptions[0].hook,
        coreEvidenceBody: (topFindings || []).map((f: any) => ({
          problemFound: f.title,
          pageLocation: f.category,
          commercialRisk: f.businessImpact,
          smollanRemedy: f.proposedRemedy
        })),
        callToAction: `We would welcome the opportunity to walk through the interactive enhancement prototype with your team. Would you be open to a brief 15-minute introductory call next week?`,
        recommendedDiscoveryQuestions: [
          `How are conversion rates in ${resolvedWeakest} currently tracking across peak shopping periods?`,
          `What is your technical roadmap for addressing measured findings in ${resolvedWeakest} before the upcoming code freeze?`
        ],
        senderIdentity: senderBlock,
        notice: 'AI features are currently limited. Please check your Gemini API key in the Settings > Secrets panel to enable full capabilities.'
      });
    }

    // Streamlined prompt in UK English to minimise token consumption
    const prompt = `Lead Commercial Strategist at Smollan Digital Commerce.
Draft a concise B2B sales email pitch based ONLY on these measured audit findings in UK English:
Domain: ${domain}
Brand: ${brandName}
Score: ${overallScore}/100
Strongest Area: ${resolvedStrongest}
Weakest Area: ${resolvedWeakest}
Findings:
${JSON.stringify((topFindings || []).slice(0, 3), null, 2)}

Do NOT assert unmeasured facts or claim secure checkout or mobile latency unless present in the findings.

Return JSON matching:
{
  "pitchOptions": [
    { "subject": "string", "angle": "string", "hook": "string" },
    { "subject": "string", "angle": "string", "hook": "string" },
    { "subject": "string", "angle": "string", "hook": "string" }
  ],
  "salutation": "string",
  "coreEvidenceBody": [
    {
      "problemFound": "string",
      "pageLocation": "string",
      "commercialRisk": "string",
      "smollanRemedy": "string"
    }
  ],
  "callToAction": "string",
  "recommendedDiscoveryQuestions": ["string", "string"]
}`;

    const outreachResponseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        pitchOptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              angle: { type: Type.STRING },
              hook: { type: Type.STRING }
            },
            required: ["subject", "angle", "hook"]
          }
        },
        salutation: { type: Type.STRING },
        coreEvidenceBody: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problemFound: { type: Type.STRING },
              pageLocation: { type: Type.STRING },
              commercialRisk: { type: Type.STRING },
              smollanRemedy: { type: Type.STRING }
            },
            required: ["problemFound", "pageLocation", "commercialRisk", "smollanRemedy"]
          }
        },
        callToAction: { type: Type.STRING },
        recommendedDiscoveryQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["pitchOptions", "salutation", "coreEvidenceBody", "callToAction", "recommendedDiscoveryQuestions"]
    };

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: outreachResponseSchema
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.pitchOptions || parsed.pitchOptions.length === 0) {
      parsed.pitchOptions = defaultOptions;
    }
    parsed.subjectLines = parsed.pitchOptions.map((o: any) => o.subject);
    parsed.hook = parsed.pitchOptions[0]?.hook || defaultOptions[0].hook;
    parsed.senderIdentity = senderBlock;

    res.json(parsed);
  } catch (err: any) {
    console.error('Pitch generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate pitch' });
  }
});

app.post('/api/executive-synopsis', async (req: Request, res: Response) => {
  const ai = getAI();
  if (!ai) {
    return res.status(200).json({ synopsis: "Note: AI executive summary is currently unavailable. Please ensure your Gemini API key is configured in the Settings > Secrets panel to enable automated strategic analysis." });
  }
  const { audit } = req.body;
  if (!audit) {
    return res.status(400).json({ error: 'Audit data is required for synopsis.' });
  }

  const prompt = `Provide a professional, enterprise-grade executive 2-paragraph synopsis for a digital commerce audit conducted for ${audit.businessName} (${audit.url}).
  
  Audit Context:
  - Overall Performance Score: ${audit.overallScore}/100
  - Projected Score after Smollan intervention: ${audit.projectedOverallScore}/100
  - Specific Findings Summary: ${JSON.stringify((audit.findings || []).slice(0, 5).map((f: any) => f.title))}
  - Target Market: ${audit.targetMarket || 'South Africa'}
  - Business Category: ${audit.businessCategory || 'Retail'}

  Instructions:
  1. The synopsis must be exactly two paragraphs.
  2. The first paragraph should forensicly summarize the current state, identifying specific friction points in the user journey (e.g. mobile responsiveness, checkout friction, SEO gaps).
  3. The second paragraph should persuasively outline the commercial opportunity and the 'Smollan Advantage', explaining the remediation path for the measured findings. Do not quantify revenue or conversion impact.
  4. Use a tone of authority, professionalism, and commercial intelligence. Do not use markdown bolding or bullets.`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
    });
    res.json({ synopsis: response.text });
  } catch (err: any) {
    console.error('Synopsis generation error:', err);
    const status = err.status || 500;
    if (status === 403 || status === 400) {
      return res.status(200).json({ synopsis: "Notice: The strategic synopsis could not be generated due to an invalid or restricted API key. Please verify your credentials in the Settings > Secrets panel." });
    }
    res.status(200).json({ synopsis: "Notice: Strategic synopsis generation encountered a temporary error. This may be due to high traffic or service limitations." });
  }
});

app.post('/api/qa-audit', async (req: Request, res: Response) => {
  try {
    const { url, html, pages, auditId } = req.body;
    let pagesToAudit: { url: string; html: string }[] = [];

    if (Array.isArray(pages) && pages.length > 0) {
      pagesToAudit = pages;
    } else if (typeof html === 'string' && html.trim().length > 0) {
      pagesToAudit = [{ url: url || 'https://target.local', html }];
    } else if (typeof url === 'string' && url.trim().length > 0) {
      const scraped = await scrapeRenderedPageWithFirecrawl(url.trim(), 10000);
      pagesToAudit = [{ url: scraped.sourceUrl || url.trim(), html: scraped.html }];
    } else if (typeof auditId === 'string' && auditId.trim().length > 0) {
      const audits = readStorage(AUDITS_FILE);
      const audit = audits.find(a => a.id === auditId);
      if (audit?.url) {
        const scraped = await scrapeRenderedPageWithFirecrawl(audit.url, 10000);
        pagesToAudit = [{ url: scraped.sourceUrl || audit.url, html: scraped.html }];
      }
    }

    if (pagesToAudit.length === 0) {
      return res.status(400).json({ error: 'Please provide page source HTML, target URL, or active audit ID to analyze.' });
    }

    const report = auditPageSource(pagesToAudit, url);
    res.json(report);
  } catch (err: any) {
    console.error('QA Source Audit error:', err);
    res.status(500).json({ error: err.message || 'QA source audit failed' });
  }
});

app.post('/api/qa-audit/export-excel', async (req: Request, res: Response) => {
  try {
    const report = req.body.report || req.body;
    if (!report || !Array.isArray(report.findings)) {
      return res.status(400).json({ error: 'Invalid audit report data for Excel export.' });
    }
    const buffer = await generateQaExcelWorkbook(report);
    const filename = `Technical-Website-QA-Audit-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err: any) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate Excel workbook' });
  }
});

// Vite middleware integration for development
if (IS_TEST) {
  // Tests import this module directly; do not start Vite.
} else if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!IS_TEST) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smollan Digital Commerce Audit platform running at http://0.0.0.0:${PORT}`);
  });
}

export { app, auditCreatedAt as __auditCreatedAtForTests };
