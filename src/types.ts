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
}

export interface CategoryCheck {
  name: string;
  status: 'pass' | 'partial' | 'fail' | 'not_assessed';
  evidence: string;
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
  status: number;
  loadTimeMs: number;
  title: string;
  description: string;
  h1s: string[];
  h2s: string[];
  linksCount: number;
  imagesCount: number;
  missingAltCount: number;
  buttons: string[];
  hasPrice: boolean;
  hasSizeGuide: boolean;
  hasCanonical: boolean;
  hasMetaViewport: boolean;
}

export interface IndustryBenchmark {
  industryAverage: number;
  topTierStandard: number;
  categoryBenchmarks: Record<string, {
    benchmark: number;
    delta: number;
    status: 'Lagging' | 'On Par' | 'Outperforming';
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
  depth: 'quick' | 'standard' | 'deep';
  overallScore: number;
  projectedOverallScore: number;
  scoreUplift: number;
  categoryResults: Record<string, CategoryResult>;
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
  hasSitemap?: boolean;
  isHttps: boolean;
  securityStatus: string;
  error?: string;
}
