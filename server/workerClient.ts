import 'dotenv/config';

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';
const WORKER_TOKEN = process.env.WORKER_TOKEN || '';

export interface RenderRequest {
  url: string;
  scenario: 'home' | 'collection' | 'product' | 'cart_path';
  checkIds: string[];
  allowCartJourney?: boolean;
}

export interface RenderResponse {
  results: Record<string, any>;
  errors: string[];
  blockedRequestCount: number;
  durationMs: number;
}

export async function callBrowserWorker(req: RenderRequest): Promise<RenderResponse> {
  if (!WORKER_TOKEN) {
    // If worker token is missing, return worker_unavailable for all checkIds
    const results: Record<string, any> = {};
    for (const id of req.checkIds) {
      results[id] = { status: 'not_measured', reason: 'worker_unavailable' };
    }
    return {
      results,
      errors: ['WORKER_TOKEN is unset; browser worker unavailable.'],
      blockedRequestCount: 0,
      durationMs: 0
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout

    const res = await fetch(`${WORKER_URL}/v1/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKER_TOKEN}`
      },
      body: JSON.stringify(req),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      const results: Record<string, any> = {};
      for (const id of req.checkIds) {
        results[id] = { status: 'not_measured', reason: 'worker_error' };
      }
      return {
        results,
        errors: [`Worker HTTP ${res.status}: ${errText}`],
        blockedRequestCount: 0,
        durationMs: 0
      };
    }

    const data = (await res.json()) as RenderResponse;
    return data;
  } catch (err: any) {
    const reason = err.name === 'AbortError' ? 'timeout' : 'worker_unavailable';
    const results: Record<string, any> = {};
    for (const id of req.checkIds) {
      results[id] = { status: 'not_measured', reason };
    }
    return {
      results,
      errors: [err.message || 'Worker communication failed'],
      blockedRequestCount: 0,
      durationMs: 0
    };
  }
}
