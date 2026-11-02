import { describe, it, expect, vi } from 'vitest';
import { validateTargetUrl, safeFetch, isBlockedIp } from '../src/utils/ssrf';

describe('SSRF Protection & URL Validation', () => {
  it('rejects direct IPv4 loopback (http://127.0.0.1/)', async () => {
    const result = await validateTargetUrl('http://127.0.0.1/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects localhost hostname (http://localhost/)', async () => {
    const result = await validateTargetUrl('http://localhost/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/internal host|blocked/i);
  });

  it('rejects AWS/GCP cloud metadata IP (http://169.254.169.254/)', async () => {
    const result = await validateTargetUrl('http://169.254.169.254/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects IPv6 loopback (http://[::1]/)', async () => {
    const result = await validateTargetUrl('http://[::1]/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects private IPv4 class A (http://10.0.0.1/)', async () => {
    const result = await validateTargetUrl('http://10.0.0.1/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects 0.0.0.0 broadcast/all-interfaces (http://0.0.0.0/)', async () => {
    const result = await validateTargetUrl('http://0.0.0.0/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects decimal-encoded IP (http://2130706433/ which normalizes to 127.0.0.1)', async () => {
    const result = await validateTargetUrl('http://2130706433/');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private|restricted|blocked/i);
  });

  it('rejects a public-looking domain that resolves to 127.0.0.1 (mock DNS resolution)', async () => {
    const mockLookup = vi.fn().mockResolvedValue([
      { address: '127.0.0.1', family: 4 }
    ]);

    const result = await validateTargetUrl('https://evil-spoof-domain.com/', mockLookup);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/resolves to blocked/i);
  });

  it('rejects a redirect chain that terminates at a private address', async () => {
    // Mock fetch where initial request redirects to a private IP
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://innocent-store.com/') {
        return new Response(null, {
          status: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data/' }
        });
      }
      return new Response('ok', { status: 200 });
    });

    const mockLookup = vi.fn().mockImplementation(async (hostname: string) => {
      if (hostname === 'innocent-store.com') {
        return [{ address: '93.184.215.14', family: 4 }];
      }
      return [{ address: '169.254.169.254', family: 4 }];
    });

    await expect(
      safeFetch('https://innocent-store.com/', {
        customFetch: mockFetch,
        customLookup: mockLookup
      })
    ).rejects.toThrow(/SSRF|blocked|private/i);
  });

  it('blocks IPv4-mapped IPv6 address pointing to private space', () => {
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedIp('::ffff:10.0.0.1')).toBe(true);
    expect(isBlockedIp('::ffff:192.168.1.1')).toBe(true);
    expect(isBlockedIp('::ffff:8.8.8.8')).toBe(false);
  });
});
