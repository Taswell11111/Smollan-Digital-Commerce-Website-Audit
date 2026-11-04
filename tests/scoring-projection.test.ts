import { describe, it, expect } from 'vitest';
import { calculateScores } from '../src/utils/scoring';

// One homepage whose only deficit is the HTTP->HTTPS redirect (partial, 75).
const page = {
  url: 'https://shop.example/', pageType: 'homepage', status: 200,
  title: 'Shop', description: 'A sufficiently long meta description for this homepage.',
  imagesCount: 0, missingAltCount: 0, hasCanonical: true, hasMetaViewport: true, buttons: []
};
const workerResults = {
  'CHK-PERF-LCP': { status: 'measured', value: 1800 },
  'CHK-PERF-INP': { status: 'measured', value: 120 },
  'CHK-PERF-CLS': { status: 'measured', value: 0.02 }
};
const base = { pagesInspected: [page as any], failedPages: [], pagesDiscoveredCount: 1, privacyPolicyFound: true, trustMarkersCount: 1, homepageReachable: true, workerResults };

describe('projected score is exact when some checks are not measured', () => {
  it('projecting the fix list equals the score after actually fixing the single deficit', () => {
    const before = calculateScores({ ...base, tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: false } });
    const after = calculateScores({ ...base, tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: true } });

    expect(before.categoryResults['Performance']).toBeDefined();
    expect(after.overallScore).toBe(100);
    // Rounding happens per category and per check, so allow one point of slack.
    expect(Math.abs(before.projectedOverallScore - after.overallScore)).toBeLessThanOrEqual(1);
  });

  it('projection never exceeds 100 and never undercuts the current score', () => {
    const r = calculateScores({ ...base, tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: false } });
    expect(r.projectedOverallScore).toBeLessThanOrEqual(100);
    expect(r.projectedOverallScore).toBeGreaterThanOrEqual(r.overallScore);
  });

  it('the HTTPS deficit gain matches the exact formula for the measured coverage', () => {
    const r = calculateScores({ ...base, tlsInfo: { isHttps: true, validCert: true, httpToHttpsRedirect: false } });
    const fix = r.fixList.find(f => f.checkId === 'CHK-TECH-HTTPS')!;
    // Deficit 25 points on a 12-weight category with 2 measured checks, scaled by measured coverage.
    const exact = (25 * 12) / (2 * r.coveragePercent);
    expect(Math.abs(fix.recoverablePoints - exact)).toBeLessThanOrEqual(0.15);
    // The old simple formula would report (25 * 6 / 100) = 1.5 regardless of coverage.
    expect(r.coveragePercent).toBeLessThan(100);
    expect(Math.abs(fix.recoverablePoints - 1.5)).toBeGreaterThan(0.15);
  });
});
