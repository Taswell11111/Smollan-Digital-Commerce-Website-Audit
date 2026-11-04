import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export const SESSION_COOKIE = 'smollan_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** In-memory sessions. A restart logs everyone out, which is acceptable for an internal tool. */
export class SessionStore {
  private readonly sessions = new Map<string, number>();

  create(now = Date.now()): string {
    const id = crypto.randomBytes(32).toString('base64url');
    this.sessions.set(id, now + SESSION_TTL_MS);
    return id;
  }

  isValid(id: string | undefined, now = Date.now()): boolean {
    if (!id) return false;
    const expires = this.sessions.get(id);
    if (expires === undefined) return false;
    if (now > expires) {
      this.sessions.delete(id);
      return false;
    }
    return true;
  }

  revoke(id: string | undefined): void {
    if (id) this.sessions.delete(id);
  }

  get size(): number {
    return this.sessions.size;
  }
}

/** Constant-time comparison. Length mismatch is rejected without leaking the expected length. */
export function tokenMatches(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || !expected) return false;
  const p = provided.trim().replace(/^["']|["']$/g, '');
  const e = expected.trim().replace(/^["']|["']$/g, '');
  if (p.length === 0 || e.length === 0) return false;
  const a = Buffer.from(p);
  const b = Buffer.from(e);
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b); // keep timing roughly constant
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

/**
 * Production must not run with an open API. Returns an error message when the configuration is unsafe,
 * or null when it is acceptable.
 */
export function productionAuthConfigError(env: NodeJS.ProcessEnv): string | null {
  if (env.NODE_ENV === 'production' && !env.API_TOKEN) {
    return 'API_TOKEN is required when NODE_ENV=production. Refusing to start with an unauthenticated API.';
  }
  return null;
}

export function createAuthGuard(opts: { token: string | undefined; sessions: SessionStore }) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Login and logout are handled by their own routes, which check credentials themselves.
    if (req.path === '/session' || req.path === '/logout') return next();
    if (!opts.token) return next(); // only when API_TOKEN is unset; production refuses to start in that case
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ') && tokenMatches(header.slice(7), opts.token)) return next();
    if (opts.sessions.isValid(readCookie(req.headers.cookie, SESSION_COOKIE))) return next();
    res.status(401).json({ error: 'Authentication required.' });
  };
}
