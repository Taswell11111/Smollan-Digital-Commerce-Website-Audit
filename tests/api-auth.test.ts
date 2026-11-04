import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { tokenMatches, readCookie, SessionStore, productionAuthConfigError, SESSION_TTL_MS, SESSION_COOKIE } from '../server/auth';

const TOKEN = 'test-api-token-0123456789';
let app: any;
let request: any;

beforeAll(async () => {
  process.env.API_TOKEN = TOKEN;
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-'));
  const mod = await import('../server');
  app = mod.app;
  request = (await import('supertest')).default;
});

describe('unit: credential helpers', () => {
  it('tokenMatches accepts only the exact token', () => {
    expect(tokenMatches(TOKEN, TOKEN)).toBe(true);
    expect(tokenMatches(TOKEN + 'x', TOKEN)).toBe(false);
    expect(tokenMatches('short', TOKEN)).toBe(false);
    expect(tokenMatches(undefined, TOKEN)).toBe(false);
    expect(tokenMatches(42, TOKEN)).toBe(false);
    expect(tokenMatches('', '')).toBe(false);
  });

  it('readCookie finds the named cookie among several', () => {
    expect(readCookie('a=1; smollan_session=abc%2Fdef; b=2', SESSION_COOKIE)).toBe('abc/def');
    expect(readCookie('a=1', SESSION_COOKIE)).toBeUndefined();
    expect(readCookie(undefined, SESSION_COOKIE)).toBeUndefined();
  });

  it('sessions expire after the TTL', () => {
    const store = new SessionStore();
    const now = 1_000_000;
    const id = store.create(now);
    expect(store.isValid(id, now + SESSION_TTL_MS - 1)).toBe(true);
    expect(store.isValid(id, now + SESSION_TTL_MS + 1)).toBe(false);
    expect(store.isValid('never-issued')).toBe(false);
  });

  it('production refuses to start without API_TOKEN; development does not', () => {
    expect(productionAuthConfigError({ NODE_ENV: 'production' } as any)).toMatch(/API_TOKEN/);
    expect(productionAuthConfigError({ NODE_ENV: 'production', API_TOKEN: 'x' } as any)).toBeNull();
    expect(productionAuthConfigError({ NODE_ENV: 'development' } as any)).toBeNull();
  });
});

describe('API routes require authentication', () => {
  it('rejects unauthenticated data reads', async () => {
    expect((await request(app).get('/api/services')).status).toBe(401);
    expect((await request(app).get('/api/leads')).status).toBe(401);
    expect((await request(app).get('/api/audits')).status).toBe(401);
  });

  it('rejects unauthenticated writes and paid actions', async () => {
    expect((await request(app).post('/api/services').send([])).status).toBe(401);
    expect((await request(app).post('/api/audit').send({ url: 'https://example.com' })).status).toBe(401);
    expect((await request(app).post('/api/pitch').send({})).status).toBe(401);
  });

  it('reports the session state without leaking data', async () => {
    const res = await request(app).get('/api/session');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ authenticated: false, authRequired: true });
  });

  it('rejects a wrong token at login', async () => {
    const res = await request(app).post('/api/session').send({ token: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('accepts a bearer token', async () => {
    const res = await request(app).get('/api/services').set('Authorization', `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
  });

  it('rejects a wrong bearer token', async () => {
    const res = await request(app).get('/api/services').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('login issues an HttpOnly, SameSite=Strict session cookie that unlocks the API', async () => {
    const login = await request(app).post('/api/session').send({ token: TOKEN });
    expect(login.status).toBe(200);
    const setCookie = String(login.headers['set-cookie']?.[0] ?? '');
    expect(setCookie).toMatch(/smollan_session=/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    const cookie = setCookie.split(';')[0];

    expect((await request(app).get('/api/session').set('Cookie', cookie)).status).toBe(200);
    expect((await request(app).get('/api/services').set('Cookie', cookie)).status).toBe(200);
  });

  it('logout revokes the session', async () => {
    const login = await request(app).post('/api/session').send({ token: TOKEN });
    const cookie = String(login.headers['set-cookie'][0]).split(';')[0];
    expect((await request(app).get('/api/services').set('Cookie', cookie)).status).toBe(200);
    await request(app).post('/api/logout').set('Cookie', cookie);
    expect((await request(app).get('/api/services').set('Cookie', cookie)).status).toBe(401);
  });
});
