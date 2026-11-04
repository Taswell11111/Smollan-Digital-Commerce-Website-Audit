import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let mod: typeof import('../server');

beforeAll(async () => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hardening-'));
  mod = await import('../server');
});

describe('AI verdict shape check', () => {
  it('accepts a short single-line string', () => {
    expect(mod.isShortText('Strong storefront with two essential gaps', 12)).toBe(true);
  });
  it('rejects non-strings, empty strings, multi-line text and over-long text', () => {
    expect(mod.isShortText(42, 12)).toBe(false);
    expect(mod.isShortText('   ', 12)).toBe(false);
    expect(mod.isShortText('line one\nline two', 12)).toBe(false);
    expect(mod.isShortText('one two three four five six seven eight nine ten eleven twelve thirteen', 12)).toBe(false);
  });
});

describe('legacy audit migration on read', () => {
  it('drops the old agenticCommerce shape and executionCost, keeps measured data', () => {
    const legacy: any = { id: 'a', agenticCommerce: { agenticScore: 72, fourLayerArchitecture: {} }, executionCost: { totalEstimatedCostZar: 0.03 } };
    mod.sanitizeLegacyAudit(legacy);
    expect(legacy.agenticCommerce).toBeUndefined();
    expect(legacy.executionCost).toBeUndefined();

    const current: any = { id: 'b', agenticCommerce: { measured: { jsonLd: {} }, notMeasured: [] } };
    mod.sanitizeLegacyAudit(current);
    expect(current.agenticCommerce).toBeDefined();
  });
});

describe('audit status pruning', () => {
  it('removes finished statuses past the TTL and keeps running ones', () => {
    const now = Date.now();
    const old = now - 3 * 60 * 60 * 1000;
    mod.auditStatusMap.set('AUD-old-done', { status: 'complete', logs: [] } as any);
    mod.auditStatusMap.set('AUD-old-running', { status: 'running', logs: [] } as any);
    mod.auditStatusMap.set('AUD-new-done', { status: 'complete', logs: [] } as any);
    // Creation times are tracked by the POST path; simulate that here.
    mod.__auditCreatedAtForTests.set('AUD-old-done', old);
    mod.__auditCreatedAtForTests.set('AUD-old-running', old);
    mod.__auditCreatedAtForTests.set('AUD-new-done', now);
    mod.pruneAuditStatus(now);
    expect(mod.auditStatusMap.has('AUD-old-done')).toBe(false);
    expect(mod.auditStatusMap.has('AUD-old-running')).toBe(true);
    expect(mod.auditStatusMap.has('AUD-new-done')).toBe(true);
  });
});
