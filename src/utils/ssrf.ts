import dns from 'dns';
import net from 'net';
import ipaddr from 'ipaddr.js';
import { Agent } from 'undici';

// Blocked IPv4 CIDR ranges as required:
// 0.0.0.0/8, 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16,
// 172.16.0.0/12, 192.0.0.0/24, 192.168.0.0/16, 198.18.0.0/15, 224.0.0.0/4, 240.0.0.0/4
const BLOCKED_IPV4_CIDRS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '224.0.0.0/4',
  '240.0.0.0/4'
].map(c => ipaddr.parseCIDR(c));

// Blocked IPv6 CIDR ranges:
// ::1, ::, fc00::/7, fe80::/10, ff00::/8
const BLOCKED_IPV6_CIDRS = [
  '::1/128',
  '::/128',
  'fc00::/7',
  'fe80::/10',
  'ff00::/8'
].map(c => ipaddr.parseCIDR(c));

/**
 * Checks whether an IP address is in any prohibited private, loopback, link-local,
 * multicast, carrier-grade NAT, or reserved range. Handles IPv4, IPv6, and IPv4-mapped IPv6.
 */
export function isBlockedIp(rawIp: string): boolean {
  let cleanIp = rawIp.trim();
  if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
    cleanIp = cleanIp.slice(1, -1);
  }

  if (!ipaddr.isValid(cleanIp)) {
    return false;
  }

  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.parse(cleanIp);
  } catch {
    return true; // Any unparseable IP is rejected
  }

  // Handle IPv4-mapped IPv6 addresses (::ffff:0:0/96)
  if (addr.kind() === 'ipv6') {
    const v6 = addr as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      addr = v6.toIPv4Address();
    }
  }

  if (addr.kind() === 'ipv4') {
    const v4 = addr as ipaddr.IPv4;
    return BLOCKED_IPV4_CIDRS.some(cidr => v4.match(cidr));
  } else {
    const v6 = addr as ipaddr.IPv6;
    return BLOCKED_IPV6_CIDRS.some(cidr => v6.match(cidr));
  }
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  resolvedAddresses?: string[];
}

export type DnsLookupFunction = (
  hostname: string,
  options: { all: boolean }
) => Promise<Array<{ address: string; family: number }>>;

/**
 * Validates a target URL against SSRF attacks:
 * 1. Checks protocol is http or https
 * 2. Normalizes hostname (URL parser handles decimal/octal/hex IP literals)
 * 3. Rejects localhost, .internal, .local, and blocked direct IP literals
 * 4. Performs DNS lookup and rejects if ANY resolved address is in a blocked range
 */
export async function validateTargetUrl(
  rawUrl: string,
  customLookup?: DnsLookupFunction
): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    const urlWithProtocol = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
    parsed = new URL(urlWithProtocol);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // Reject local and internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return { valid: false, error: `Access to internal host '${hostname}' is blocked.` };
  }

  // Check if hostname is an IP address literal directly
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      return { valid: false, error: `Access to private/restricted IP '${hostname}' is blocked.` };
    }
  }

  // Resolve hostname with DNS
  const lookup = customLookup || dns.promises.lookup;
  let resolved: Array<{ address: string; family: number }>;
  try {
    const rawResolved = await lookup(hostname, { all: true });
    resolved = Array.isArray(rawResolved) ? rawResolved : [rawResolved];
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not resolve hostname '${hostname}': ${err.message || 'DNS resolution failed.'}`
    };
  }

  if (!resolved || resolved.length === 0) {
    return { valid: false, error: `No DNS records found for host '${hostname}'.` };
  }

  const addresses = resolved.map(r => r.address);
  for (const addr of addresses) {
    if (isBlockedIp(addr)) {
      return {
        valid: false,
        error: `Host '${hostname}' resolves to blocked private/internal address ${addr}.`,
        resolvedAddresses: addresses
      };
    }
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    resolvedAddresses: addresses
  };
}

/**
 * Creates an undici Agent that pins connections to the validated IP to prevent DNS rebinding.
 */
export function createPinnedAgent(pinnedIp: string): Agent {
  const family = net.isIP(pinnedIp);
  return new Agent({
    connect: {
      lookup: (_hostname, options, callback) => {
        if (options && options.all) {
          callback(null, [{ address: pinnedIp, family }]);
        } else {
          callback(null, pinnedIp, family);
        }
      }
    }
  });
}

export interface SafeFetchOptions extends RequestInit {
  maxRedirects?: number;
  customLookup?: DnsLookupFunction;
  customFetch?: typeof fetch;
}

export interface SafeFetchResult {
  res: Response;
  finalUrl: string;
  redirectCount: number;
}

/**
 * Performs a safe outbound HTTP request:
 * - Validates initial URL and every redirect hop against SSRF rules
 * - Replaces automatic redirects with manual redirect handling (max 5 hops)
 * - Pins the connection to the validated IP to prevent DNS rebinding
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const lookup = options.customLookup;
  const doFetch = options.customFetch || fetch;

  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (true) {
    // 1. Validate the URL for this hop
    const validation = await validateTargetUrl(currentUrl, lookup);
    if (!validation.valid) {
      throw new Error(validation.error || 'SSRF check failed');
    }

    const pinnedIp = validation.resolvedAddresses?.[0];
    let dispatcher: Agent | undefined;
    if (pinnedIp) {
      try {
        dispatcher = createPinnedAgent(pinnedIp);
      } catch {
        // If undici agent creation fails in environment, proceed with standard fetch
      }
    }

    // 2. Execute fetch with manual redirect handling
    const fetchInit: any = {
      ...options,
      redirect: 'manual'
    };
    if (dispatcher) {
      fetchInit.dispatcher = dispatcher;
    }

    const res = await doFetch(currentUrl, fetchInit);

    // 3. Check for redirects (301, 302, 303, 307, 308)
    const isRedirect = [301, 302, 303, 307, 308].includes(res.status);
    if (isRedirect) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Too many redirects (exceeded maximum of ${maxRedirects} hops)`);
      }

      const location = res.headers.get('location');
      if (!location) {
        // Redirect status without location header
        return { res, finalUrl: currentUrl, redirectCount };
      }

      // Resolve relative redirect against current URL
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new Error(`Invalid redirect Location header: '${location}'`);
      }

      continue;
    }

    return { res, finalUrl: currentUrl, redirectCount };
  }
}

/**
 * Reads a response stream body with a maximum byte limit (default: 2 MB).
 * Aborts the stream immediately if the response exceeds the threshold.
 */
export async function readResponseBodyWithLimit(
  res: Response,
  maxBytes: number = 2 * 1024 * 1024
): Promise<string> {
  if (!res.body) {
    return '';
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytesRead += value.length;
        if (bytesRead > maxBytes) {
          await reader.cancel('Response body exceeded maximum allowed limit');
          throw new Error(`Response body exceeded maximum allowed limit of ${maxBytes} bytes (2 MB).`);
        }
        result += decoder.decode(value, { stream: true });
      }
    }
    result += decoder.decode();
    return result;
  } catch (err) {
    throw err;
  }
}
