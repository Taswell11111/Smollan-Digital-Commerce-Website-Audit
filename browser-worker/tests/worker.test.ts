import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, validateHostname } from '../src/server';
import { CHECK_IDS } from '../src/checkIds';
import { CATEGORY_RULESET } from '../../src/config/ruleset';

describe('Browser Worker Core (Phase 4a)', () => {
  beforeEach(() => {
    process.env.WORKER_TOKEN = 'test-token';
  });

  it('GET /healthz returns ok: true without auth', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /v1/render rejects requests with missing or invalid token', async () => {
    const res = await request(app).post('/v1/render').send({ url: 'https://example.com', scenario: 'home', checkIds: ['CHK-PERF-LCP'] });
    expect(res.status).toBe(401);
  });

  it('POST /v1/render rejects non-http/https schemes with 400', async () => {
    const res = await request(app)
      .post('/v1/render')
      .set('Authorization', 'Bearer test-token')
      .send({ url: 'file:///etc/passwd', scenario: 'home', checkIds: ['CHK-PERF-LCP'] });
    expect(res.status).toBe(400);
  });

  it('POST /v1/render rejects unknown checkIds with 400', async () => {
    const res = await request(app)
      .post('/v1/render')
      .set('Authorization', 'Bearer test-token')
      .send({ url: 'https://example.com', scenario: 'home', checkIds: ['UNKNOWN-ID'] });
    expect(res.status).toBe(400);
  });

  it('SSRF hostname validator blocks private/loopback IPs', async () => {
    expect(await validateHostname('127.0.0.1')).toBe(false);
    expect(await validateHostname('10.0.0.1')).toBe(false);
    expect(await validateHostname('169.254.169.254')).toBe(false);
    expect(await validateHostname('100.64.1.1')).toBe(false);
  });

  it('Check ID list matches main ruleset.ts exactly', () => {
    const mainRulesetIds = CATEGORY_RULESET.flatMap(c => c.checks.map(chk => chk.id));
    expect(CHECK_IDS.sort()).toEqual(mainRulesetIds.sort());
  });
});
