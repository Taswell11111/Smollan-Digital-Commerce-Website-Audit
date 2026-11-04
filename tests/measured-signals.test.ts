import { describe, it, expect } from 'vitest';
import { extractJsonLdTypes, evaluateAiBotAccess } from '../src/utils/measuredSignals';

const page = (...blocks: string[]) =>
  `<html><head>${blocks.map(b => `<script type="application/ld+json">${b}</script>`).join('')}</head><body></body></html>`;

describe('extractJsonLdTypes', () => {
  it('returns [] when there is no JSON-LD', () => {
    expect(extractJsonLdTypes('<html><body>hi</body></html>')).toEqual([]);
  });

  it('reads a single top-level @type', () => {
    expect(extractJsonLdTypes(page('{"@type":"Product"}'))).toEqual(['Product']);
  });

  it('reads @type arrays and @graph nodes', () => {
    const html = page(JSON.stringify({ '@graph': [{ '@type': ['Organization', 'Store'] }, { '@type': 'BreadcrumbList' }] }));
    expect(extractJsonLdTypes(html)).toEqual(['BreadcrumbList', 'Organization', 'Store']);
  });

  it('reads nested types such as Offer inside Product', () => {
    const html = page(JSON.stringify({ '@type': 'Product', offers: { '@type': 'Offer', price: '10' } }));
    expect(extractJsonLdTypes(html)).toEqual(['Offer', 'Product']);
  });

  it('ignores malformed blocks rather than counting them as present', () => {
    expect(extractJsonLdTypes(page('{"@type": "Product",'))).toEqual([]);
  });

  it('does not invent types from text that merely mentions them', () => {
    expect(extractJsonLdTypes('<p>JSON-LD Product schema coming soon</p>')).toEqual([]);
  });
});

describe('evaluateAiBotAccess', () => {
  it('reports unknown for every bot when robots.txt could not be fetched', () => {
    const r = evaluateAiBotAccess(null, ['GPTBot']);
    expect(r).toEqual({ GPTBot: 'unknown' });
  });

  it('reports allowed when robots.txt has no matching rule', () => {
    const r = evaluateAiBotAccess('User-agent: *\nDisallow:\n', ['GPTBot']);
    expect(r.GPTBot).toBe('allowed');
  });

  it('a bot-specific Disallow: / blocks that bot', () => {
    const r = evaluateAiBotAccess('User-agent: GPTBot\nDisallow: /\n', ['GPTBot', 'PerplexityBot']);
    expect(r.GPTBot).toBe('disallowed');
    expect(r.PerplexityBot).toBe('allowed');
  });

  it('a wildcard Disallow: / applies to bots without their own group', () => {
    const r = evaluateAiBotAccess('User-agent: *\nDisallow: /\n', ['PerplexityBot']);
    expect(r.PerplexityBot).toBe('disallowed');
  });

  it('a bot-specific group overrides the wildcard group', () => {
    const r = evaluateAiBotAccess('User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nDisallow:\n', ['GPTBot']);
    expect(r.GPTBot).toBe('allowed');
  });

  it('a partial Disallow is reported as partially_disallowed', () => {
    const r = evaluateAiBotAccess('User-agent: GPTBot\nDisallow: /private/\n', ['GPTBot']);
    expect(r.GPTBot).toBe('partially_disallowed');
  });

  it('a single stray 404 is not an access signal (input is text or null, never a count)', () => {
    expect(evaluateAiBotAccess(null, ['GPTBot']).GPTBot).toBe('unknown');
  });
});

describe('robots 404 semantics', () => {
  it('an empty robots body (404) means no rules, so bots are allowed', () => {
    expect(evaluateAiBotAccess('', ['GPTBot']).GPTBot).toBe('allowed');
  });
});

import { isPathAllowed } from '../src/utils/measuredSignals';

describe('isPathAllowed (crawler policy)', () => {
  const agent = 'SmollanDigitalAuditor';
  it('allows everything when there is no robots.txt', () => {
    expect(isPathAllowed(null, agent, '/anything')).toBe(true);
  });
  it('blocks a disallowed prefix for the wildcard group', () => {
    const t = 'User-agent: *\nDisallow: /private/\n';
    expect(isPathAllowed(t, agent, '/private/x')).toBe(false);
    expect(isPathAllowed(t, agent, '/public/x')).toBe(true);
  });
  it('a longer Allow overrides a shorter Disallow', () => {
    const t = 'User-agent: *\nDisallow: /shop/\nAllow: /shop/public/\n';
    expect(isPathAllowed(t, agent, '/shop/public/a')).toBe(true);
    expect(isPathAllowed(t, agent, '/shop/cart')).toBe(false);
  });
  it('our own group takes precedence over the wildcard group', () => {
    const t = 'User-agent: *\nDisallow: /\n\nUser-agent: SmollanDigitalAuditor\nDisallow:\n';
    expect(isPathAllowed(t, agent, '/product/1')).toBe(true);
  });
  it('supports * wildcards and $ anchors', () => {
    const t = 'User-agent: *\nDisallow: /*?sort=\nDisallow: /*.pdf$\n';
    expect(isPathAllowed(t, agent, '/collection?sort=price')).toBe(false);
    expect(isPathAllowed(t, agent, '/files/a.pdf')).toBe(false);
    expect(isPathAllowed(t, agent, '/files/a.pdf.html')).toBe(true);
  });
});
