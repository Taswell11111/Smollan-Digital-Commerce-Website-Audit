export interface Finding {
  id: string;
  title: string;
  category: string;
  affectedUrl: string;
  observedEvidence: string;
  businessImpact: string;
  severity: 'Essential' | 'Recommended' | 'Content & Settings';
  confidence: 'High' | 'Medium' | 'Low';
  effort: 'low' | 'medium' | 'high';
  proposedRemedy: string;
  serviceLine: string;
  source: 'measured' | 'ai';
}

export interface CategoryCheck {
  id?: string;
  name: string;
  status: 'pass' | 'partial' | 'fail' | 'not_assessed';
  evidence: string;
  recoverablePoints?: number;
  potentialFix?: string;
}

export interface CategoryResult {
  score: number;
  enhancedScore: number;
  status: string;
  checks: CategoryCheck[];
}

export interface InspectedPage {
  url: string;
  pageType: string;
  jsonLdTypes?: string[];
  status: number;
  loadTimeMs: number;
  ttfbMs?: number;
  downloadTimeMs?: number;
  title: string;
  description: string;
  h1s: string[];
  h2s: string[];
  linksCount: number;
  navLinksCount?: number;
  imagesCount: number;
  missingAltCount: number;
  buttons: string[];
  hasPrice: boolean;
  hasStock?: boolean;
  hasAddToCart?: boolean;
  evidenceSources?: string[];
  hasSizeGuide: boolean;
  hasCanonical: boolean;
  hasMetaViewport: boolean;
  screenshotUrl?: string;
  fallbackScreenshotUrl?: string;
}

export interface IndustryBenchmark {
  industryAverage: number;
  topTierStandard: number;
  categoryBenchmarks: Record<string, {
    benchmark: number;
    delta: number;
    status: 'Lagging' | 'On Par' | 'Outperforming';
    source?: string;
    sourceDate?: string;
    notes?: string;
  }>;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  url: string;
  businessName: string;
  businessCategory: string;
  targetMarket: string;
  primaryObjective: string;
  primaryKeyword?: string;
  depth: 'quick' | 'standard' | 'deep';
  siteType?: 'ecommerce' | 'service';
  schemaVersion?: number;
  rulesetVersion?: string;
  overallScore: number;
  projectedOverallScore: number;
  scoreUplift: number;
  categoryResults: Record<string, CategoryResult>;
  measurements?: Record<string, any>;
  pagesInspected?: InspectedPage[];
  industryBenchmarks?: IndustryBenchmark;
  crawlSummary: {
    discovered: number;
    inspected: number;
    failed: number;
  };
  metrics: {
    sessions: { value: string; status: string };
    pageSpeed: { value: string; status: string };
    performanceScore: { value: string; status: string };
    brokenLinks: { value: string; status: string };
  };
  executiveVerdict: {
    headline: string;
    summaryText: string;
  };
  findings: Finding[];
  summaryCounts: {
    total: number;
    essential: number;
    recommended: number;
    content: number;
  };
  aiNarrativeStatus?: 'generated' | 'unavailable';
  type?: 'prospect' | 'competitor';
  auditError?: string | null;
  evaluationNotice?: {
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    remediationSteps: string[];
    affectedUrl?: string;
  };
  agenticCommerce?: AgenticCommerceAudit;
  runStats?: RunStats;
}

export type AiBotAccess = 'allowed' | 'partially_disallowed' | 'disallowed' | 'unknown';

/** Only values measured on inspected pages or in robots.txt. No scores, market figures or vendor claims. */
export interface AgenticCommerceAudit {
  measured: {
    jsonLd: { typesFound: string[]; requiredTypes: string[]; missingRequiredTypes: string[]; pagesWithJsonLd: number; pagesInspected: number };
    robots: { status: 'fetched' | 'absent' | 'error'; aiBots: Record<string, AiBotAccess> };
    https: boolean;
  };
  notMeasured: string[];
}

export interface RunStats {
  executionTimeMs: number;
  pagesScannedCount: number;
}

export interface LeadRecord {
  id: string;
  auditId: string;
  businessName: string;
  domain: string;
  overallScore: number;
  projectedScore?: number;
  priority: 'High' | 'Medium' | 'Low';
  priorityReason: string;
  status: string;
  topFindings: Finding[];
  recommendedServices: string[];
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  description: string;
}

export interface UrlInspectionResult {
  success: boolean;
  inputUrl: string;
  resolvedUrl: string;
  domain: string;
  pageTitle: string;
  metaDescription: string;
  favicon?: string;
  ogImage?: string;
  screenshotUrl: string;
  fallbackScreenshotUrl?: string;
  httpStatus: number;
  responseTimeMs: number;
  platform: string;
  internalLinksCount?: number;
  availablePagesCount?: number;
  pagesDiscoveredCount?: number;
  sampleDiscoveredUrls?: string[];
  sitemapUrlCount?: number;
  hasSitemap?: boolean;
  isHttps: boolean;
  securityStatus: string;
  error?: string;
}

export type QaFindingCategory =
  | 'Branding and identity'
  | 'Navigation and footer'
  | 'Website content'
  | 'Legal and compliance'
  | 'Promotions and campaigns'
  | 'External links'
  | 'Retailer references'
  | 'Forms and third-party applications'
  | 'SEO and metadata'
  | 'Technical implementation'
  | 'Customer experience'
  | 'Product and shopping experience';

export type QaFindingStatus =
  | 'Confirmed anomaly'
  | 'Potential anomaly'
  | 'Technical observation'
  | 'Requires live verification';

export type QaSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface QaFinding {
  refId: string;
  category: QaFindingCategory;
  subcategory: string;
  pageUrl: string;
  sourceLocation: string;
  anomalyDescription: string;
  supportingEvidence: string;
  whyAnomaly: string;
  customerImpact: string;
  businessImpact: string;
  severity: QaSeverity;
  findingClassification: QaFindingStatus;
  verificationStatus: string;
  recommendedCorrectiveAction: string;
  additionalComments?: string;
  verificationType?: string;
  policyTermsPage?: string;
  legalImplications?: string;
}

export interface QaAuditReport {
  id: string;
  timestamp: string;
  targetUrl: string;
  pagesAnalyzed: number;
  totalFindings: number;
  countsByStatus: {
    confirmed: number;
    potential: number;
    observation: number;
    requiresVerification: number;
  };
  countsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  countsByCategory: Record<string, number>;
  findings: QaFinding[];
  limitations: string[];
}
