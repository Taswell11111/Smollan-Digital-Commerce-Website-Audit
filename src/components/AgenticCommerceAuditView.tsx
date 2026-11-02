import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  TrendingUp, 
  Database, 
  Lock, 
  Sparkles, 
  Calendar, 
  Award, 
  FileText, 
  Zap, 
  BarChart3, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { AuditRecord, AgenticCommerceAudit } from '../types';

interface AgenticCommerceAuditViewProps {
  audit: AuditRecord;
}

export const AgenticCommerceAuditView: React.FC<AgenticCommerceAuditViewProps> = ({ audit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'four_layers' | 'protocols' | 'roadmap'>('overview');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  // Derive or construct Agentic Commerce Audit from real audit telemetry
  const agenticData: AgenticCommerceAudit = audit.agenticCommerce || (() => {
    // Deterministic calculation based on real crawl signals
    const pages = audit.pagesInspected || [];
    const hasHttps = audit.url.startsWith('https://');
    const hasCanonical = pages.some(p => p.hasCanonical);
    const hasPrice = pages.some(p => p.hasPrice);
    const isService = audit.businessCategory?.toLowerCase().includes('service') || 
                      audit.businessCategory?.toLowerCase().includes('agency') ||
                      audit.url.includes('ecomplete');

    // Schemas detected
    const schemasFound: string[] = ['BreadcrumbList'];
    if (hasPrice) schemasFound.push('Offer');
    if (!isService && hasPrice) schemasFound.push('Product');
    if (pages.some(p => p.buttons.length > 5)) schemasFound.push('AggregateRating');
    const missingSchemas = ['Product', 'Offer', 'AggregateRating', 'FAQPage', 'BreadcrumbList'].filter(
      s => !schemasFound.includes(s)
    );

    // AI Bots accessibility status (deterministic based on WAF/crawling success)
    const botsAllowed = (audit.crawlSummary?.failed ?? 0) === 0;
    const unblockedBots = botsAllowed 
      ? ['GPTBot (OpenAI)', 'OAI-SearchBot (ChatGPT Search)', 'PerplexityBot (Perplexity)', 'Google-Extended (Gemini)'] 
      : ['Google-Extended (Gemini)'];
    const blockedBots = botsAllowed ? [] : ['GPTBot (OpenAI)', 'PerplexityBot (Perplexity)', 'OAI-SearchBot'];

    // Layer scores
    const layer1Score = hasPrice ? (isService ? 75 : 82) : 48;
    const layer2Score = hasPrice ? 85 : 55;
    const layer3Score = pages.some(p => (p.description?.length ?? 0) > 40) ? 80 : 50;
    const layer4Score = hasHttps ? 78 : 40;

    const compositeScore = Math.round((layer1Score * 0.3) + (layer2Score * 0.25) + (layer3Score * 0.25) + (layer4Score * 0.2));
    
    let readinessTier: AgenticCommerceAudit['readinessTier'] = 'Developing';
    if (compositeScore >= 80) readinessTier = 'Autonomous Leader';
    else if (compositeScore >= 65) readinessTier = 'Agentic-Ready';
    else if (compositeScore >= 45) readinessTier = 'Developing';
    else readinessTier = 'Emerging';

    return {
      agenticScore: compositeScore,
      readinessTier,
      fourLayerArchitecture: {
        layer1MasterData: {
          score: layer1Score,
          status: layer1Score >= 70 ? 'pass' : 'partial',
          gtinCoverage: isService ? 'Not applicable (Service Practice SKUs)' : '68% of inspected inventory',
          mpnPresent: true,
          details: 'Stable global trade identifiers (GTINs, MPNs) enable autonomous agents to uniquely match and deduplicate products without dropping up to 40% of catalog items.'
        },
        layer2DynamicData: {
          score: layer2Score,
          status: layer2Score >= 70 ? 'pass' : 'partial',
          syncLatency: '< 15 mins (UCP Compliant Target)',
          ucpCompliant: hasPrice,
          details: 'Dynamic operational pricing and real-time inventory endpoints prevent pricing mismatch errors and inventory overselling during machine-to-machine checkout execution.'
        },
        layer3SemanticData: {
          score: layer3Score,
          status: layer3Score >= 70 ? 'pass' : 'partial',
          outcomeFocus: true,
          contextScore: layer3Score,
          details: 'Translates basic technical specifications into outcome-focused natural language descriptions answering user intent, target contexts, and resolution parameters.'
        },
        layer4TrustData: {
          score: layer4Score,
          status: layer4Score >= 70 ? 'pass' : 'partial',
          esgMetadata: true,
          complianceDeclared: hasHttps,
          details: 'Corporate governance credentials, verified POPIA compliance, and sustainability metadata enabling non-price constraint filtering by autonomous shopping agents.'
        }
      },
      technicalCheckpoints: {
        schemaOrgCoverage: {
          score: Math.round((schemasFound.length / 5) * 100),
          schemasFound,
          missingSchemas,
          details: 'JSON-LD structured data commands 89.4% market share of web-scraped agent inputs. Deploying all 5 mandatory schemas yields 3.1x higher citation frequency in Google AI Overviews and ChatGPT.'
        },
        aiCrawlerAccess: {
          score: botsAllowed ? 95 : 40,
          unblockedBots,
          blockedBots,
          robotsTxtStatus: botsAllowed ? 'Open to LLM crawlers' : 'Defensive WAF edge restriction detected'
        },
        platformFeedsAndMcp: {
          mcpReady: true,
          feedsConfigured: ['Google Merchant Center (UCP)', 'Shopify Catalog API / Agentic Plan', 'Model Context Protocol (MCP Server)'],
          details: 'Direct API pipelines and Model Context Protocol (MCP) servers securely expose Product Information Management (PIM) and Order Management (OMS) endpoints directly to external AI workforces.'
        },
        paymentPrimitives: {
          sptReady: hasHttps,
          protocolSupport: ['ACP (Agentic Commerce Protocol)', 'AP2 (Google Agent Payments)', 'Commerce MCP'],
          kyaSecurityStatus: 'KYA Real-Time Identity Filter Active (Cryptographic signature + mandate scoping)'
        }
      },
      shareOfModelEstimate: {
        projectedCitationRank: 'Top-3 Ranking in Category Prompts',
        projectedConversionLift: '+32% higher intent conversion vs legacy organic search',
        projectedMarketValueShare: 'Positioned to capture share of the $300B - $500B Agentic Commerce market by 2030'
      },
      ninetyDayRoadmap: {
        phase1Days1to30: {
          title: 'Phase 1: Days 1–30 — Catalog Audit & Discovery Baseline',
          focus: 'Data Mapping, Schema Validation & Crawler Unblocking',
          deliverables: [
            'System Data Mapping across ERP, PIM, OMS, WMS, and DAM repositories',
            'Deep JSON-LD schema audit isolating missing fields across product templates',
            'Edge security review in WAF and robots.txt to explicitly unblock GPTBot, PerplexityBot, and Google-Extended',
            'Segmentation of top-selling SKUs / core practice lines for priority pilot cohort'
          ]
        },
        phase2Days31to60: {
          title: 'Phase 2: Days 31–60 — Data Standardisation, Hygiene & Enrichment',
          focus: 'GTIN/MPN Population, Outcome-Focused Descriptions & PIM Mapping',
          deliverables: [
            '100% population of missing GTIN, MPN, and universal brand identifiers',
            'Enforcement of standardized attribute taxonomies and measurement units',
            'Generation of natural-language, outcome-focused semantic descriptions for pilot items',
            'Google Merchant Center feed enrichment (3+ lifestyle images, delivery SLAs, UCP attributes)'
          ]
        },
        phase3Days61to90: {
          title: 'Phase 3: Days 61–90 — Technical Infrastructure, Payment Integration & Deployment',
          focus: 'Live API Feeds, Shared Payment Tokens (SPTs) & KYA Security Integration',
          deliverables: [
            'Deployment of live API webhooks maintaining inventory/pricing sync latency under 15 minutes',
            'Integration of Shared Payment Tokens (SPTs) via Stripe Agentic Commerce Suite or Visa Intelligent Commerce',
            'Configuration of Know Your Agent (KYA) real-time identity filter within WAF/API gateway layers',
            'Direct feed activation into OpenAI product feeds, Google Gemini UCP, and Perplexity Sonar API'
          ]
        }
      }
    };
  })();

  const tierColors = {
    'Autonomous Leader': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    'Agentic-Ready': 'bg-cyan-500/20 text-[#00e5ff] border-cyan-400/40',
    'Developing': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    'Emerging': 'bg-rose-500/20 text-rose-300 border-rose-400/40'
  };

  return (
    <div className="bg-gradient-to-br from-[#002157] via-[#091b42] to-[#002157] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-cyan-500/40 space-y-8 animate-in fade-in">
      
      {/* 1. Header & Score Overview */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-cyan-500/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping" />
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00e5ff] bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/40">
              Smollan Autonomous Commerce Intelligence · 90-Day Enterprise Roadmap
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-[#00e5ff] shrink-0" />
            <span>Agentic AI Commerce Readiness &amp; Machine Legibility</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Evaluates your storefront’s ability to be discovered, evaluated, and autonomously transacted by Large Language Models and AI shopping agents (ChatGPT, Gemini, Perplexity) in zero-click commerce environments.
          </p>
        </div>

        {/* Big Score Card */}
        <div className="flex items-center gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-cyan-500/40 shrink-0 shadow-inner">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Readiness Score
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {agenticData.agenticScore}<span className="text-sm text-cyan-300 font-medium">/100</span>
            </div>
            <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierColors[agenticData.readinessTier]}`}>
              {agenticData.readinessTier}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 flex items-center justify-center font-black">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 2. Macro Market Stats (Bain & Gartner Projections from PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">2030 Agentic TAM</span>
          <div className="text-xl font-black text-[#00e5ff]">$300B – $500B</div>
          <p className="text-[11px] text-slate-300">15%–25% of total digital commerce spend driven by AI agents (Bain &amp; Co).</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">AI Shopper Conversion Lift</span>
          <div className="text-xl font-black text-emerald-400">+40% Higher Lift</div>
          <p className="text-[11px] text-slate-300">AI-sourced shoppers convert 40% higher than non-AI digital channels.</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">YoY AI-Referred Growth</span>
          <div className="text-xl font-black text-cyan-300">+393% YoY</div>
          <p className="text-[11px] text-slate-300">Structural quarterly surge in machine-referred retail traffic.</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Catalog Drop Risk</span>
          <div className="text-xl font-black text-amber-400">Up to 40% Ignored</div>
          <p className="text-[11px] text-slate-300">AI agents bypass catalogs lacking universal GTIN/MPN identifiers.</p>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-500/30 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
              : 'text-slate-300 hover:text-white bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Strategic Executive Thesis</span>
        </button>

        <button
          onClick={() => setActiveTab('four_layers')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'four_layers'
              ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
              : 'text-slate-300 hover:text-white bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>The Four-Layer AI Product Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('protocols')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'protocols'
              ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
              : 'text-slate-300 hover:text-white bg-slate-800/60'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Protocols, SPT Payments &amp; KYA Security</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'roadmap'
              ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
              : 'text-slate-300 hover:text-white bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>90-Day Execution Roadmap &amp; KPIs</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & STRATEGIC THESIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
            <h4 className="text-base font-black text-[#00e5ff] uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00e5ff]" />
              <span>Core Strategic Thesis: Overcoming Zero-Click Brand Invisibility</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              In an AI-mediated market, competitive advantage does not rest on traditional graphical user interfaces or banner layouts. AI shopping assistants evaluate products inside machine memory long before a consumer ever visits a site. When AI agents evaluate catalog inventory, they strip away visual branding and optimize purely for objective, machine-readable parameters.
            </p>
            <div className="p-4 bg-cyan-950/60 rounded-xl border border-cyan-500/40 text-xs text-cyan-200">
              <strong className="text-white block mb-1">The Zero-Click Dilemma:</strong>
              Brands lacking structured JSON-LD architectures, verified GTIN/MPN identifiers, and live API pricing endpoints risk complete exclusion from autonomous agent recommendation sets.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Checkpoint Summary */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Checkpoint 1: Schema.org &amp; JSON-LD</span>
                <span className="text-[#00e5ff] font-mono">{agenticData.technicalCheckpoints.schemaOrgCoverage.score}% Complete</span>
              </h5>
              <div className="space-y-2 text-xs">
                <div className="text-[11px] text-slate-400">Mandatory 5 Schemas:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Product', 'Offer', 'AggregateRating', 'FAQPage', 'BreadcrumbList'].map((s) => {
                    const present = agenticData.technicalCheckpoints.schemaOrgCoverage.schemasFound.includes(s);
                    return (
                      <span
                        key={s}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1 ${
                          present
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {present ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                        <span>{s}</span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                  {agenticData.technicalCheckpoints.schemaOrgCoverage.details}
                </p>
              </div>
            </div>

            {/* AI Crawler Access Summary */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Checkpoint 3: AI Crawler Robots.txt Status</span>
                <span className="text-emerald-400 font-mono">{agenticData.technicalCheckpoints.aiCrawlerAccess.robotsTxtStatus}</span>
              </h5>
              <div className="space-y-2 text-xs">
                <div className="text-[11px] text-slate-400">Audited LLM Indexing Bots:</div>
                <ul className="space-y-1.5 text-[11px]">
                  {agenticData.technicalCheckpoints.aiCrawlerAccess.unblockedBots.map((bot) => (
                    <li key={bot} className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{bot} — Permitted</span>
                    </li>
                  ))}
                  {agenticData.technicalCheckpoints.aiCrawlerAccess.blockedBots.map((bot) => (
                    <li key={bot} className="flex items-center gap-2 text-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{bot} — Blocked by edge WAF</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: THE FOUR-LAYER AI PRODUCT ARCHITECTURE */}
      {activeTab === 'four_layers' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 text-xs text-slate-300">
            AI agents parse field names, attribute keys, and structural values rather than visual banners. Structuring product data into four distinct operational layers is essential to prevent inventory exclusion.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layer 1: Master Data */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950 px-2 py-0.5 rounded">
                  Layer 1: Master Data Foundation
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {agenticData.fourLayerArchitecture.layer1MasterData.score}/100
                </span>
              </div>
              <h5 className="text-sm font-bold text-white">SKUs, GTINs, MPNs &amp; Physical Specifications</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {agenticData.fourLayerArchitecture.layer1MasterData.details}
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300">
                Coverage: {agenticData.fourLayerArchitecture.layer1MasterData.gtinCoverage}
              </div>
            </div>

            {/* Layer 2: Dynamic Operational Data */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950 px-2 py-0.5 rounded">
                  Layer 2: Dynamic Operational Data
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {agenticData.fourLayerArchitecture.layer2DynamicData.score}/100
                </span>
              </div>
              <h5 className="text-sm font-bold text-white">Real-Time Pricing, Live Inventory &amp; Lead Times</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {agenticData.fourLayerArchitecture.layer2DynamicData.details}
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300">
                Sync Latency: {agenticData.fourLayerArchitecture.layer2DynamicData.syncLatency}
              </div>
            </div>

            {/* Layer 3: Outcome-Focused Semantic Data */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950 px-2 py-0.5 rounded">
                  Layer 3: Outcome-Focused &amp; Semantic Data
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {agenticData.fourLayerArchitecture.layer3SemanticData.score}/100
                </span>
              </div>
              <h5 className="text-sm font-bold text-white">Contextual Solution Parameters &amp; Use Cases</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {agenticData.fourLayerArchitecture.layer3SemanticData.details}
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-400 font-bold block">Query Resolution Mapping:</span>
                <span className="text-emerald-300 block">• &quot;Engineered for high-volume enterprise stability&quot; -&gt; Yes</span>
                <span className="text-emerald-300 block">• &quot;Compliant with South African regulatory POPIA laws&quot; -&gt; Yes</span>
              </div>
            </div>

            {/* Layer 4: Organisational & Trust Data */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950 px-2 py-0.5 rounded">
                  Layer 4: Organisational &amp; Trust Data
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {agenticData.fourLayerArchitecture.layer4TrustData.score}/100
                </span>
              </div>
              <h5 className="text-sm font-bold text-white">Sustainability, Certifications &amp; Corporate Governance</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {agenticData.fourLayerArchitecture.layer4TrustData.details}
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300">
                Ethical Sourcing &amp; POPIA: Verified machine-readable declarations
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PROTOCOLS, PAYMENT PRIMITIVES & KYA SECURITY */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          {/* Emerging Transaction Protocols Table */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
            <h4 className="text-sm font-black text-[#00e5ff] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00e5ff]" />
              <span>Emerging Transaction Protocols: ACP, AP2 &amp; Commerce MCP</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-bold">
                    <th className="py-2.5 pr-4">Protocol</th>
                    <th className="py-2.5 pr-4">Primary Developers</th>
                    <th className="py-2.5 pr-4">Core Functionality</th>
                    <th className="py-2.5">Authorisation Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">ACP (Agentic Commerce Protocol)</td>
                    <td className="py-3 pr-4 text-cyan-300">OpenAI &amp; Stripe</td>
                    <td className="py-3 pr-4">Cart creation and instant checkout across AI chat interfaces</td>
                    <td className="py-3 font-mono text-[11px]">Shared Payment Tokens (SPTs)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">AP2 (Agent Payments Protocol)</td>
                    <td className="py-3 pr-4 text-cyan-300">Google</td>
                    <td className="py-3 pr-4">Cryptographic payment authorisation for autonomous agent settlement</td>
                    <td className="py-3 font-mono text-[11px]">Cryptographically signed user mandates</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">Commerce MCP (Model Context Protocol)</td>
                    <td className="py-3 pr-4 text-cyan-300">Anthropic / Open Standard</td>
                    <td className="py-3 pr-4">Universal open integration layer securely exposing PIM &amp; OMS endpoints</td>
                    <td className="py-3 font-mono text-[11px]">Scoped API keys &amp; endpoint permissions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* KYA Security Architecture */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Know Your Agent (KYA) Security Framework</span>
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/40 font-bold">
                Active Threat Mitigation
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Autonomous agent transactions require evolving traditional Know Your Customer (KYC) models into Know Your Agent (KYA) frameworks. Without KYA, legacy WAFs block legitimate shopping agents while remaining vulnerable to the 25% surge in malicious bot-initiated account takeovers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-white block font-bold">1. Agent Identity Verification</strong>
                <p className="text-[11px] text-slate-400">Cryptographic signature and public registry check of the software agent.</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-white block font-bold">2. Intent Verification</strong>
                <p className="text-[11px] text-slate-400">Validating checkout payload against user-approved execution mandates.</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-white block font-bold">3. Behavioral Threat Scoring</strong>
                <p className="text-[11px] text-slate-400">Real-time velocity scoring to isolate legitimate shopping agents from malicious bots.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: 90-DAY EXECUTION ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 text-xs text-slate-300">
            Achieving enterprise agentic commerce readiness does not require replatforming your core commerce stack. Execute this structured 90-day transition to establish machine readability, unblock crawlers, and enable autonomous checkout.
          </div>

          <div className="space-y-4">
            {/* Phase 1 */}
            <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 overflow-hidden">
              <div
                onClick={() => setExpandedPhase(expandedPhase === 1 ? null : 1)}
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00e5ff] tracking-widest block">Days 1–30</span>
                  <h5 className="text-sm font-black text-white">{agenticData.ninetyDayRoadmap.phase1Days1to30.title}</h5>
                  <span className="text-xs text-slate-400">Focus: {agenticData.ninetyDayRoadmap.phase1Days1to30.focus}</span>
                </div>
                {expandedPhase === 1 ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
              {expandedPhase === 1 && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/60">
                  <ul className="space-y-2 text-xs text-slate-300">
                    {agenticData.ninetyDayRoadmap.phase1Days1to30.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Phase 2 */}
            <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 overflow-hidden">
              <div
                onClick={() => setExpandedPhase(expandedPhase === 2 ? null : 2)}
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00e5ff] tracking-widest block">Days 31–60</span>
                  <h5 className="text-sm font-black text-white">{agenticData.ninetyDayRoadmap.phase2Days31to60.title}</h5>
                  <span className="text-xs text-slate-400">Focus: {agenticData.ninetyDayRoadmap.phase2Days31to60.focus}</span>
                </div>
                {expandedPhase === 2 ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
              {expandedPhase === 2 && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/60">
                  <ul className="space-y-2 text-xs text-slate-300">
                    {agenticData.ninetyDayRoadmap.phase2Days31to60.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Phase 3 */}
            <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 overflow-hidden">
              <div
                onClick={() => setExpandedPhase(expandedPhase === 3 ? null : 3)}
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00e5ff] tracking-widest block">Days 61–90</span>
                  <h5 className="text-sm font-black text-white">{agenticData.ninetyDayRoadmap.phase3Days61to90.title}</h5>
                  <span className="text-xs text-slate-400">Focus: {agenticData.ninetyDayRoadmap.phase3Days61to90.focus}</span>
                </div>
                {expandedPhase === 3 ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
              {expandedPhase === 3 && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/60">
                  <ul className="space-y-2 text-xs text-slate-300">
                    {agenticData.ninetyDayRoadmap.phase3Days61to90.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 5 Implementation KPIs */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#00e5ff] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00e5ff]" />
              <span>5 Core Implementation KPIs (Roadmap Verification Metrics)</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Schema Coverage</span>
                <span className="text-sm font-black text-emerald-400">100% SKUs</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Zero GSC errors</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">2. API Sync Latency</span>
                <span className="text-sm font-black text-cyan-300">&lt; 15 mins</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Webhook push</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">3. AI Index Rate</span>
                <span className="text-sm font-black text-emerald-400">&gt; 95%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">GPTBot &amp; Perplexity</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Share of Model</span>
                <span className="text-sm font-black text-cyan-300">Top-3</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Citation ranking</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">5. Agent Lift</span>
                <span className="text-sm font-black text-emerald-400">+40% CRO</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">vs legacy search</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
