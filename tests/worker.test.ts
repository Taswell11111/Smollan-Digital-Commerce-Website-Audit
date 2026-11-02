import { describe, it, expect } from 'vitest';
import { callBrowserWorker } from '../server/workerClient';
import fs from 'fs';
import path from 'path';

describe('Phase 4c Worker Integration & Safety Tests', () => {
  it('Worker unavailable: when WORKER_TOKEN is unset, rendered checks are not_measured with worker_unavailable', async () => {
    const originalToken = process.env.WORKER_TOKEN;
    delete process.env.WORKER_TOKEN;

    const result = await callBrowserWorker({
      url: 'https://example.com',
      scenario: 'home',
      checkIds: ['CHK-PERF-LCP'],
      allowCartJourney: false
    });

    expect(result.results['CHK-PERF-LCP']).toEqual({
      status: 'not_measured',
      reason: 'worker_unavailable'
    });
    expect(result.errors.length).toBeGreaterThan(0);

    if (originalToken) {
      process.env.WORKER_TOKEN = originalToken;
    }
  });

  it('Worker token never leaks into client build bundle', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const tokenVal = process.env.WORKER_TOKEN || 'SECRET_WORKER_TOKEN_VAL_12345';
    process.env.WORKER_TOKEN = tokenVal;

    const checkFileForToken = (filePath: string) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.includes(tokenVal)).toBe(false);
      }
    };

    checkFileForToken(path.join(process.cwd(), 'src', 'App.tsx'));
    checkFileForToken(path.join(process.cwd(), 'src', 'components', 'NewAuditForm.tsx'));
  });
});
