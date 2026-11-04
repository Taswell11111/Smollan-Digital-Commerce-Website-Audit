import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression guard. Each pattern is a figure, source attribution or capability claim that was
 * hardcoded in the audit output and had no measurement behind it. If one reappears, a prospect
 * could receive it as fact. Add to this list rather than relaxing it.
 */
const BANNED: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /Bain/, why: 'attributed market projection with no source in this repo' },
  { pattern: /\$300B/, why: 'unsourced market size' },
  { pattern: /89\.4%/, why: 'unsourced market share' },
  { pattern: /3\.1x/, why: 'unsourced citation uplift' },
  { pattern: /\+32%/, why: 'unsourced conversion lift' },
  { pattern: /68% of (retail|inspected)/, why: 'unsourced traffic or inventory share' },
  { pattern: /Top-3 Ranking/, why: 'projected rank with no measurement' },
  { pattern: /KYA Real-Time/, why: 'capability claim not measured' },
  { pattern: /verified POPIA/i, why: 'compliance claim not measured' },
  { pattern: /Zero critical accessibility/i, why: 'overstated accessibility scope' },
  { pattern: /mcpReady/, why: 'capability flag hardcoded true' },
  { pattern: /costSavingsPercent|commercialAuditBenchmark|99\.99% Saved/, why: 'fabricated cost comparison' },
  { pattern: /Audit Cost: R 0\.035/, why: 'hardcoded cost' },
  { pattern: /2\.9%|69\.8%|globalMedian|globalTopTier/, why: 'unsourced industry median' },
  { pattern: /99\.99% Uptime|LCP Guarantee/, why: 'service commitment presented as fact' },
  { pattern: /12-factor|across 12 criteria/, why: 'invented methodology count' },
  { pattern: /estimatedTrafficUplift|searchVolume:\s*\d/, why: 'hardcoded keyword volume or traffic' },
  { pattern: /agenticScore|readinessTier|executionCost\s*[:=]/, why: 'removed score or cost model reintroduced' },
  { pattern: /35 points of conversion|12-24%|\+30% CONVERSION|\+25% Conversion|\+34%/i, why: 'unsourced conversion or recovery promise' },
  { pattern: /recover up to 90\/100|up to 40% catalog/, why: 'hardcoded recovery ceiling or catalogue statistic' },
  { pattern: /on 100% of pages/, why: 'coverage claim not verified across the site' },
  { pattern: /Verified (Enterprise Client|Buyer|Customer Reviews)/, why: 'sample testimonials presented as verified' },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('no fabricated figures in audit or report output', () => {
  const root = path.resolve(__dirname, '..');
  const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'server')), path.join(root, 'server.ts')];

  it.each(BANNED.map(b => [b.why, b.pattern] as const))('absent: %s', (_why, pattern) => {
    const hits = files
      .filter(f => pattern.test(fs.readFileSync(f, 'utf-8')))
      .map(f => path.relative(root, f));
    expect(hits).toEqual([]);
  });
});
