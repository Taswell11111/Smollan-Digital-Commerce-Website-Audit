import { describe, it, expect } from 'vitest';
import { calculateScores } from '../src/utils/scoring';

const httpsOk = { isHttps: true, validCert: true, httpToHttpsRedirect: true };

// A homepage with nothing else on it: no product, cart, search, or shipping evidence.
const bareHomepage = {
  url: 'https://shop.example/',
  pageType: 'homepage',
  status: 200,
  loadTimeMs: 300,
  ttfbMs: 120,
  title: 'Shop',
  description: '',
  imagesCount: 0,
  missingAltCount: 0,
  hasCanonical: false,
  hasMetaViewport: false,
  buttons: []
};

const UNVERIFIED_CHECKS = ['CHK-CHK-SHIPPING', 'CHK-CHK-GUEST', 'CHK-SRCH-SEARCH', 'CHK-SRCH-BREAD', 'CHK-MOB-TAP'];

function findCheck(result: ReturnType<typeof calculateScores>, id: string) {
  for (const cat of Object.values(result.categoryResults)) {
    const hit = cat.checks.find((c: any) => c.id === id);
    if (hit) return hit;
  }
  throw new Error(`check ${id} not in result`);
}

describe('unverified checks never score as pass', () => {
  it('a bare homepage does not produce a perfect score', () => {
    const result = calculateScores({
      pagesInspected: [bareHomepage as any],
      failedPages: [],
      pagesDiscoveredCount: 1,
      tlsInfo: httpsOk,
      homepageReachable: true
    });
    expect(result.overallScore).toBeLessThan(100);
  });

  it.each(UNVERIFIED_CHECKS)('%s is not_measured (not pass) when no evidence exists', id => {
    const result = calculateScores({
      pagesInspected: [bareHomepage as any],
      failedPages: [],
      pagesDiscoveredCount: 1,
      tlsInfo: httpsOk,
      homepageReachable: true
    });
    const check = findCheck(result, id);
    expect(check.status).toBe('not_measured');
    expect(check.evidence).toMatch(/not measured/i);
  });

  it('a worker-measured tap score is honoured when present', () => {
    const result = calculateScores({
      pagesInspected: [bareHomepage as any],
      failedPages: [],
      pagesDiscoveredCount: 1,
      tlsInfo: httpsOk,
      homepageReachable: true,
      workerResults: { 'CHK-MOB-TAP': { status: 'measured', score: 90, evidence: 'ok' } }
    });
    expect(findCheck(result, 'CHK-MOB-TAP').status).toBe('pass');
  });

  it('accessibility evidence states its scope honestly', () => {
    const result = calculateScores({
      pagesInspected: [{ ...bareHomepage, imagesCount: 3, missingAltCount: 0 } as any],
      failedPages: [],
      pagesDiscoveredCount: 1,
      tlsInfo: httpsOk,
      homepageReachable: true
    });
    const a11y = findCheck(result, 'CHK-A11Y-WCAG');
    expect(a11y.status).toBe('pass');
    expect(a11y.evidence).toMatch(/alt text only/i);
    expect(a11y.evidence).not.toMatch(/zero critical/i);
  });
});

describe('unreachable homepage has no hardcoded ceiling', () => {
  it('projected score equals the arithmetic sum of the fix list, not a constant 90', () => {
    const result = calculateScores({
      pagesInspected: [],
      failedPages: [{ url: 'https://shop.example', status: 0, error: 'ECONNREFUSED' }],
      pagesDiscoveredCount: 1,
      homepageReachable: false,
      homepageFailReason: 'ECONNREFUSED'
    });
    const sum = Math.min(100, Math.round(result.fixList.reduce((s, f) => s + f.recoverablePoints, 0)));
    expect(result.projectedOverallScore).toBe(sum);
    expect(result.scoreUplift).toBe(sum);
    expect(result.overallScore).toBe(0);
  });
});
