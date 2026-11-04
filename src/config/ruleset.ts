export const RULESET_VERSION = '2.0.0';
export const SCHEMA_VERSION = 5;

export interface AuditCheckDefinition {
  id: string;
  category: string;
  name: string;
  description: string;
  howMeasured: string;
  passThreshold: string;
  partialThreshold?: string;
  failThreshold: string;
  benchmarkKey: string;
  potentialFix: string;
  tier: 'measured' | 'rendered' | 'heuristic' | 'manual';
  sourceStatus: 'sourced' | 'corpus' | 'none';
  core: boolean;
  isScored: boolean;
}

export interface AuditCategoryDefinition {
  id: string;
  name: string;
  weight: number; // Sum across all scored categories must equal exactly 100
  rationale: string;
  checks: AuditCheckDefinition[];
}

export const CATEGORY_RULESET: AuditCategoryDefinition[] = [
  {
    id: 'cat-performance',
    name: 'Performance',
    weight: 12,
    rationale: 'Evaluates Core Web Vitals (LCP, INP/TBT, CLS) from lab and field measurements.',
    checks: [
      {
        id: 'CHK-PERF-LCP',
        category: 'Performance',
        name: 'Largest Contentful Paint (LCP)',
        description: 'Render time of the main page content element',
        howMeasured: 'Measured via PageSpeed Insights / lab rendering or CrUX field data.',
        passThreshold: 'Good ≤ 2500ms',
        partialThreshold: 'Needs Improvement 2500ms - 4000ms',
        failThreshold: 'Poor > 4000ms',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Optimize server response time, defer non-critical CSS/JS, and compress hero imagery.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-PERF-INP',
        category: 'Performance',
        name: 'Interaction Responsiveness (Lab TBT Proxy)',
        description: 'Responsiveness to user interactions during load (measured via Total Blocking Time lab proxy)',
        howMeasured: 'Measured via Total Blocking Time (TBT) lab proxy or browser worker main-thread blocking time.',
        passThreshold: 'Good ≤ 200ms',
        partialThreshold: 'Needs Improvement 200ms - 500ms',
        failThreshold: 'Poor > 500ms',
        benchmarkKey: 'web-dev-inp',
        potentialFix: 'Minimize long main-thread JavaScript execution tasks and break up heavy rendering scripts.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-PERF-CLS',
        category: 'Performance',
        name: 'Cumulative Layout Shift (CLS)',
        description: 'Visual stability and unexpected layout shifts during load',
        howMeasured: 'Measured via layout shift score during DOM rendering.',
        passThreshold: 'Good ≤ 0.1',
        partialThreshold: 'Needs Improvement 0.1 - 0.25',
        failThreshold: 'Poor > 0.25',
        benchmarkKey: 'web-dev-cls',
        potentialFix: 'Explicitly define width and height attributes on images and dynamic ad embeds.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-product',
    name: 'Product Page',
    weight: 12,
    rationale: 'Evaluates product page merchandising, availability, sizing, and media coverage.',
    checks: [
      {
        id: 'CHK-PROD-PRICE',
        category: 'Product Page',
        name: 'Visible Currency Pricing',
        description: 'Visible price formatted with currency symbol in clean page text',
        howMeasured: 'Regex check on visible text on product pages.',
        passThreshold: 'Formatted price found on all product pages',
        failThreshold: 'No visible prices found on product pages',
        benchmarkKey: 'baymard-product',
        potentialFix: 'Render clean, crawlable server-side pricing with standard currency symbols.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-PROD-STOCK',
        category: 'Product Page',
        name: 'Stock / Availability Message',
        description: 'Clear in-stock or availability indicator',
        howMeasured: 'Detects availability or stock terminology in product DOM.',
        passThreshold: 'Stock status message visible',
        failThreshold: 'No stock message found',
        benchmarkKey: 'baymard-product',
        potentialFix: 'Display explicit inventory status (e.g. In Stock, Only 3 left) on product pages.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-PROD-ATCVIEW',
        category: 'Product Page',
        name: 'Add-to-Cart Above the Fold',
        description: 'Add-to-cart button present in initial mobile viewport',
        howMeasured: 'Detects buy button positioning in rendered DOM.',
        passThreshold: 'Add-to-cart button visible above fold',
        failThreshold: 'Add-to-cart requires scrolling past fold',
        benchmarkKey: 'baymard-product',
        potentialFix: 'Ensure primary CTA button is immediately visible without excessive scrolling.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-PROD-ALT',
        category: 'Product Page',
        name: 'Image Alt-Text Coverage',
        description: 'Descriptive alt attribute presence across product imagery',
        howMeasured: 'Ratio of <img> tags containing alt text on product pages.',
        passThreshold: '≥ 90% alt text coverage',
        failThreshold: '< 60% alt text coverage',
        benchmarkKey: 'wcag-2.2-aa',
        potentialFix: 'Add descriptive alt attributes to all product and category images.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-checkout',
    name: 'Cart and Checkout Path',
    weight: 12,
    rationale: 'Evaluates cart reachability, shipping transparency, and guest checkout options.',
    checks: [
      {
        id: 'CHK-CHK-REACH',
        category: 'Cart and Checkout Path',
        name: 'Cart Reachability',
        description: 'Cart or checkout reachable in ≤ 2 interactions',
        howMeasured: 'Crawl traversal analysis from homepage.',
        passThreshold: 'Cart reached in ≤ 2 clicks',
        failThreshold: 'Cart path not found or > 2 clicks',
        benchmarkKey: 'baymard-checkout',
        potentialFix: 'Provide persistent cart access in global header.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-CHK-SHIPPING',
        category: 'Cart and Checkout Path',
        name: 'Shipping Cost / Threshold Visible',
        description: 'Clear shipping cost or free shipping threshold before checkout',
        howMeasured: 'Detects delivery terms or free shipping threshold messaging.',
        passThreshold: 'Shipping terms visible before checkout',
        failThreshold: 'Shipping terms hidden until final step',
        benchmarkKey: 'baymard-checkout',
        potentialFix: 'Display delivery costs and free shipping thresholds on product and cart pages.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-CHK-GUEST',
        category: 'Cart and Checkout Path',
        name: 'Guest Checkout Option',
        description: 'Option to complete purchase without forced account creation',
        howMeasured: 'Detects guest checkout messaging or button in cart/checkout.',
        passThreshold: 'Guest checkout available',
        failThreshold: 'Forced account registration required',
        benchmarkKey: 'baymard-checkout',
        potentialFix: 'Enable streamlined guest checkout to reduce cart abandonment.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-accessibility',
    name: 'Accessibility',
    weight: 10,
    rationale: 'Evaluates WCAG 2.2 AA compliance and critical/serious violation absence.',
    checks: [
      {
        id: 'CHK-A11Y-WCAG',
        category: 'Accessibility',
        name: 'Image Alt-Text & DOM Accessibility Hygiene',
        description: 'Absence of critical accessibility barriers (missing alt tags, viewport traps, unlabelled controls)',
        howMeasured: 'Automated DOM inspection of missing alt attributes, meta viewport configuration, and interactive elements.',
        passThreshold: 'Zero critical or serious DOM accessibility barriers',
        failThreshold: 'Critical DOM accessibility barriers detected',
        benchmarkKey: 'wcag-2.2-aa',
        potentialFix: 'Remediate missing image alt attributes, contrast ratios, and ARIA landmarks.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-trust',
    name: 'Trust and Policy',
    weight: 10,
    rationale: 'Evaluates privacy policy, returns, contact details, and customer reviews.',
    checks: [
      {
        id: 'CHK-TRST-PRIVACY',
        category: 'Trust and Policy',
        name: 'Privacy Policy Link',
        description: 'Accessible privacy policy or POPIA compliance link in footer or homepage',
        howMeasured: 'Footer and homepage anchor link scan.',
        passThreshold: 'Privacy policy link found',
        failThreshold: 'No privacy policy link detected',
        benchmarkKey: 'baymard-checkout',
        potentialFix: 'Add a clear link to the privacy policy in the global footer.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-TRST-REVIEWS',
        category: 'Trust and Policy',
        name: 'Customer Reviews Present',
        description: 'Active review or rating widgets',
        howMeasured: 'DOM selector scan for review widgets and rating scripts.',
        passThreshold: '≥ 1 review widget detected',
        failThreshold: '0 review widgets detected',
        benchmarkKey: 'baymard-product',
        potentialFix: 'Integrate customer feedback and star rating widgets.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-search',
    name: 'Search and Discovery',
    weight: 10,
    rationale: 'Evaluates site search, collection filters, and product breadcrumbs.',
    checks: [
      {
        id: 'CHK-SRCH-SEARCH',
        category: 'Search and Discovery',
        name: 'Site Search Present',
        description: 'Accessible search input or modal in global header',
        howMeasured: 'Detects <input type="search"> or search form in header.',
        passThreshold: 'Site search input found',
        failThreshold: 'No site search input detected',
        benchmarkKey: 'baymard-product',
        potentialFix: 'Implement a prominent autocomplete search bar in the site header.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-SRCH-BREAD',
        category: 'Search and Discovery',
        name: 'Product Breadcrumbs',
        description: 'Hierarchical navigation breadcrumbs on product pages',
        howMeasured: 'Detects breadcrumb markup or navigation links on product pages.',
        passThreshold: 'Breadcrumbs present on product pages',
        failThreshold: 'No breadcrumb navigation found',
        benchmarkKey: 'web-dev-cls',
        potentialFix: 'Add structured breadcrumb navigation to all product templates.',
        tier: 'rendered',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-mobile',
    name: 'Mobile',
    weight: 10,
    rationale: 'Evaluates viewport configuration, responsive overflow, and tap target sizing.',
    checks: [
      {
        id: 'CHK-MOB-VIEWPORT',
        category: 'Mobile',
        name: 'Responsive Viewport Meta Tag',
        description: 'Responsive viewport meta tag presence',
        howMeasured: 'Checks presence of <meta name="viewport"> on every inspected page.',
        passThreshold: 'Viewport meta tag present',
        failThreshold: 'Missing viewport meta tag',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-MOB-TAP',
        category: 'Mobile',
        name: 'Tap Target Sizing',
        description: 'Interactive elements sized ≥ 24×24 CSS pixels',
        howMeasured: 'Heuristic evaluation of button and link padding.',
        passThreshold: 'Adequate tap target sizing',
        failThreshold: 'Sub-minimum tap target dimensions',
        benchmarkKey: 'web-dev-inp',
        potentialFix: 'Increase padding on clickable buttons and touch targets to at least 24x24px.',
        tier: 'heuristic',
        sourceStatus: 'sourced',
        core: false,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-tech',
    name: 'Technical Resilience and Security',
    weight: 12,
    rationale: 'Evaluates HTTPS enforcement, valid TLS, broken link rate, HSTS, and CSP headers.',
    checks: [
      {
        id: 'CHK-TECH-HTTPS',
        category: 'Technical Resilience and Security',
        name: 'HTTPS & TLS Security',
        description: 'Secure final URL protocol, valid certificate, and HTTP redirect',
        howMeasured: 'Network handshake verification.',
        passThreshold: 'HTTPS final URL + valid TLS + HTTP redirect',
        failThreshold: 'Insecure HTTP or invalid certificate',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Enforce SSL/TLS certificate with 301 redirects from HTTP to HTTPS.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-TECH-ERRORS',
        category: 'Technical Resilience and Security',
        name: 'Crawl Error Rate',
        description: 'Absence of broken pages or 4xx/5xx HTTP errors',
        howMeasured: 'Failed pages count divided by discovered pages.',
        passThreshold: '0 failed pages',
        failThreshold: 'Failed page rate > 10%',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Resolve broken internal links and 404/500 errors.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  },
  {
    id: 'cat-seo',
    name: 'SEO',
    weight: 12,
    rationale: 'Evaluates unique metadata, canonical tags, sitemap, robots.txt, and Product JSON-LD.',
    checks: [
      {
        id: 'CHK-SEO-CANONICAL',
        category: 'SEO',
        name: 'Canonical URL Tags',
        description: 'Presence of self-referencing or preferred canonical link tags',
        howMeasured: 'Ratio of inspected pages with <link rel="canonical">.',
        passThreshold: '≥ 90% canonical coverage',
        failThreshold: '< 50% canonical coverage',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Inject dynamic <link rel="canonical"> tags into page heads.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      },
      {
        id: 'CHK-SEO-METAS',
        category: 'SEO',
        name: 'Title & Meta Description',
        description: 'Presence of title and meta description on each page',
        howMeasured: 'Ratio of pages with non-empty title and description.',
        passThreshold: '100% metadata completeness',
        failThreshold: '< 60% metadata completeness',
        benchmarkKey: 'web-dev-lcp',
        potentialFix: 'Ensure every template generates descriptive titles and meta descriptions.',
        tier: 'measured',
        sourceStatus: 'sourced',
        core: true,
        isScored: true
      }
    ]
  }
];

export const CATEGORY_WEIGHTS: Record<string, number> = Object.fromEntries(
  CATEGORY_RULESET.map(c => [c.name, c.weight])
);

export function getTotalWeight(): number {
  return CATEGORY_RULESET.reduce((sum, c) => sum + c.weight, 0);
}

export const CORE_CHECK_IDS: string[] = CATEGORY_RULESET.flatMap(c =>
  c.checks.filter(chk => chk.core).map(chk => chk.id)
);
