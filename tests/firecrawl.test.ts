import { describe, expect, it, vi } from 'vitest';
import { collectRenderedProductEvidence, FIRECRAWL_MAX_PAGES } from '../src/utils/firecrawl.js';
import { calculateScores } from '../src/utils/scoring.js';

const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

const productHtml = `
  <html><body>
    <main class="product-main">
      <h1>Road Running Shoe</h1>
      <span class="price">$129.00</span>
      <p>In stock</p>
      <button>Add to cart</button>
    </main>
  </body></html>
`;

const productPage = (url = 'https://store.example/products/road-shoe', signals = {}) => ({
  url,
  pageType: 'product',
  status: 200,
  loadTimeMs: 900,
  title: 'Road Running Shoe',
  description: 'A lightweight running shoe.',
  imagesCount: 1,
  missingAltCount: 0,
  hasPrice: false,
  hasStock: false,
  hasAddToCart: false,
  hasCanonical: true,
  hasMetaViewport: true,
  ...signals
});

describe('bounded Firecrawl / Rendered Product Evidence fallback', () => {
  it('does not call Firecrawl when static HTML already has required product evidence', async () => {
    const scrapePage = vi.fn();
    const result = await collectRenderedProductEvidence({
      targetUrl: 'https://store.example/',
      pagesInspected: [
        productPage('https://store.example/products/road-shoe', {
          hasPrice: true,
          hasStock: true,
          hasAddToCart: true
        })
      ],
      scrapePage,
      customLookup: publicLookup
    });

    expect(result.status).toBe('not_needed');
    expect(result.attemptedUrls).toEqual([]);
    expect(scrapePage).not.toHaveBeenCalled();
  });

  it('uses Firecrawl when direct product evidence is missing and labels the source', async () => {
    const scrapePage = vi.fn().mockResolvedValue({ html: productHtml });
    const result = await collectRenderedProductEvidence({
      targetUrl: 'https://store.example/',
      pagesInspected: [productPage()],
      scrapePage,
      customLookup: publicLookup
    });

    expect(scrapePage).toHaveBeenCalledTimes(1);
    expect(scrapePage.mock.calls[0][0]).toBe('https://store.example/products/road-shoe');
    expect(result.status).toBe('measured');
    expect(result.evidence).toEqual([
      {
        url: 'https://store.example/products/road-shoe',
        source: 'Firecrawl',
        isProductPage: true,
        hasPrice: true,
        hasStock: true,
        hasAddToCart: true
      }
    ]);
  });

  it('limits requests to validated domain, page cap, and remaining time budget', async () => {
    const scrapePage = vi.fn().mockResolvedValue({ html: productHtml });
    const result = await collectRenderedProductEvidence({
      targetUrl: 'https://store.example/',
      pagesInspected: [],
      productCandidateUrls: [
        'https://store.example/products/first',
        'https://store.example/products/second',
        'https://other.example/products/third'
      ],
      scrapePage,
      customLookup: publicLookup,
      maxPages: 1,
      timeBudgetMs: 1_500
    });

    expect(FIRECRAWL_MAX_PAGES).toBe(2);
    expect(scrapePage).toHaveBeenCalledTimes(1);
    expect(scrapePage.mock.calls[0][0]).toBe('https://store.example/products/first');
    expect(scrapePage.mock.calls[0][1]).toBeLessThanOrEqual(1_500);
    expect(result.attemptedUrls).toHaveLength(1);
    expect(result.attemptedUrls.every(url => new URL(url).hostname === 'store.example')).toBe(true);
  });

  it('can use one homepage render to discover a same-domain product page within two-page cap', async () => {
    const scrapePage = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://store.example/') {
        return {
          html: '<html><body><a class="product-card" href="/item/road-shoe">Road shoe</a></body></html>'
        };
      }
      return { html: productHtml };
    });

    const result = await collectRenderedProductEvidence({
      targetUrl: 'https://store.example/',
      pagesInspected: [],
      scrapePage,
      customLookup: publicLookup
    });

    expect(scrapePage).toHaveBeenCalledTimes(FIRECRAWL_MAX_PAGES);
    expect(scrapePage.mock.calls.map(call => call[0])).toEqual([
      'https://store.example/',
      'https://store.example/item/road-shoe'
    ]);
    expect(result.evidence[0]).toMatchObject({
      url: 'https://store.example/item/road-shoe',
      source: 'Firecrawl',
      isProductPage: true
    });
  });

  it('keeps unavailable rendered checks not measured instead of passing them', async () => {
    const unavailable = await collectRenderedProductEvidence({
      targetUrl: 'https://store.example/',
      pagesInspected: [productPage()],
      scrapePage: vi.fn().mockRejectedValue(new Error('scraper unavailable')),
      customLookup: publicLookup
    });

    const scored = calculateScores({
      pagesInspected: [productPage()],
      renderedProductEvidence: unavailable.evidence,
      unavailableProductEvidenceUrls: unavailable.unavailableUrls,
      renderedFallback: {
        status: unavailable.status,
        attemptedUrls: unavailable.attemptedUrls,
        reason: unavailable.reason
      }
    });

    const productChecks = scored.categoryResults['Product Page'].checks;
    expect(unavailable.status).toBe('unavailable');
    expect(unavailable.unavailableUrls).toEqual(['https://store.example/products/road-shoe']);
    for (const checkId of ['CHK-PROD-PRICE', 'CHK-PROD-STOCK', 'CHK-PROD-ATCVIEW']) {
      expect(productChecks.find(check => check.id === checkId)?.status).toBe('not_measured');
    }
    expect(scored.measurements.firecrawlFallback.status).toBe('unavailable');
  });

  it('does not mark product checks as passing when no product page was inspected', () => {
    const scored = calculateScores({
      pagesInspected: [{
        url: 'https://store.example/',
        pageType: 'homepage',
        status: 200,
        title: 'Store',
        description: 'Storefront',
        imagesCount: 1,
        missingAltCount: 0,
        hasPrice: false,
        hasCanonical: true,
        hasMetaViewport: true
      }]
    });

    const productChecks = scored.categoryResults['Product Page'].checks;
    for (const checkId of ['CHK-PROD-PRICE', 'CHK-PROD-STOCK', 'CHK-PROD-ATCVIEW']) {
      expect(productChecks.find(check => check.id === checkId)?.status).toBe('not_measured');
    }
  });
});
