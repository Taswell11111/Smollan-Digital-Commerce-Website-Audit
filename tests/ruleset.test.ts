import { describe, it, expect } from 'vitest';
import { CATEGORY_RULESET, getTotalWeight, CATEGORY_WEIGHTS } from '../src/config/ruleset';

describe('Ruleset configuration', () => {
  it('weights in the ruleset must total exactly 100', () => {
    const total = getTotalWeight();
    expect(total).toBe(100);
  });

  it('each category in CATEGORY_RULESET has positive weight and at least one check', () => {
    CATEGORY_RULESET.forEach(category => {
      expect(category.weight).toBeGreaterThan(0);
      expect(category.checks.length).toBeGreaterThan(0);
      expect(CATEGORY_WEIGHTS[category.name]).toBe(category.weight);
    });
  });
});
