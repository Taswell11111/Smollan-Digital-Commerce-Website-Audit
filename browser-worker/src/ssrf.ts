import dns from 'dns';
import net from 'net';
import ipaddr from 'ipaddr.js';

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

const BLOCKED_IPV6_CIDRS = [
  '::1/128',
  '::/128',
  '::/96', // IPv4-compatible (deprecated); blocks e.g. ::127.0.0.1
  'fc00::/7',
  'fe80::/10',
  'ff00::/8',
  '64:ff9b::/96',
  '64:ff9b:1::/48',
  '2002::/16'
].map(c => ipaddr.parseCIDR(c));

export function isBlockedIp(rawIp: string): boolean {
  let cleanIp = rawIp.trim();
  if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
    cleanIp = cleanIp.slice(1, -1);
  }

  if (!ipaddr.isValid(cleanIp)) {
    return true;
  }

  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.parse(cleanIp);
  } catch {
    return true;
  }

  if (addr.kind() === 'ipv4') {
    const v4 = addr as ipaddr.IPv4;
    return BLOCKED_IPV4_CIDRS.some(cidr => v4.match(cidr));
  } else {
    const v6 = addr as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      const mappedV4 = v6.toIPv4Address();
      return BLOCKED_IPV4_CIDRS.some(cidr => mappedV4.match(cidr));
    }

    const parts = v6.parts;
    // Check NAT64 (64:ff9b::/96)
    if (parts[0] === 0x0064 && parts[1] === 0xff9b && parts[2] === 0 && parts[3] === 0 && parts[4] === 0 && parts[5] === 0) {
      const p6 = parts[6];
      const p7 = parts[7];
      const embeddedV4 = `${(p6 >> 8) & 0xff}.${p6 & 0xff}.${(p7 >> 8) & 0xff}.${p7 & 0xff}`;
      if (ipaddr.isValid(embeddedV4)) {
        const v4Obj = ipaddr.parse(embeddedV4) as ipaddr.IPv4;
        if (BLOCKED_IPV4_CIDRS.some(cidr => v4Obj.match(cidr))) {
          return true;
        }
      }
    }

    // Check 6to4 (2002::/16)
    if (parts[0] === 0x2002) {
      const p1 = parts[1];
      const p2 = parts[2];
      const embeddedV4 = `${(p1 >> 8) & 0xff}.${p1 & 0xff}.${(p2 >> 8) & 0xff}.${p2 & 0xff}`;
      if (ipaddr.isValid(embeddedV4)) {
        const v4Obj = ipaddr.parse(embeddedV4) as ipaddr.IPv4;
        if (BLOCKED_IPV4_CIDRS.some(cidr => v4Obj.match(cidr))) {
          return true;
        }
      }
    }

    return BLOCKED_IPV6_CIDRS.some(cidr => v6.match(cidr));
  }
}

export async function validateHostname(hostname: string): Promise<boolean> {
  if (!hostname || typeof hostname !== 'string') return false;
  let clean = hostname.trim().toLowerCase();
  if (clean.startsWith('[') && clean.endsWith(']')) {
    clean = clean.slice(1, -1);
  }

  if (clean === 'localhost' || clean.endsWith('.localhost') || clean.endsWith('.internal') || clean.endsWith('.local')) {
    return false;
  }

  if (ipaddr.isValid(clean)) {
    return !isBlockedIp(clean);
  }

  try {
    const resolved = await dns.promises.lookup(clean, { all: true });
    for (const r of resolved) {
      if (isBlockedIp(r.address)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
