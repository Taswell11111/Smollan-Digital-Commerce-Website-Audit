import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import { __setIpBlockPolicyForTests, isBlockedIp } from '../src/utils/ssrf';

// Loopback is the only address the fixture can use, so allow exactly that under test.
// __setIpBlockPolicyForTests refuses to run outside Vitest.
const ALLOW_LOOPBACK_ONLY = (ip: string) => (ip === '127.0.0.1' ? false : isBlockedIp(ip));

let dataDir: string;
let mod: typeof import('../server');
let hits = 0;
let requested: string[] = [];

function fixture(opts: { delayMs: number; linkCount: number; onHome?: () => void; homeHtml?: string; robots?: string }) {
  return http.createServer((req, res) => {
    hits++;
    const url = req.url ?? '/';
    requested.push(url);
    if (url === '/') opts.onHome?.();
    if (url === '/robots.txt' && opts.robots !== undefined) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(opts.robots);
      return;
    }
    const respond = () => {
      if (url === '/') {
        const links = Array.from({ length: opts.linkCount }, (_, i) => `<a href="/p/${i}">item ${i}</a>`).join('');
        res.writeHead(200, { 'content-type': 'text/html' });
        // Deliberately bare: no description, no viewport, no canonical, one image without alt.
        res.end(opts.homeHtml ?? `<!doctype html><html><head><title>Shop</title></head><body>${links}<img src="/a.png"></body></html>`);
      } else if (url.startsWith('/p/')) {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('<!doctype html><html><head><title>Item</title></head><body>item</body></html>');
      } else {
        res.writeHead(404);
        res.end();
      }
    };
    setTimeout(respond, opts.delayMs);
  });
}

function resetDataDir() {
  for (const f of fs.readdirSync(dataDir)) fs.rmSync(path.join(dataDir, f), { force: true, recursive: true });
}

function readJsonArray(name: string): any[] {
  const p = path.join(dataDir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : [];
}

function newAuditId() {
  const id = `AUD-test-${Math.random().toString(36).slice(2)}`;
  mod.auditStatusMap.set(id, { status: 'running', logs: [] });
  return id;
}

function baseParams(url: string, extra: Record<string, unknown> = {}) {
  return { url, depth: 'quick', maxPages: 1, mode: 'prospect', businessCategory: 'Ecommerce', ...extra };
}

function findCheck(audit: any, id: string) {
  for (const cat of Object.values(audit.categoryResults) as any[]) {
    const hit = cat.checks.find((c: any) => c.id === id);
    if (hit) return hit;
  }
  throw new Error(`check ${id} missing from audit`);
}

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-int-'));
  process.env.DATA_DIR = dataDir;
  delete process.env.WORKER_TOKEN; // worker path returns not_measured deterministically
  delete process.env.GEMINI_API_KEY;
  delete process.env.FIRECRAWL_API_KEY;
  __setIpBlockPolicyForTests(ALLOW_LOOPBACK_ONLY);
  mod = await import('../server');
});

beforeEach(() => {
  resetDataDir();
  hits = 0;
  requested = [];
});

afterEach(() => {
  __setIpBlockPolicyForTests(null);
  __setIpBlockPolicyForTests(ALLOW_LOOPBACK_ONLY);
});

async function listen(srv: http.Server): Promise<string> {
  await new Promise<void>(r => srv.listen(0, '127.0.0.1', r));
  return `http://127.0.0.1:${(srv.address() as AddressInfo).port}/`;
}

describe('end-to-end audit against a bare loopback storefront', () => {
  it('does not report a bare homepage as a passing audit', async () => {
    const srv = fixture({ delayMs: 0, linkCount: 0 });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url));
      const status = mod.auditStatusMap.get(id)!;
      expect(status.status).toBe('complete');
      const audit = status.result.audit;

      expect(audit.overallScore).toBeLessThan(100);
      expect(findCheck(audit, 'CHK-CHK-SHIPPING').status).not.toBe('pass');
      expect(findCheck(audit, 'CHK-SRCH-SEARCH').status).not.toBe('pass');
      expect(findCheck(audit, 'CHK-MOB-TAP').status).not.toBe('pass');
      expect(audit.cartJourneyRun).toBe(false);
      expect(audit.scenariosRun).toEqual(['home']);

      // Persisted exactly once.
      expect(readJsonArray('audits.json').map((a: any) => a.id)).toEqual([audit.id]);
    } finally {
      srv.close();
    }
  });
});

describe('measured agentic-commerce signals', () => {
  it('reports JSON-LD types and per-bot robots access from the actual page and robots.txt', async () => {
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Product', name: 'x', offers: { '@type': 'Offer' } }] });
    const homeHtml = `<!doctype html><html><head><title>Shop</title><script type="application/ld+json">${jsonLd}</script></head><body><img src="/a.png"></body></html>`;
    const srv = fixture({ delayMs: 0, linkCount: 0, homeHtml, robots: 'User-agent: GPTBot\nDisallow: /\n' });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url));
      const audit = mod.auditStatusMap.get(id)!.result.audit;
      const ac = audit.agenticCommerce.measured;

      expect(ac.jsonLd.typesFound).toEqual(['Offer', 'Product']);
      expect(ac.jsonLd.missingRequiredTypes).toEqual(['AggregateRating', 'BreadcrumbList', 'FAQPage']);
      expect(ac.jsonLd.pagesWithJsonLd).toBe(1);
      expect(ac.robots.status).toBe('fetched');
      expect(ac.robots.aiBots.GPTBot).toBe('disallowed');
      expect(ac.robots.aiBots.PerplexityBot).toBe('allowed');
      expect(audit.agenticCommerce.notMeasured.length).toBeGreaterThan(0);
      expect(audit.agenticCommerce).not.toHaveProperty('agenticScore');
    } finally {
      srv.close();
    }
  });

  it('a site with no robots.txt is reported as absent, with bots allowed', async () => {
    const srv = fixture({ delayMs: 0, linkCount: 0 });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url));
      const ac = mod.auditStatusMap.get(id)!.result.audit.agenticCommerce.measured;
      expect(ac.robots.status).toBe('absent');
      expect(ac.robots.aiBots.GPTBot).toBe('allowed');
    } finally {
      srv.close();
    }
  });
});

describe('crawler honours robots.txt', () => {
  it('skips disallowed paths and records how many were skipped', async () => {
    const srv = fixture({ delayMs: 0, linkCount: 3, robots: 'User-agent: *\nDisallow: /p/\n' });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url, { depth: 'deep', maxPages: 10 }));
      const audit = mod.auditStatusMap.get(id)!.result.audit;
      expect(audit.pagesInspected.map((p: any) => new URL(p.url).pathname)).toEqual(['/']);
      expect(audit.crawlSummary.robotsBlocked).toBe(3);
      // No disallowed item page was requested by either the crawl or the rendered fallback.
      expect(requested.filter(u => u.startsWith('/p/'))).toEqual([]);
      expect(requested).toContain('/robots.txt');
    } finally {
      srv.close();
    }
  });

  it('a disallowed homepage is reported as a bot-access restriction, not as a crash', async () => {
    const srv = fixture({ delayMs: 0, linkCount: 0, robots: 'User-agent: *\nDisallow: /\n' });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url));
      const status = mod.auditStatusMap.get(id)!;
      expect(status.status).toBe('complete');
      expect(status.result.audit.auditError).toMatch(/robots\.txt/);
      expect(status.result.audit.pagesInspected).toEqual([]);
    } finally {
      srv.close();
    }
  });
});

describe('cancellation', () => {
  it('stops the crawl and persists no audit or lead', async () => {
    const srv = fixture({ delayMs: 150, linkCount: 40 });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      const run = mod.runAudit(id, baseParams(url, { depth: 'deep', maxPages: 40 }));
      await new Promise(r => setTimeout(r, 100));
      expect(mod.cancelAuditRecord(id)).toBe('cancelled');
      await run;

      const status = mod.auditStatusMap.get(id)!;
      expect(status.status).toBe('failed');
      expect(status.error).toBe('cancelled');
      expect(readJsonArray('audits.json')).toEqual([]);
      expect(readJsonArray('leads.json')).toEqual([]);
      // Only the in-flight homepage was requested; the crawl did not continue.
      expect(hits).toBeLessThanOrEqual(2);
    } finally {
      srv.close();
    }
  });

  it('a cancel that lands during the final request still persists nothing', async () => {
    // Fires while the last page is in flight: after the crawl's last checkpoint,
    // so only the post-scoring and pre-write guards can stop the write.
    const id = newAuditId();
    const srv = fixture({ delayMs: 0, linkCount: 0, onHome: () => mod.cancelAuditRecord(id) });
    const url = await listen(srv);
    try {
      await mod.runAudit(id, baseParams(url));
      expect(mod.auditStatusMap.get(id)!.error).toBe('cancelled');
      expect(readJsonArray('audits.json')).toEqual([]);
      expect(readJsonArray('leads.json')).toEqual([]);
    } finally {
      srv.close();
    }
  });

  it('cancelling an unknown audit reports not_found', () => {
    expect(mod.cancelAuditRecord('AUD-does-not-exist')).toBe('not_found');
  });
});

describe('storage failure during an audit', () => {
  it('quarantines corrupt history and does not overwrite it', async () => {
    const garbage = '{"half-written": ';
    fs.writeFileSync(path.join(dataDir, 'audits.json'), garbage);
    const srv = fixture({ delayMs: 0, linkCount: 0 });
    const url = await listen(srv);
    try {
      const id = newAuditId();
      await mod.runAudit(id, baseParams(url));
      expect(mod.auditStatusMap.get(id)!.error).toBe('storage_corrupt');

      const quarantined = fs.readdirSync(dataDir).filter(f => f.startsWith('audits.json.corrupt-'));
      expect(quarantined).toHaveLength(1);
      expect(fs.readFileSync(path.join(dataDir, quarantined[0]), 'utf-8')).toBe(garbage);
      expect(fs.existsSync(path.join(dataDir, 'audits.json'))).toBe(false);
    } finally {
      srv.close();
    }
  });
});
