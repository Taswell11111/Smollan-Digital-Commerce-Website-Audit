import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Audits saved before the measured-only change still carry the old agenticCommerce shape
 * (agenticScore, fourLayerArchitecture, no `measured`). Any component that reads
 * agenticCommerce.measured must tolerate that, or opening an old audit crashes the UI.
 */
describe('legacy agenticCommerce shape', () => {
  const dir = path.resolve(__dirname, '../src/components');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

  it('no component dereferences .measured without optional chaining or a guard', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf-8');
      // unguarded forms: `.measured.` or `.measured;` / destructuring `= ac.measured;`
      if (/agenticCommerce\??\.measured\./.test(src.replace(/measured\?\./g, 'measured.'))) {
        const lines = src.split('\n').filter(l => /agenticCommerce\??\.measured\./.test(l) && !/measured\?\./.test(l));
        if (lines.length) offenders.push(`${f}: ${lines[0].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
