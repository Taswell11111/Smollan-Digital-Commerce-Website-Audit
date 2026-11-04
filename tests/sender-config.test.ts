import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// The opt-out address is configured through the server environment. Vite replaces process.env
// in the browser bundle with an empty object, so a client-side import silently ignores it.
describe('sender configuration', () => {
  it('client components do not import the server sender config', () => {
    const dir = path.resolve(__dirname, '../src');
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name) && /config\/sender/.test(fs.readFileSync(p, 'utf-8'))) offenders.push(path.relative(dir, p));
      }
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });
});
