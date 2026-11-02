import { describe, it, expect } from 'vitest';
import { generatePdfReportHtml, generateInternalActionPlanHtml } from '../src/utils/generatePdfReportHtml';
import { calculateRoi } from '../src/utils/roiModel';

describe('Report and PDF Generation Tests', () => {
  const mockAudit: any = {
    id: 'AUD-123',
    timestamp: '2026-10-31T00:00:00.000Z',
    url: 'https://example.com',
    businessName: 'Example Retail',
    overallScore: 85,
    projectedOverallScore: 95,
    crawlSummary: { discovered: 5, inspected: 5, failed: 0 },
    categoryResults: {
      'Mobile Optimisation': { score: 90, status: 'Optimised' },
      'Page Speed': { score: 80, status: 'Optimised' }
    },
    executiveVerdict: {
      headline: 'Measured: 2 checks failed.',
      summaryText: 'Prioritize mobile and speed optimization.'
    },
    findings: [
      {
        id: 'MSR-01',
        title: 'Missing Alt Text',
        category: 'Accessibility',
        affectedUrl: 'https://example.com/item',
        observedEvidence: '3 images missing alt text',
        severity: 'Essential',
        effort: 'low',
        proposedRemedy: 'Add alt text.',
        serviceLine: 'UX/UI'
      }
    ]
  };

  it('Prospect report HTML contains no TODO, comment tags (<!--), or rest of report text', () => {
    const roi = calculateRoi({ monthlyVisitors: 50000, conversionRate: 1.5, averageOrderValue: 450, lifts: [{ checkId: 'MSR-01', liftLow: 0.5, liftHigh: 1.2 }] });
    const html = generatePdfReportHtml(mockAudit, roi);

    expect(html).not.toContain('TODO');
    expect(html).not.toContain('<!--');
    expect(html).not.toContain('rest of report');
  });

  it('Internal action plan contains internal badge and findings', () => {
    const internalHtml = generateInternalActionPlanHtml(mockAudit);
    expect(internalHtml).toContain('INTERNAL — DO NOT SEND');
    expect(internalHtml).toContain('Missing Alt Text');
  });
});
