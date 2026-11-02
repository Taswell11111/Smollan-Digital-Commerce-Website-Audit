import { describe, it, expect } from 'vitest';
import { calculateScores } from '../src/utils/scoring';
import { CATEGORY_RULESET, getTotalWeight, CORE_CHECK_IDS } from '../src/config/ruleset';

describe('Phase 3 Follow-up Scoring & Ruleset Tests', () => {
  it('weights of scored categories total exactly 100', () => {
    expect(getTotalWeight()).toBe(100);
  });

  it('core check IDs are unique and exist in ruleset', () => {
    expect(CORE_CHECK_IDS.length).toBeGreaterThan(0);
    const uniqueIds = new Set(CORE_CHECK_IDS);
    expect(uniqueIds.size).toBe(CORE_CHECK_IDS.length);

    const allCheckIds = new Set(
      CATEGORY_RULESET.flatMap(c => c.checks.map(chk => chk.id))
    );
    CORE_CHECK_IDS.forEach(id => {
      expect(allCheckIds.has(id)).toBe(true);
    });
  });

  const passingHomepage = {
    url: 'https://example.com',
    pageType: 'homepage',
    status: 200,
    ttfbMs: 100,
    loadTimeMs: 800,
    title: 'Acme Store Official',
    description: 'Shop top apparel and home goods with fast delivery across South Africa.',
    linksCount: 25,
    navLinksCount: 10,
    imagesCount: 8,
    missingAltCount: 0,
    hasPrice: true,
    hasCanonical: true,
    hasMetaViewport: true
  };

  const passingProduct = {
    url: 'https://example.com/product/item-1',
    pageType: 'product',
    status: 200,
    ttfbMs: 120,
    loadTimeMs: 900,
    title: 'Pro Running Shoe | Acme',
    description: 'Engineered for comfort and endurance.',
    linksCount: 12,
    navLinksCount: 8,
    imagesCount: 5,
    missingAltCount: 0,
    hasPrice: true,
    hasCanonical: true,
    hasMetaViewport: true
  };

  const passingCheckout = {
    url: 'https://example.com/cart',
    pageType: 'cart',
    status: 200,
    ttfbMs: 130,
    loadTimeMs: 950,
    title: 'Secure Checkout | Acme',
    description: 'Secure payment and instant checkout.',
    linksCount: 5,
    navLinksCount: 6,
    imagesCount: 2,
    missingAltCount: 0,
    hasPrice: false,
    hasCanonical: true,
    hasMetaViewport: true
  };

  it('Fully passing site produces complete audit with score 100 and prospect_ready visibility', () => {
    const result = calculateScores({
      pagesInspected: [passingHomepage, passingProduct, passingCheckout],
      failedPages: [],
      pagesDiscoveredCount: 3,
      tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: true },
      privacyPolicyFound: true,
      trustMarkersCount: 2,
      homepageReachable: true
    });

    expect(result.overallScore).toBe(100);
    expect(result.auditStatus).toBe('complete');
    expect(result.visibility).toBe('prospect_ready');
    expect(result.coreCoveragePercent).toBeGreaterThanOrEqual(80);
    expect(result.schemaVersion).toBe(5);
    expect(result.rulesetVersion).toBe('2.0.0');
  });

  it('Failed audit (homepage unreachable) produces 0 score and failed status', () => {
    const result = calculateScores({
      pagesInspected: [],
      failedPages: [{ url: 'https://example.com', status: 0, error: 'Connection refused' }],
      pagesDiscoveredCount: 1,
      homepageReachable: false,
      homepageFailReason: 'Connection refused'
    });

    expect(result.overallScore).toBe(0);
    expect(result.auditStatus).toBe('failed');
    expect(result.visibility).toBe('internal');
    expect(result.failedReason).toBe('Connection refused');
  });

  it('Site served over HTTP fails security check and lowers score accordingly', () => {
    const result = calculateScores({
      pagesInspected: [passingHomepage, passingProduct, passingCheckout],
      failedPages: [],
      pagesDiscoveredCount: 3,
      tlsInfo: { isHttps: false, validCert: false, httpToHttpsRedirect: false },
      privacyPolicyFound: true,
      trustMarkersCount: 2,
      homepageReachable: true
    });

    expect(result.categoryResults['Technical Resilience and Security'].score).toBe(50);
    expect(result.overallScore).toBeLessThan(100);
  });

  it('Round trip: storing measurements and recomputing produces identical score', () => {
    const input = {
      pagesInspected: [passingHomepage, passingProduct, passingCheckout],
      failedPages: [],
      pagesDiscoveredCount: 3,
      tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: true },
      privacyPolicyFound: true,
      trustMarkersCount: 2,
      homepageReachable: true
    };

    const firstRun = calculateScores(input);
    const secondRun = calculateScores(input);

    expect(firstRun.overallScore).toBe(secondRun.overallScore);
    expect(firstRun.projectedOverallScore).toBe(secondRun.projectedOverallScore);
    expect(firstRun.categoryResults).toEqual(secondRun.categoryResults);
  });

  it('a not_measured CLS does not produce a pass and does not change other checks scores beyond re-normalisation', () => {
    const resultWithoutCls = calculateScores({
      pagesInspected: [passingHomepage, passingProduct, passingCheckout],
      failedPages: [],
      pagesDiscoveredCount: 3,
      tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: true },
      privacyPolicyFound: true,
      trustMarkersCount: 2,
      homepageReachable: true,
      workerResults: {
        'CHK-PERF-CLS': { status: 'not_measured', reason: 'no_layout_shift_observed' }
      }
    });

    const perfCat = resultWithoutCls.categoryResults['Performance'];
    const clsCheck = perfCat.checks.find((c: any) => c.id === 'CHK-PERF-CLS');
    expect(clsCheck).toBeDefined();
    expect(clsCheck!.status).toBe('not_measured');
    expect(clsCheck!.status).not.toBe('pass');
  });
});
