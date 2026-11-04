import * as cheerio from 'cheerio';

/** Schema.org types the audit looks for. Presence is measured on inspected pages only. */
export const REQUIRED_SCHEMA_TYPES = ['Product', 'Offer', 'AggregateRating', 'BreadcrumbList', 'FAQPage'] as const;

/** AI crawler user-agents checked in robots.txt. */
export const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'Google-Extended'] as const;

export type AiBotAccess = 'allowed' | 'partially_disallowed' | 'disallowed' | 'unknown';

/** Collects every @type declared in the page's JSON-LD blocks, including @graph and nested nodes. */
export function extractJsonLdTypes(html: string): string[] {
  const $ = cheerio.load(html);
  const types = new Set<string>();
  const visit = (node: unknown, depth: number) => {
    if (depth > 25 || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(child => visit(child, depth + 1));
      return;
    }
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') types.add(t);
    if (Array.isArray(t)) t.forEach(x => typeof x === 'string' && types.add(x));
    for (const value of Object.values(obj)) visit(value, depth + 1);
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      visit(JSON.parse(raw), 0);
    } catch {
      // Malformed JSON-LD is ignored; it is not counted as present.
    }
  });
  return Array.from(types).sort();
}

interface RobotsGroup {
  agents: string[];
  disallow: string[];
}

function parseRobotsGroups(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      // Consecutive user-agent lines share one group.
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && key === 'disallow' && value) current.disallow.push(value);
    }
  }
  return groups;
}

/**
 * Evaluates AI crawler access from robots.txt text. `text` is null when robots.txt
 * could not be fetched, in which case every bot is 'unknown' rather than assumed open.
 * A bot's own group takes precedence over the '*' group, per the Robots Exclusion Protocol.
 */
export function evaluateAiBotAccess(text: string | null, bots: readonly string[] = AI_BOTS): Record<string, AiBotAccess> {
  const result: Record<string, AiBotAccess> = {};
  const groups = text === null ? [] : parseRobotsGroups(text);
  for (const bot of bots) {
    if (text === null) {
      result[bot] = 'unknown';
      continue;
    }
    const own = groups.find(g => g.agents.includes(bot.toLowerCase()));
    const wildcard = groups.find(g => g.agents.includes('*'));
    const group = own ?? wildcard;
    if (!group) {
      result[bot] = 'allowed';
    } else if (group.disallow.includes('/')) {
      result[bot] = 'disallowed';
    } else if (group.disallow.length > 0) {
      result[bot] = 'partially_disallowed';
    } else {
      result[bot] = 'allowed';
    }
  }
  return result;
}

interface RobotsRule {
  allow: boolean;
  pattern: string;
}

function parseRobotsRules(text: string): Array<{ agents: string[]; rules: RobotsRule[] }> {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (current && (key === 'allow' || key === 'disallow')) {
      // An empty Disallow means "allow everything" and is recorded as no rule.
      if (value === '') continue;
      current.rules.push({ allow: key === 'allow', pattern: value });
    }
  }
  return groups;
}

/** Robots pattern to regex: '*' matches any run of characters, a trailing '$' anchors the end. */
function robotsPatternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = new RegExp('^' + body.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''));
  return re.test(path);
}

/**
 * Whether `path` may be crawled by `agent`. Uses the agent's own group when one exists, else '*'.
 * The longest matching rule wins; on a tie, Allow wins. `text` null means no robots.txt applies.
 */
export function isPathAllowed(text: string | null, agent: string, path: string): boolean {
  if (text === null) return true;
  const groups = parseRobotsRules(text);
  const token = agent.toLowerCase();
  const group = groups.find(g => g.agents.includes(token)) ?? groups.find(g => g.agents.includes('*'));
  if (!group) return true;
  let best: RobotsRule | null = null;
  for (const rule of group.rules) {
    if (!robotsPatternMatches(rule.pattern, path)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}
