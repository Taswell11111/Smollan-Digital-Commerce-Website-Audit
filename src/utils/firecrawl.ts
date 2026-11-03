import { parseCrawlerHtml } from './crawlerHtml.js';
import { validateTargetUrl, type DnsLookupFunction } from './ssrf.js';

export const FIRECRAWL_MAX_PAGES = 2;
export const FIRECRAWL_TIME_BUDGET_MS = 12_000;
const MAX_REQUEST_TIMEOUT_MS = 7_000;

export interface ProductSignals {
  isProductPage: boolean;
  hasPrice: boolean;
  hasStock: boolean;
  hasAddToCart: boolean;
}

export interface RenderedProductEvidence extends ProductSignals {
  url: string;
  source: 'Firecrawl' | 'Rendered DOM';
  sourceUrl?: string;
}

export interface RenderedFallbackResult {
  status: 'not_needed' | 'measured' | 'unavailable';
  attemptedUrls: string[];
  evidence: RenderedProductEvidence[];
  unavailableUrls: string[];
  reason?: string;
}

export interface RenderedPage {
  html: string;
  sourceUrl?: string;
}

export type RenderedPageScraper = (url: string, timeoutMs: number) => Promise<RenderedPage>;

function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

function isProductPath(pathname: string): boolean {
  return /(?:^|\/)(?:products?|items?|p|sku-[^/]+|dp)(?:\/|$)/i.test(pathname);
}

function isProductUrl(rawUrl: string): boolean {
  try {
    return isProductPath(new URL(rawUrl).pathname);
  } catch {
    return false;
  }
}

function productUrlKey(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function extractProductSignals(
  $clean: any,
  visibleText: string,
  pageUrl: string
): ProductSignals {
  let pathname = '';
  try {
    pathname = new URL(pageUrl).pathname;
  } catch {}

  const isProductPage =
    isProductPath(pathname) ||
    $clean('.product-single, .product-main, .pdp, [itemtype*="Product"], .product-view, .product-detail').length > 0;

  const priceRegex =
    /(?:R|\$|€|£)\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|(?:\bZAR\b|\bUSD\b|\bEUR\b|\bGBP\b)\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?/i;
  const hasPrice = priceRegex.test(visibleText);

  const hasStock = /\b(?:in stock|out of stock|available now|sold out|only\s+\d+\s+(?:left|remaining)|pre[- ]order)\b/i.test(visibleText);

  const controlLabels: string[] = [];
  $clean('button, [role="button"], input[type="submit"], a.button, [class*="add-to-cart"], [class*="add_to_cart"]').each((_index: number, element: any) => {
    const node = $clean(element);
    controlLabels.push(
      node.text().trim(),
      node.attr('aria-label')?.trim() || '',
      node.attr('value')?.trim() || ''
    );
  });
  const hasAddToCart = /\b(?:add to (?:cart|bag|basket)|buy now)\b/i.test(controlLabels.join(' '));

  return { isProductPage, hasPrice, hasStock, hasAddToCart };
}

function findProductLinks($clean: any, pageUrl: string, allowedHost: string): string[] {
  const links = new Set<string>();
  $clean('a[href]').each((_index: number, element: any) => {
    const node = $clean(element);
    const href = node.attr('href')?.trim();
    if (!href || /^(?:#|javascript:|mailto:|tel:|data:)/i.test(href)) return;
    try {
      const resolved = new URL(href, pageUrl);
      if (
        (resolved.protocol === 'http:' || resolved.protocol === 'https:') &&
        normalizeHost(resolved.hostname) === allowedHost &&
        (isProductPath(resolved.pathname) ||
          node.closest('[class*="product"], [data-product-id], [itemtype*="Product"]').length > 0)
      ) {
        resolved.hash = '';
        links.add(resolved.toString());
      }
    } catch {}
  });
  return Array.from(links);
}

function needsRenderedEvidence(page: any): boolean {
  return page.hasPrice !== true || page.hasStock !== true || page.hasAddToCart !== true;
}

/**
 * Uses Firecrawl/Rendered DOM fallback when direct HTML misses required product signals.
 * Bounded by page limit, domain validation, and maximum time budget.
 */
export async function collectRenderedProductEvidence(options: {
  targetUrl: string;
  pagesInspected: any[];
  productCandidateUrls?: string[];
  scrapePage: RenderedPageScraper;
  customLookup?: DnsLookupFunction;
  maxPages?: number;
  timeBudgetMs?: number;
}): Promise<RenderedFallbackResult> {
  const {
    targetUrl,
    pagesInspected,
    productCandidateUrls = [],
    scrapePage,
    customLookup,
    maxPages = FIRECRAWL_MAX_PAGES,
    timeBudgetMs = FIRECRAWL_TIME_BUDGET_MS
  } = options;

  const directProducts = pagesInspected.filter(page => page.pageType === 'product');
  const missingProductPages = directProducts.filter(needsRenderedEvidence);

  if (directProducts.length > 0 && missingProductPages.length === 0) {
    return { status: 'not_needed', attemptedUrls: [], evidence: [], unavailableUrls: [] };
  }

  const deadline = Date.now() + Math.max(1, timeBudgetMs);

  const targetValidationPromise = validateTargetUrl(targetUrl, customLookup);
  let targetValidationTimer: ReturnType<typeof setTimeout> | undefined;
  const targetValidation = await Promise.race([
    targetValidationPromise,
    new Promise<null>(resolve => {
      targetValidationTimer = setTimeout(() => resolve(null), Math.max(1, deadline - Date.now()));
    })
  ]);
  if (targetValidationTimer) clearTimeout(targetValidationTimer);

  if (!targetValidation || !targetValidation.valid || !targetValidation.normalizedUrl) {
    return {
      status: 'unavailable',
      attemptedUrls: [],
      evidence: [],
      unavailableUrls: missingProductPages.map(page => page.url),
      reason: targetValidation?.error || 'Target URL validation exceeded the Firecrawl time budget.'
    };
  }

  const targetHost = normalizeHost(new URL(targetValidation.normalizedUrl).hostname);
  const pageLimit = Math.max(0, Math.min(FIRECRAWL_MAX_PAGES, Math.floor(maxPages)));
  const attemptedUrls: string[] = [];
  const unavailableUrls: string[] = [];
  const evidence: RenderedProductEvidence[] = [];
  const visited = new Set<string>();
  let lastReason: string | undefined;

  const directTargets = missingProductPages.map(page => page.url);
  const candidates = [...directTargets, ...productCandidateUrls];
  if (candidates.length === 0) candidates.push(targetValidation.normalizedUrl);

  const knownProductKeys = new Set([
    ...directProducts.map(page => productUrlKey(page.url)),
    ...productCandidateUrls.map(productUrlKey)
  ]);

  while (candidates.length > 0 && attemptedUrls.length < pageLimit && Date.now() < deadline) {
    const candidate = candidates.shift()!;
    let parsedCandidate: URL;
    try {
      parsedCandidate = new URL(candidate, targetValidation.normalizedUrl);
    } catch {
      continue;
    }
    parsedCandidate.hash = '';
    const requestUrl = parsedCandidate.toString();
    const urlKey = productUrlKey(requestUrl);

    if (visited.has(urlKey) || normalizeHost(parsedCandidate.hostname) !== targetHost) continue;
    if (parsedCandidate.protocol !== 'http:' && parsedCandidate.protocol !== 'https:') continue;

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    const validationPromise = validateTargetUrl(requestUrl, customLookup);
    let validationTimer: ReturnType<typeof setTimeout> | undefined;
    const validation = await Promise.race([
      validationPromise,
      new Promise<null>(resolve => {
        validationTimer = setTimeout(() => resolve(null), remainingMs);
      })
    ]);
    if (validationTimer) clearTimeout(validationTimer);

    if (!validation || !validation.valid || !validation.normalizedUrl) {
      visited.add(urlKey);
      if (!validation) lastReason = 'Firecrawl target validation exceeded the time budget.';
      if (directTargets.some(url => productUrlKey(url) === urlKey)) {
        unavailableUrls.push(requestUrl);
      }
      continue;
    }

    if (normalizeHost(new URL(validation.normalizedUrl).hostname) !== targetHost) continue;

    visited.add(urlKey);
    attemptedUrls.push(validation.normalizedUrl);

    const requestTimeoutMs = Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(1, deadline - Date.now()));
    let requestTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      const page = await Promise.race([
        scrapePage(validation.normalizedUrl, requestTimeoutMs),
        new Promise<never>((_resolve, reject) => {
          requestTimer = setTimeout(() => reject(new Error('Firecrawl time budget exceeded.')), Math.max(1, deadline - Date.now()));
        })
      ]);
      if (requestTimer) clearTimeout(requestTimer);

      const returnedUrl = page.sourceUrl || validation.normalizedUrl;
      let sourceParsed: URL;
      try {
        sourceParsed = new URL(returnedUrl, validation.normalizedUrl);
      } catch {
        throw new Error('Firecrawl returned an invalid source URL.');
      }

      if (
        !['http:', 'https:'].includes(sourceParsed.protocol) ||
        normalizeHost(sourceParsed.hostname) !== targetHost
      ) {
        throw new Error('Firecrawl returned content outside the validated target domain.');
      }

      const { $clean, visibleText } = parseCrawlerHtml(page.html);
      const extractedSignals = extractProductSignals($clean, visibleText, sourceParsed.toString());
      const requestKey = productUrlKey(validation.normalizedUrl);

      const signals = {
        ...extractedSignals,
        isProductPage:
          extractedSignals.isProductPage ||
          isProductUrl(sourceParsed.toString()) ||
          knownProductKeys.has(productUrlKey(sourceParsed.toString())) ||
          knownProductKeys.has(requestKey)
      };

      if (signals.isProductPage) {
        const evidenceKey = requestKey;
        if (!evidence.some(item => productUrlKey(item.url) === evidenceKey)) {
          evidence.push({
            url: validation.normalizedUrl,
            source: 'Firecrawl',
            ...(sourceParsed.toString() !== validation.normalizedUrl ? { sourceUrl: sourceParsed.toString() } : {}),
            ...signals
          });
        }
      } else {
        for (const link of findProductLinks($clean, sourceParsed.toString(), targetHost)) {
          if (attemptedUrls.length + candidates.length < pageLimit) {
            knownProductKeys.add(productUrlKey(link));
            candidates.push(link);
          }
        }
      }
    } catch (error: any) {
      if (requestTimer) clearTimeout(requestTimer);
      unavailableUrls.push(validation.normalizedUrl);
      lastReason = error?.message || 'Firecrawl response unavailable.';
    }
  }

  return {
    status: attemptedUrls.length > 0 && unavailableUrls.length === attemptedUrls.length ? 'unavailable' : 'measured',
    attemptedUrls,
    evidence,
    unavailableUrls,
    ...(lastReason ? { reason: lastReason } : {})
  };
}
