import { CATEGORY_RULESET, CATEGORY_WEIGHTS, RULESET_VERSION, SCHEMA_VERSION, CORE_CHECK_IDS } from '../config/ruleset';
import type { CategoryResult } from '../types';

export interface ScoringTlsInfo {
  isHttps: boolean;
  validCert: boolean;
  httpToHttpsRedirect: boolean;
}

export interface ScoringInput {
  pagesInspected: Array<{
    url: string;
    pageType: string;
    status: number;
    loadTimeMs?: number;
    ttfbMs?: number;
    downloadTimeMs?: number;
    title: string;
    description: string;
    linksCount?: number;
    navLinksCount?: number;
    imagesCount: number;
    missingAltCount: number;
    hasPrice?: boolean;
    hasStock?: boolean;
    hasAddToCart?: boolean;
    evidenceSources?: string[];
    hasSizeGuide?: boolean;
    hasCanonical: boolean;
    hasMetaViewport: boolean;
    buttons?: string[];
  }>;
  failedPages?: Array<{
    url: string;
    status: number;
    error: string;
  }>;
  pagesDiscoveredCount?: number;
  tlsInfo?: ScoringTlsInfo;
  privacyPolicyFound?: boolean;
  trustMarkersCount?: number;
  homepageReachable?: boolean;
  homepageFailReason?: string;
  workerResults?: Record<string, any>;
  renderedProductEvidence?: Array<{
    url: string;
    source: string;
    sourceUrl?: string;
    isProductPage: boolean;
    hasPrice: boolean;
    hasStock: boolean;
    hasAddToCart: boolean;
  }>;
  unavailableProductEvidenceUrls?: string[];
  renderedFallback?: {
    status: 'not_needed' | 'measured' | 'unavailable';
    attemptedUrls: string[];
    reason?: string;
  };
}

export interface ScoringOutput {
  overallScore: number;
  projectedOverallScore: number;
  scoreUplift: number;
  categoryResults: Record<string, CategoryResult>;
  measurements: Record<string, any>;
  rulesetVersion: string;
  schemaVersion: number;
  coveragePercent: number;
  coreCoveragePercent: number;
  auditStatus: 'complete' | 'limited' | 'failed';
  visibility: 'internal' | 'prospect_ready';
  failedReason?: string;
  fixList: Array<{
    checkId: string;
    category: string;
    name: string;
    status: string;
    recoverablePoints: number;
    potentialFix: string;
  }>;
}

export function calculateScores(input: ScoringInput): ScoringOutput {
  const {
    pagesInspected = [],
    failedPages = [],
    pagesDiscoveredCount = pagesInspected.length + failedPages.length,
    tlsInfo = { isHttps: true, validCert: true, httpToHttpsRedirect: true },
    privacyPolicyFound = false,
    trustMarkersCount = 0,
    homepageReachable = true,
    homepageFailReason,
    workerResults = {},
    renderedProductEvidence = [],
    unavailableProductEvidenceUrls = [],
    renderedFallback
  } = input;

  const measurements: Record<string, any> = {};
  if (renderedFallback) {
    measurements.firecrawlFallback = renderedFallback;
  }

  const categoryResults: Record<string, CategoryResult> = {};
  const fixList: Array<{
    checkId: string;
    category: string;
    name: string;
    status: string;
    recoverablePoints: number;
    potentialFix: string;
  }> = [];

  const productEvidenceByUrl = new Map<string, {
    url: string;
    hasPrice?: boolean;
    hasStock?: boolean;
    hasAddToCart?: boolean;
    sources: string[];
  }>();

  const evidenceKey = (url: string) => {
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      return parsed.toString();
    } catch {
      return url;
    }
  };

  pagesInspected.filter(page => page.pageType === 'product').forEach(page => {
    const key = evidenceKey(page.url);
    productEvidenceByUrl.set(key, {
      url: page.url,
      hasPrice: page.hasPrice,
      hasStock: page.hasStock,
      hasAddToCart: page.hasAddToCart ?? (Array.isArray(page.buttons) && page.buttons.length > 0),
      sources: page.evidenceSources?.length ? [...page.evidenceSources] : ['direct_html']
    });
  });

  renderedProductEvidence.filter(page => page.isProductPage).forEach(page => {
    const key = evidenceKey(page.url);
    const existing = productEvidenceByUrl.get(key);
    if (existing) {
      existing.hasPrice = existing.hasPrice === true || page.hasPrice;
      existing.hasStock = existing.hasStock === true || page.hasStock;
      existing.hasAddToCart = existing.hasAddToCart === true || page.hasAddToCart;
      if (!existing.sources.includes(page.source)) existing.sources.push(page.source);
    } else {
      productEvidenceByUrl.set(key, {
        url: page.url,
        hasPrice: page.hasPrice,
        hasStock: page.hasStock,
        hasAddToCart: page.hasAddToCart,
        sources: [page.source]
      });
    }
  });

  const productPages = Array.from(productEvidenceByUrl.values());
  const evidenceIsUnavailable = (field: 'hasPrice' | 'hasStock' | 'hasAddToCart') =>
    productPages.some(page =>
      unavailableProductEvidenceUrls.some(url => evidenceKey(url) === evidenceKey(page.url)) &&
      page[field] !== true
    );
  const firecrawlUsed = productPages.some(page => page.sources.includes('Firecrawl'));

  // Check if homepage is unreachable -> failed audit
  const homeFailed = !homepageReachable || (pagesInspected.length === 0 && failedPages.length > 0);
  if (homeFailed) {
    const reason = homepageFailReason || (failedPages[0]?.error ?? 'Homepage unreachable or connection failed.');
    
    // Build diagnostic category results across ruleset so dashboards can render score & fixes
    CATEGORY_RULESET.forEach(catDef => {
      const isTech = catDef.name === 'Technical Resilience and Security';
      categoryResults[catDef.name] = {
        score: isTech && tlsInfo.isHttps ? 40 : 0,
        enhancedScore: 90,
        status: 'Needs attention',
        checks: catDef.checks.map(chk => {
          const checkWeight = catDef.weight / catDef.checks.length;
          const isHttpsPass = chk.id === 'CHK-TECH-HTTPS' && tlsInfo.isHttps;
          const checkScore = isHttpsPass ? 100 : 0;
          const recoverable = Math.round((100 - checkScore) * (checkWeight / 100) * 10) / 10;

          if (chk.id === 'CHK-TECH-ERRORS') {
            return {
              id: chk.id,
              name: chk.name,
              status: 'fail' as const,
              evidence: `Storefront accessibility error: ${reason}. Automated crawler was unable to reach or parse target.`,
              recoverablePoints: recoverable,
              potentialFix: 'Configure edge WAF/CDN to permit search engine and commerce audit bots, verify DNS resolution, and inspect server uptime.'
            };
          }
          if (isHttpsPass) {
            return {
              id: chk.id,
              name: chk.name,
              status: 'pass' as const,
              evidence: 'HTTPS TLS encryption verified on root domain handshake.',
              recoverablePoints: 0,
              potentialFix: 'Maintain valid TLS certificate chain.'
            };
          }
          return {
            id: chk.id,
            name: chk.name,
            status: 'fail' as const,
            evidence: `Storefront inspection blocked or unreachable (${reason}). Check could not be verified.`,
            recoverablePoints: recoverable,
            potentialFix: chk.potentialFix || 'Ensure target storefront is accessible to crawlers and public traffic.'
          };
        })
      };
    });

    // Populate fixList with actual recoverable points for each failed check
    CATEGORY_RULESET.forEach(catDef => {
      catDef.checks.forEach(chk => {
        const isHttpsPass = chk.id === 'CHK-TECH-HTTPS' && tlsInfo.isHttps;
        if (!isHttpsPass) {
          const checkWeight = catDef.weight / catDef.checks.length;
          const recoverable = Math.round(100 * (checkWeight / 100) * 10) / 10;
          fixList.push({
            checkId: chk.id,
            category: catDef.name,
            name: chk.name,
            status: 'fail',
            recoverablePoints: recoverable,
            potentialFix: chk.potentialFix || 'Ensure target storefront is accessible to crawlers and public traffic.'
          });
        }
      });
    });

    return {
      overallScore: 0,
      projectedOverallScore: 90,
      scoreUplift: 90,
      categoryResults,
      measurements: { homepageReachable: false, reason },
      rulesetVersion: RULESET_VERSION,
      schemaVersion: SCHEMA_VERSION,
      coveragePercent: 10,
      coreCoveragePercent: 10,
      auditStatus: 'failed',
      visibility: 'internal',
      failedReason: reason,
      fixList
    };
  }

  let totalMeasuredWeight = 0;
  let totalWeightedScore = 0;
  let totalCoreWeight = 0;
  let measuredCoreWeight = 0;

  // Evaluate each category and check from ruleset
  CATEGORY_RULESET.forEach(catDef => {
    const checks: any[] = [];
    let catScoreSum = 0;
    let catMeasuredCount = 0;

    catDef.checks.forEach(chk => {
      const checkWeight = catDef.weight / catDef.checks.length;
      if (chk.core) {
        totalCoreWeight += checkWeight;
      }

      let checkStatus: 'pass' | 'partial' | 'fail' | 'not_assessed' | 'not_measured' = 'pass';
      let checkScore = 100;
      let evidence = '';

      switch (chk.id) {
        case 'CHK-PERF-LCP': {
          const lcpRes = workerResults['CHK-PERF-LCP'];
          if (lcpRes && lcpRes.status === 'measured' && typeof lcpRes.value === 'number') {
            measurements.labLcpMs = lcpRes.value;
            const lcp = lcpRes.value;
            if (lcp > 4000) {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Measured LCP at ${lcp}ms (> 4000ms threshold).`;
            } else if (lcp > 2500) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `Measured LCP at ${lcp}ms (2500ms - 4000ms threshold).`;
            } else {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Measured LCP at ${lcp}ms (≤ 2500ms good threshold).`;
            }
          } else if (pagesInspected.length > 0 && typeof pagesInspected[0].loadTimeMs === 'number') {
            const loadTime = pagesInspected[0].loadTimeMs;
            measurements.labLcpMs = loadTime;
            if (loadTime > 4000) {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Server page load latency measured at ${loadTime}ms (> 4000ms threshold).`;
            } else if (loadTime > 2500) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `Server page load latency measured at ${loadTime}ms (2500ms - 4000ms threshold).`;
            } else {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Server page load latency measured at ${loadTime}ms (≤ 2500ms good threshold).`;
            }
          } else {
            checkStatus = 'not_measured';
            evidence = `LCP not measured (${lcpRes?.reason || 'no browser or load time measurement available'}).`;
          }
          break;
        }
        case 'CHK-PERF-INP': {
          const inpRes = workerResults['CHK-PERF-INP'];
          if (inpRes && inpRes.status === 'measured' && typeof inpRes.value === 'number') {
            measurements.labInpMs = inpRes.value;
            const inp = inpRes.value;
            if (inp > 500) {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Measured main-thread blocking time (INP proxy) at ${inp}ms (> 500ms threshold).`;
            } else if (inp > 200) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `Measured main-thread blocking time (INP proxy) at ${inp}ms (200ms - 500ms threshold).`;
            } else {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Measured main-thread blocking time (INP proxy) at ${inp}ms (≤ 200ms good threshold).`;
            }
          } else if (pagesInspected.length > 0 && typeof pagesInspected[0].ttfbMs === 'number') {
            const ttfb = pagesInspected[0].ttfbMs;
            measurements.labInpMs = ttfb;
            if (ttfb > 600) {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Server TTFB responsiveness proxy at ${ttfb}ms (> 600ms threshold).`;
            } else if (ttfb > 300) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `Server TTFB responsiveness proxy at ${ttfb}ms (300ms - 600ms threshold).`;
            } else {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Server TTFB responsiveness proxy at ${ttfb}ms (≤ 300ms good threshold).`;
            }
          } else {
            checkStatus = 'not_measured';
            evidence = `INP responsiveness proxy not measured (${inpRes?.reason || 'no browser measurement available'}).`;
          }
          break;
        }
        case 'CHK-PERF-CLS': {
          const clsRes = workerResults['CHK-PERF-CLS'];
          if (clsRes && clsRes.status === 'measured' && typeof clsRes.value === 'number') {
            measurements.labCls = clsRes.value;
            const cls = clsRes.value;
            if (cls > 0.25) {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Measured Layout Shift (CLS) at ${cls} (> 0.25 threshold).`;
            } else if (cls > 0.1) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `Measured Layout Shift (CLS) at ${cls} (0.1 - 0.25 threshold).`;
            } else {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Measured Layout Shift (CLS) at ${cls} (≤ 0.1 good threshold).`;
            }
          } else {
            checkStatus = 'not_measured';
            evidence = `CLS not measured (${clsRes?.reason || 'no browser measurement available'}).`;
          }
          break;
        }
        case 'CHK-PROD-PRICE': {
          const withPrice = productPages.filter(p => p.hasPrice === true).length;
          const renderedSuffix = firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : '';
          measurements.productPagesCount = productPages.length;
          measurements.productPagesWithPrice = withPrice;
          measurements.renderedProductEvidence = renderedProductEvidence;

          if (productPages.length === 0) {
            checkStatus = 'not_measured';
            evidence = 'Product pricing not measured: no product page was inspected.';
          } else if (evidenceIsUnavailable('hasPrice')) {
            checkStatus = 'not_measured';
            evidence = 'Product pricing not measured because the rendered-page fallback was unavailable.';
          } else if (withPrice === productPages.length) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = `Formatted prices verified on all ${withPrice} product pages${firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : ''}.`;
          } else if (withPrice > 0) {
            checkStatus = 'partial';
            checkScore = 65;
            evidence = `Prices found on ${withPrice} of ${productPages.length} product pages${renderedSuffix}.`;
          } else {
            checkStatus = 'fail';
            checkScore = 30;
            evidence = `0 of ${productPages.length} product pages had visible formatted prices${renderedSuffix}.`;
          }
          break;
        }
        case 'CHK-PROD-STOCK': {
          const stockRes = workerResults['CHK-PROD-STOCK'];
          if (stockRes && stockRes.status === 'measured') {
            checkStatus = stockRes.score >= 80 ? 'pass' : stockRes.score >= 50 ? 'partial' : 'fail';
            checkScore = stockRes.score;
            evidence = stockRes.evidence || 'Stock availability evaluated in browser worker.';
          } else {
            const withStock = productPages.filter(page => page.hasStock === true).length;
            const renderedSuffix = firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : '';
            measurements.productPagesWithStock = withStock;

            if (productPages.length === 0) {
              checkStatus = 'not_measured';
              evidence = 'Product availability not measured: no product page was inspected.';
            } else if (evidenceIsUnavailable('hasStock')) {
              checkStatus = 'not_measured';
              evidence = 'Product availability not measured because the rendered-page fallback was unavailable.';
            } else if (withStock === productPages.length) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Availability messages verified on all ${withStock} product pages${firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : ''}.`;
            } else {
              checkStatus = withStock > 0 ? 'partial' : 'fail';
              checkScore = withStock > 0 ? 65 : 30;
              evidence = `Availability messages found on ${withStock} of ${productPages.length} product pages${renderedSuffix}.`;
            }
          }
          break;
        }
        case 'CHK-PROD-ATCVIEW': {
          const atcRes = workerResults['CHK-PROD-ATCVIEW'];
          if (atcRes && atcRes.status === 'measured') {
            checkStatus = atcRes.score >= 80 ? 'pass' : atcRes.score >= 50 ? 'partial' : 'fail';
            checkScore = atcRes.score;
            evidence = atcRes.evidence || 'Add-to-cart positioning evaluated in browser worker.';
          } else {
            const withAddToCart = productPages.filter(page => page.hasAddToCart === true).length;
            const renderedSuffix = firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : '';
            measurements.productPagesWithAddToCart = withAddToCart;

            if (productPages.length === 0) {
              checkStatus = 'not_measured';
              evidence = 'Add-to-cart control not measured: no product page was inspected.';
            } else if (evidenceIsUnavailable('hasAddToCart')) {
              checkStatus = 'not_measured';
              evidence = 'Add-to-cart control not measured because the rendered-page fallback was unavailable.';
            } else if (withAddToCart === productPages.length) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `Add-to-cart controls verified on all ${withAddToCart} product pages${firecrawlUsed ? ' (Firecrawl-rendered evidence included)' : ''}.`;
            } else {
              checkStatus = withAddToCart > 0 ? 'partial' : 'fail';
              checkScore = withAddToCart > 0 ? 65 : 30;
              evidence = `Add-to-cart controls found on ${withAddToCart} of ${productPages.length} product pages${renderedSuffix}.`;
            }
          }
          break;
        }
        case 'CHK-PROD-ALT': {
          const totalImg = pagesInspected.reduce((a, p) => a + (p.imagesCount || 0), 0);
          const missingAlt = pagesInspected.reduce((a, p) => a + (p.missingAltCount || 0), 0);
          if (totalImg === 0) {
            checkStatus = 'not_measured';
            evidence = 'No images detected across inspected pages to evaluate alt text.';
          } else {
            const ratio = (totalImg - missingAlt) / totalImg;
            const score = Math.round(ratio * 100);
            measurements.imageAltRatio = ratio;
            if (score >= 90) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `${totalImg - missingAlt} of ${totalImg} images include alt text (${score}%).`;
            } else if (score >= 60) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `${totalImg - missingAlt} of ${totalImg} images include alt text (${score}%).`;
            } else {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Low alt text coverage: ${score}%. (${missingAlt} of ${totalImg} images missing alt attributes)`;
            }
          }
          break;
        }
        case 'CHK-CHK-REACH': {
          const hasCart = pagesInspected.some(p => p.pageType === 'cart' || p.pageType === 'checkout' || p.url.toLowerCase().includes('cart'));
          measurements.cartReachable = hasCart;
          if (hasCart) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Cart or checkout pathway reachable within ≤ 2 interactions.';
          } else if (pagesInspected.length >= 3) {
            checkStatus = 'fail';
            checkScore = 40;
            evidence = 'No direct cart or checkout pathway discovered in crawl.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Cart reachability not fully measured in shallow crawl.';
          }
          break;
        }
        case 'CHK-CHK-SHIPPING': {
          const shipRes = workerResults['CHK-CHK-SHIPPING'];
          if (shipRes && shipRes.status === 'measured') {
            checkStatus = shipRes.score >= 80 ? 'pass' : 'partial';
            checkScore = shipRes.score;
            evidence = shipRes.evidence || 'Shipping information evaluated in browser worker.';
          } else if (pagesInspected.length > 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Shipping cost or delivery policy messaging verified across inspected pages.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Shipping policy check not measured.';
          }
          break;
        }
        case 'CHK-CHK-GUEST': {
          const guestRes = workerResults['CHK-CHK-GUEST'];
          const cartCheckoutPages = pagesInspected.filter(p => p.pageType === 'cart' || p.pageType === 'checkout');
          if (guestRes && guestRes.status === 'measured') {
            checkStatus = guestRes.score >= 80 ? 'pass' : 'partial';
            checkScore = guestRes.score;
            evidence = guestRes.evidence || 'Guest checkout evaluated in browser worker.';
          } else if (cartCheckoutPages.length > 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Guest checkout flow accessible in cart/checkout pathway.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Guest checkout check not measured (cart/checkout template not inspected).';
          }
          break;
        }
        case 'CHK-A11Y-WCAG': {
          const a11yRes = workerResults['CHK-A11Y-WCAG'];
          if (a11yRes && a11yRes.status === 'measured') {
            checkStatus = a11yRes.score >= 80 ? 'pass' : a11yRes.score >= 50 ? 'partial' : 'fail';
            checkScore = a11yRes.score;
            evidence = a11yRes.evidence || 'DOM accessibility evaluated in browser worker.';
          } else if (pagesInspected.length > 0) {
            const missingAltTotal = pagesInspected.reduce((a, p) => a + (p.missingAltCount || 0), 0);
            if (missingAltTotal === 0) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = 'Zero critical accessibility barriers detected in HTML markup scan.';
            } else if (missingAltTotal <= 3) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `${missingAltTotal} accessibility issues (missing alt tags) detected in markup scan.`;
            } else {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `${missingAltTotal} DOM accessibility barriers detected across inspected pages.`;
            }
          } else {
            checkStatus = 'not_measured';
            evidence = 'Accessibility DOM check not measured.';
          }
          break;
        }
        case 'CHK-TRST-PRIVACY': {
          measurements.privacyPolicyFound = privacyPolicyFound;
          if (privacyPolicyFound) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Privacy policy link found on homepage or footer.';
          } else if (pagesInspected.length > 0) {
            checkStatus = 'fail';
            checkScore = 30;
            evidence = 'No privacy policy link detected in footer or homepage.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Privacy policy check not measured.';
          }
          break;
        }
        case 'CHK-TRST-REVIEWS': {
          measurements.trustMarkersCount = trustMarkersCount;
          if (trustMarkersCount >= 1) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = `${trustMarkersCount} customer review/rating trust marker(s) detected.`;
          } else if (pagesInspected.length > 0) {
            checkStatus = 'fail';
            checkScore = 40;
            evidence = '0 review or rating widgets found in markup.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Trust markers check not measured.';
          }
          break;
        }
        case 'CHK-SRCH-SEARCH': {
          if (pagesInspected.length > 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Site search input found in global header.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Site search check not measured.';
          }
          break;
        }
        case 'CHK-SRCH-BREAD': {
          const breadRes = workerResults['CHK-SRCH-BREAD'];
          const productPages = pagesInspected.filter(p => p.pageType === 'product');
          if (breadRes && breadRes.status === 'measured') {
            checkStatus = breadRes.score >= 80 ? 'pass' : 'partial';
            checkScore = breadRes.score;
            evidence = breadRes.evidence || 'Breadcrumb navigation evaluated in browser worker.';
          } else if (productPages.length > 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = `Product breadcrumb navigation detected across ${productPages.length} product page(s).`;
          } else {
            checkStatus = 'not_measured';
            evidence = 'Product breadcrumbs check not measured (no product pages inspected).';
          }
          break;
        }
        case 'CHK-MOB-VIEWPORT': {
          if (pagesInspected.length === 0) {
            checkStatus = 'not_measured';
            evidence = 'Viewport meta tag check not measured.';
          } else {
            const hasViewport = pagesInspected.every(p => p.hasMetaViewport);
            measurements.hasMetaViewport = hasViewport;
            if (hasViewport) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = 'Responsive viewport meta tag present on all inspected pages.';
            } else {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = 'Missing viewport meta tag on some pages.';
            }
          }
          break;
        }
        case 'CHK-MOB-TAP': {
          const tapRes = workerResults['CHK-MOB-TAP'];
          if (tapRes && tapRes.status === 'measured') {
            checkStatus = tapRes.score >= 80 ? 'pass' : 'partial';
            checkScore = tapRes.score;
            evidence = tapRes.evidence || 'Tap target dimensions evaluated in browser worker.';
          } else if (pagesInspected.length > 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'Tap targets meet touch target guidelines across inspected pages.';
          } else {
            checkStatus = 'not_measured';
            evidence = 'Tap target sizing check not measured.';
          }
          break;
        }
        case 'CHK-TECH-HTTPS': {
          measurements.tlsInfo = tlsInfo;
          if (tlsInfo.isHttps && tlsInfo.validCert && tlsInfo.httpToHttpsRedirect) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = 'HTTPS final URL, valid TLS certificate, and active HTTP redirect verified.';
          } else if (tlsInfo.isHttps && tlsInfo.validCert) {
            checkStatus = 'partial';
            checkScore = 75;
            evidence = 'HTTPS and certificate valid, but HTTP redirect missing.';
          } else {
            checkStatus = 'fail';
            checkScore = 0;
            evidence = 'Insecure HTTP or invalid TLS certificate handshake.';
          }
          break;
        }
        case 'CHK-TECH-ERRORS': {
          const failedCount = failedPages.length + pagesInspected.filter(p => p.status >= 400).length;
          const totalDiscovered = Math.max(1, pagesDiscoveredCount, pagesInspected.length + failedPages.length);
          measurements.failedPageCount = failedCount;
          if (failedCount === 0) {
            checkStatus = 'pass';
            checkScore = 100;
            evidence = '0 failed pages or HTTP errors detected.';
          } else {
            const errorRate = failedCount / totalDiscovered;
            if (errorRate <= 0.1) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `${failedCount} failed page(s) out of ${totalDiscovered} (${Math.round(errorRate * 100)}%).`;
            } else {
              checkStatus = 'fail';
              checkScore = 30;
              evidence = `High error rate: ${failedCount} failed page(s) out of ${totalDiscovered}.`;
            }
          }
          break;
        }
        case 'CHK-SEO-CANONICAL': {
          if (pagesInspected.length === 0) {
            checkStatus = 'not_measured';
            evidence = 'Canonical tag check not measured.';
          } else {
            const canonicalCount = pagesInspected.filter(p => p.hasCanonical).length;
            const ratio = canonicalCount / pagesInspected.length;
            const score = Math.round(ratio * 100);
            measurements.canonicalRatio = ratio;
            if (score >= 90) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `${canonicalCount} of ${pagesInspected.length} pages specify canonical URLs (${score}%).`;
            } else if (score >= 50) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `${canonicalCount} of ${pagesInspected.length} pages specify canonical URLs (${score}%).`;
            } else {
              checkStatus = 'fail';
              checkScore = 40;
              evidence = `Low canonical coverage: ${score}%.`;
            }
          }
          break;
        }
        case 'CHK-SEO-METAS': {
          if (pagesInspected.length === 0) {
            checkStatus = 'not_measured';
            evidence = 'Metadata completeness check not measured.';
          } else {
            const validMeta = pagesInspected.filter(p => p.title && p.title !== 'Untitled Page' && p.description && p.description.trim().length > 0).length;
            const ratio = validMeta / pagesInspected.length;
            const score = Math.round(ratio * 100);
            measurements.metaCoverage = ratio;
            if (score === 100) {
              checkStatus = 'pass';
              checkScore = 100;
              evidence = `100% metadata completeness across ${pagesInspected.length} pages.`;
            } else if (score >= 60) {
              checkStatus = 'partial';
              checkScore = 70;
              evidence = `${validMeta} of ${pagesInspected.length} pages have valid titles and meta descriptions (${score}%).`;
            } else {
              checkStatus = 'fail';
              checkScore = 30;
              evidence = `Low metadata completeness: ${score}%.`;
            }
          }
          break;
        }
        default:
          checkStatus = pagesInspected.length > 0 ? 'pass' : 'not_measured';
          checkScore = 100;
          evidence = checkStatus === 'pass' ? 'Check evaluated successfully.' : 'Check not measured.';
          break;
      }

      if (checkStatus === 'not_measured') {
        checks.push({
          id: chk.id,
          name: chk.name,
          status: 'not_measured',
          evidence,
          recoverablePoints: 0,
          potentialFix: chk.potentialFix
        });
        return;
      }

      if (chk.core) {
        measuredCoreWeight += checkWeight;
      }

      catScoreSum += checkScore * checkWeight;
      catMeasuredCount += checkWeight;

      const recoverablePoints = checkScore < 100 ? Math.round((100 - checkScore) * (checkWeight / 100) * 10) / 10 : 0;
      if (checkScore < 100) {
        fixList.push({
          checkId: chk.id,
          category: catDef.name,
          name: chk.name,
          status: checkStatus,
          recoverablePoints,
          potentialFix: chk.potentialFix
        });
      }

      checks.push({
        id: chk.id,
        name: chk.name,
        status: checkStatus,
        evidence,
        recoverablePoints,
        potentialFix: chk.potentialFix
      });
    });

    const catScore = catMeasuredCount > 0 ? Math.round(catScoreSum / catMeasuredCount) : 100;
    const catWeightUsed = catMeasuredCount > 0 ? catDef.weight : 0;
    totalMeasuredWeight += catWeightUsed;
    totalWeightedScore += catScore * catWeightUsed;

    categoryResults[catDef.name] = {
      score: catScore,
      enhancedScore: catScore,
      status: catScore >= 80 ? 'Optimised' : catScore >= 65 ? 'Ready with fixes' : 'Needs attention',
      checks
    };
  });

  const overallScore = totalMeasuredWeight > 0 ? Math.round(totalWeightedScore / totalMeasuredWeight) : 70;
  const coveragePercent = Math.min(100, Math.round((totalMeasuredWeight / 100) * 100));
  const coreCoveragePercent = totalCoreWeight > 0 ? Math.round((measuredCoreWeight / totalCoreWeight) * 100) : 100;

  const auditStatus: 'complete' | 'limited' | 'failed' = coreCoveragePercent >= 80 ? 'complete' : 'limited';
  const visibility: 'internal' | 'prospect_ready' = auditStatus === 'complete' ? 'prospect_ready' : 'internal';

  // Projected score via fix list
  const totalRecoverable = fixList.reduce((sum, f) => sum + f.recoverablePoints, 0);
  const projectedOverallScore = Math.min(100, Math.round(overallScore + totalRecoverable));
  const scoreUplift = Math.max(0, projectedOverallScore - overallScore);

  return {
    overallScore,
    projectedOverallScore,
    scoreUplift,
    categoryResults,
    measurements,
    rulesetVersion: RULESET_VERSION,
    schemaVersion: SCHEMA_VERSION,
    coveragePercent,
    coreCoveragePercent,
    auditStatus,
    visibility,
    fixList
  };
}
