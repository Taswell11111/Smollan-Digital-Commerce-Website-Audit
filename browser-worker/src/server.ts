import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dns from 'dns';
import ipaddr from 'ipaddr.js';
import { CHECK_IDS } from './checkIds.js';
import { chromium, Browser } from 'playwright';

const app = express();
app.use(express.json({ limit: '100kb' }));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

const robotsCache = new Map<string, { disallowedPaths: string[]; fetchedAt: number }>();
const lastLoadMap = new Map<string, number>();

import { validateHostname } from './ssrf.js';
import { evaluateChecks } from './checks.js';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const currentWorkerToken = process.env.WORKER_TOKEN;
  if (!currentWorkerToken && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    return res.status(500).json({ error: 'Worker token not configured' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.substring(7);
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(currentWorkerToken || '');

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid worker token' });
  }
  next();
}

app.get('/healthz', (req: Request, res: Response) => {
  res.json({ ok: true });
});

const ALLOWED_SCENARIOS = ['home', 'collection', 'product', 'cart_path'];

async function fetchRobotsTxt(origin: string, userAgent: string): Promise<string[]> {
  const now = Date.now();
  const cached = robotsCache.get(origin);
  if (cached && now - cached.fetchedAt < 3600 * 1000) {
    return cached.disallowedPaths;
  }

  const disallowedPaths: string[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const text = await res.text();
      let currentUserAgentMatches = false;
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('user-agent:')) {
          const ua = trimmed.substring(11).trim();
          currentUserAgentMatches = ua === '*' || userAgent.toLowerCase().includes(ua.toLowerCase());
        } else if (currentUserAgentMatches && trimmed.toLowerCase().startsWith('disallow:')) {
          const path = trimmed.substring(9).trim();
          if (path) disallowedPaths.push(path);
        }
      }
    }
  } catch {}

  robotsCache.set(origin, { disallowedPaths, fetchedAt: now });
  return disallowedPaths;
}

let browserInstance: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  return browserInstance;
}

app.post('/v1/render', authMiddleware, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { url, scenario, checkIds, allowCartJourney } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http and https schemes are supported' });
  }

  if (!ALLOWED_SCENARIOS.includes(scenario)) {
    return res.status(400).json({ error: 'Invalid scenario' });
  }

  if (!Array.isArray(checkIds) || checkIds.some(id => !CHECK_IDS.includes(id))) {
    return res.status(400).json({ error: 'Unknown or invalid checkId requested' });
  }

  const origin = parsedUrl.origin;
  const userAgent = 'SmollanBrowserWorker/1.0';

  const disallowed = await fetchRobotsTxt(origin, userAgent);
  const pathname = parsedUrl.pathname;
  const isDisallowed = disallowed.some(path => path === '/' || pathname.startsWith(path));

  const results: Record<string, any> = {};
  const errors: string[] = [];
  let blockedRequestCount = 0;

  if (isDisallowed) {
    for (const id of checkIds) {
      results[id] = { status: 'not_measured', reason: 'robots_disallowed' };
    }
    return res.json({
      results,
      errors: ['URL disallowed by robots.txt'],
      blockedRequestCount: 0,
      durationMs: Date.now() - startTime
    });
  }

  const host = parsedUrl.hostname;
  const lastLoad = lastLoadMap.get(host) || 0;
  const elapsed = Date.now() - lastLoad;
  if (elapsed < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
  }
  lastLoadMap.set(host, Date.now());

  if (scenario === 'cart_path' && !allowCartJourney) {
    for (const id of checkIds) {
      results[id] = { status: 'not_measured', reason: 'journey_disabled' };
    }
    return res.json({
      results,
      errors: [],
      blockedRequestCount,
      durationMs: Date.now() - startTime
    });
  }

  let browser: Browser;
  try {
    browser = await getBrowser();
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to launch browser: ${err.message}` });
  }

  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  page.route('**/*', async route => {
    const reqUrl = route.request().url();
    try {
      const rUrl = new URL(reqUrl);
      if (rUrl.protocol !== 'http:' && rUrl.protocol !== 'https:') {
        blockedRequestCount++;
        return route.abort();
      }
      const valid = await validateHostname(rUrl.hostname);
      if (!valid) {
        blockedRequestCount++;
        return route.abort();
      }
      await route.continue();
    } catch {
      blockedRequestCount++;
      return route.abort();
    }
  });

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Budget exhaustion timeout')), 120000));
    // NOTE: DNS-rebinding gap: the worker resolves DNS here to validate hostname,
    // then Chromium resolves again when navigating. Do not fix it in this pass.
    const renderTask = async () => {
      await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
      const checkResults = await evaluateChecks(page, scenario, checkIds, allowCartJourney);
      Object.assign(results, checkResults);
    };
    await Promise.race([renderTask(), timeoutPromise]);
  } catch (err: any) {
    errors.push(err.message);
    for (const id of checkIds) {
      if (!results[id]) {
        results[id] = { status: 'not_measured', reason: 'budget_exhaustion' };
      }
    }
  } finally {
    await context.close();
  }

  for (const id of checkIds) {
    if (!results[id]) {
      results[id] = { status: 'not_measured', reason: 'not_implemented' };
    }
  }

  res.json({
    results,
    errors,
    blockedRequestCount,
    durationMs: Date.now() - startTime
  });
});

if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smollan Browser Worker running on port ${PORT}`);
  });
}

if (!process.env.WORKER_TOKEN && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  console.error('FATAL: WORKER_TOKEN environment variable is unset. Refusing to start.');
  process.exit(1);
}

export { app, validateHostname };
