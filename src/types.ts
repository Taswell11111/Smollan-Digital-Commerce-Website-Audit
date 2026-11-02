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
  depth: 'quick' | 'standard' | 'deep';
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
  executionCost?: AuditExecutionCost;
}

export interface AgenticCommerceAudit {
  agenticScore: number; // 0 - 100
  readinessTier: 'Emerging' | 'Developing' | 'Agentic-Ready' | 'Autonomous Leader';
  fourLayerArchitecture: {
    layer1MasterData: { score: number; status: 'pass' | 'partial' | 'fail'; gtinCoverage: string; mpnPresent: boolean; details: string };
    layer2DynamicData: { score: number; status: 'pass' | 'partial' | 'fail'; syncLatency: string; ucpCompliant: boolean; details: string };
    layer3SemanticData: { score: number; status: 'pass' | 'partial' | 'fail'; outcomeFocus: boolean; contextScore: number; details: string };
    layer4TrustData: { score: number; status: 'pass' | 'partial' | 'fail'; esgMetadata: boolean; complianceDeclared: boolean; details: string };
  };
  technicalCheckpoints: {
    schemaOrgCoverage: { score: number; schemasFound: string[]; missingSchemas: string[]; details: string };
    aiCrawlerAccess: { score: number; unblockedBots: string[]; blockedBots: string[]; robotsTxtStatus: string };
    platformFeedsAndMcp: { mcpReady: boolean; feedsConfigured: string[]; details: string };
    paymentPrimitives: { sptReady: boolean; protocolSupport: string[]; kyaSecurityStatus: string };
  };
  shareOfModelEstimate: {
    projectedCitationRank: string;
    projectedConversionLift: string;
    projectedMarketValueShare: string;
  };
  ninetyDayRoadmap: {
    phase1Days1to30: { title: string; focus: string; deliverables: string[] };
    phase2Days31to60: { title: string; focus: string; deliverables: string[] };
    phase3Days61to90: { title: string; focus: string; deliverables: string[] };
  };
}

export interface AuditExecutionCost {
  totalEstimatedCostZar: number;
  totalEstimatedCostUsd: number;
  executionTimeMs: number;
  crawlerBandwidthBytes: number;
  pagesScannedCount: number;
  geminiInferenceTokens?: {
    promptTokens: number;
    completionTokens: number;
    modelName: string;
    tokenCostUsd: number;
  };
  computeResourceCostUsd: number;
  commercialAuditBenchmarkZar: number;
  costSavingsPercent: number;
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
  sampleDiscoveredUrls?: string[];
  sitemapUrlCount?: number;
  hasSitemap?: boolean;
  isHttps: boolean;
  securityStatus: string;
  error?: string;
}
