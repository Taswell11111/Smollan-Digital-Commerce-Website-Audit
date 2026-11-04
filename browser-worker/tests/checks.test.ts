import { describe, it, expect } from 'vitest';
import { STOCK_SIGNAL_RE } from '../src/checks';

describe('stock signal regex', () => {
  it.each(['In stock now', 'Add to cart', 'Available to ship'])('matches %j', text => {
    expect(STOCK_SIGNAL_RE.test(text.toLowerCase())).toBe(true);
  });

  it.each(['Currently unavailable', 'Sold out', 'Notify me when back'])('does not match %j', text => {
    expect(STOCK_SIGNAL_RE.test(text.toLowerCase())).toBe(false);
  });
});
