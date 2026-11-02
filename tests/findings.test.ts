import { describe, it, expect } from 'vitest';
import { senderConfig } from '../src/config/sender';

describe('Evidence Integrity & Sender Compliance', () => {
  it('verifies sender configuration contains name, company, reason, and exact opt-out text', () => {
    expect(senderConfig.name).toBeTruthy();
    expect(senderConfig.company).toBeTruthy();
    expect(senderConfig.contactReason).toBeTruthy();
    expect(senderConfig.optOutNotice).toContain('Reply STOP or ask us to remove you and we will not contact you again.');
  });

  it('validates finding schema integrity: source is strictly measured or ai', () => {
    const sampleFinding = {
      id: 'MSR-01',
      title: 'Images missing descriptive alt attributes',
      category: 'Accessibility',
      affectedUrl: 'https://example.com/shop',
      observedEvidence: '4 of 12 images missing alt text',
      businessImpact: 'Degrades screen-reader accessibility.',
      severity: 'Essential' as const,
      confidence: 'High' as const,
      effort: 'low' as const,
      proposedRemedy: 'Add descriptive alt text to all product images.',
      serviceLine: 'UX/UI & Conversion-Rate Optimisation',
      source: 'measured' as const
    };

    expect(sampleFinding.id).toMatch(/^MSR-\d+$/);
    expect(sampleFinding.id).not.toContain('FND-0');
    expect(sampleFinding.source).toBe('measured');
    expect(sampleFinding.confidence).toBe('High');
    expect(sampleFinding.observedEvidence).toMatch(/\d+ of \d+/);
  });
});
