import { Page } from 'playwright';

// Word boundaries matter: a bare substring match on "available" also matches "unavailable".
export const STOCK_SIGNAL_RE = /\bin stock\b|\bavailable\b|\badd to cart\b/;

export async function evaluateChecks(page: Page, scenario: string, checkIds: string[], allowCartJourney: boolean) {
  const results: Record<string, any> = {};

  for (const id of checkIds) {
    switch (id) {
      case 'CHK-PERF-LCP':
      case 'CHK-PERF-INP':
      case 'CHK-PERF-CLS': {
        const cwv = await page.evaluate(async (checkId) => {
          return new Promise((resolve) => {
            let lcpVal: number | null = null;
            let clsVal = 0;
            let inpVal: number | null = null;

            try {
              const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const last = entries[entries.length - 1];
                if (last) lcpVal = last.startTime;
              });
              lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

              const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!(entry as any).hadRecentInput) {
                    clsVal += (entry as any).value;
                  }
                }
              });
              clsObserver.observe({ type: 'layout-shift', buffered: true });

              const eventObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  const duration = (entry as any).duration || (entry as any).processingEnd - (entry as any).startTime;
                  if (inpVal === null || duration > inpVal) {
                    inpVal = duration;
                  }
                }
              });
              eventObserver.observe({ type: 'event', buffered: true });
            } catch {}

            setTimeout(() => {
              if (checkId === 'CHK-PERF-LCP') {
                if (lcpVal !== null) {
                  resolve({ status: 'measured', value: Math.round(lcpVal), tier: 'measured', source: 'measured' });
                } else {
                  resolve({ status: 'not_measured', reason: 'no_lcp_observed' });
                }
              } else if (checkId === 'CHK-PERF-CLS') {
                resolve({ status: 'measured', value: Number(clsVal.toFixed(4)), tier: 'measured', source: 'measured' });
              } else if (checkId === 'CHK-PERF-INP') {
                if (inpVal !== null) {
                  resolve({ status: 'measured', value: Math.round(inpVal), tier: 'measured', source: 'measured' });
                } else {
                  resolve({ status: 'not_measured', reason: 'no_input_observed' });
                }
              }
            }, 3000);
          });
        }, id);
        results[id] = cwv;
        break;
      }
      case 'CHK-PROD-PRICE': {
        const visiblePrices = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('body *'));
          const textNodes: string[] = [];
          for (const el of els) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              const txt = (el as HTMLElement).innerText || '';
              if (txt && txt.length < 50) textNodes.push(txt);
            }
          }
          const priceRegex = /(?:R|\$|€|£)\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|(?:\bZAR\b|\bUSD\b)\s?\d{1,3}/i;
          return textNodes.some(t => priceRegex.test(t));
        });
        results[id] = { status: 'measured', value: visiblePrices, tier: 'rendered', source: 'none' };
        break;
      }
      case 'CHK-PROD-STOCK': {
        // Regex source is passed in so the browser and unit tests share one definition.
        const hasStock = await page.evaluate(
          (src: string) => new RegExp(src, 'i').test(document.body.innerText),
          STOCK_SIGNAL_RE.source
        );
        results[id] = { status: 'measured', value: hasStock, tier: 'rendered', source: 'none' };
        break;
      }
      case 'CHK-PROD-ATCVIEW': {
        const atcVisible = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]')).find(el => {
            const txt = (el as HTMLElement).innerText.toLowerCase();
            return txt.includes('add to cart') || txt.includes('buy') || txt.includes('add to bag');
          });
          if (!btn) return false;
          const rect = btn.getBoundingClientRect();
          return rect.top >= 0 && rect.top < window.innerHeight && rect.width > 0 && rect.height > 0;
        });
        results[id] = { status: 'measured', value: atcVisible, tier: 'rendered', source: 'none' };
        break;
      }
      case 'CHK-PROD-ALT': {
        const altData = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          if (imgs.length === 0) return { total: 0, missing: 0, ratio: 1 };
          let missing = 0;
          for (const img of imgs) {
            const alt = img.getAttribute('alt');
            if (!alt || alt.trim() === '') missing++;
          }
          return { total: imgs.length, missing, ratio: (imgs.length - missing) / imgs.length };
        });
        results[id] = { status: 'measured', value: altData, tier: 'rendered', source: 'sourced' };
        break;
      }
      case 'CHK-MOB-TAP': {
        // Not implemented: a hardcoded `true` would be reported as a measurement.
        results[id] = { status: 'not_measured', reason: 'not_implemented' };
        break;
      }
      case 'CHK-MOB-VIEWPORT': {
        const hasVp = await page.evaluate(() => !!document.querySelector('meta[name="viewport"]'));
        results[id] = { status: 'measured', value: hasVp, tier: 'measured', source: 'sourced' };
        break;
      }
      case 'CHK-SEO-CANONICAL': {
        const hasCan = await page.evaluate(() => !!document.querySelector('link[rel="canonical"]'));
        results[id] = { status: 'measured', value: hasCan, tier: 'measured', source: 'sourced' };
        break;
      }
      case 'CHK-SEO-METAS': {
        const title = await page.title();
        const desc = await page.evaluate(() => document.querySelector('meta[name="description"]')?.getAttribute('content') || '');
        const valid = !!(title && title !== 'Untitled' && desc);
        results[id] = { status: 'measured', value: valid, tier: 'measured', source: 'sourced' };
        break;
      }
      default: {
        results[id] = { status: 'not_measured', reason: 'not_implemented' };
        break;
      }
    }
  }

  return results;
}
