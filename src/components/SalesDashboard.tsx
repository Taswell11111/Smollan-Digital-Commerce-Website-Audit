import React, { useState } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Mail, 
  PlusCircle, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Layers, 
  Bot, 
  Zap, 
  ExternalLink, 
  Briefcase, 
  FileText, 
  ChevronRight,
  Globe,
  DollarSign,
  Cpu,
  Eye
} from 'lucide-react';
import { AuditRecord } from '../types';

interface SalesDashboardProps {
  setActiveTab: (tab: string) => void;
  recentAudit?: AuditRecord | null;
  savedAudits?: AuditRecord[];
  onSelectAudit?: (audit: AuditRecord) => void;
  onLaunchNewAudit: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ 
  setActiveTab, 
  recentAudit, 
  savedAudits = [], 
  onSelectAudit,
  onLaunchNewAudit 
}) => {
  const [selectedObjection, setSelectedObjection] = useState<number | null>(null);

  // Portfolio aggregates calculated deterministically from real saved audits (zero mock data)
  const auditList = savedAudits.length > 0 ? savedAudits : (recentAudit ? [recentAudit] : []);
  const totalAudited = auditList.length;
  
  const averageScore = totalAudited > 0
    ? Math.round(auditList.reduce((acc, a) => acc + (a.overallScore || 0), 0) / totalAudited)
    : 0;

  const highPriorityDeals = auditList.filter(a => (a.overallScore || 0) < 70).length;

  const averageProjectedUplift = totalAudited > 0
    ? Math.round(auditList.reduce((acc, a) => acc + ((a.projectedOverallScore || a.overallScore || 0) - (a.overallScore || 0)), 0) / totalAudited)
    : 0;

  // Active client details
  const activeClient = recentAudit || (auditList.length > 0 ? auditList[0] : null);

  // Find lowest and highest scoring categories for the active client
  const sortedCategories = activeClient?.categoryResults 
    ? Object.entries(activeClient.categoryResults).sort((a, b) => a[1].score - b[1].score)
    : [];
  const lowestCat = sortedCategories[0];
  const highestCat = sortedCategories[sortedCategories.length - 1];

  const essentialFindingsCount = activeClient?.findings?.filter(f => f.severity === 'Essential').length || 0;
  const recommendedFindingsCount = activeClient?.findings?.filter(f => f.severity === 'Recommended').length || 0;

  const agenticScore = activeClient?.agenticCommerce?.agenticScore;
  const executionCostZar = activeClient?.executionCost?.totalEstimatedCostZar;

  const objections = [
    {
      objection: "We already have an incumbent digital agency or internal dev squad.",
      talkingPoint: "Smollan does not ask you to replace your existing team or agency. We provide forensic 12-factor telemetry and pre-built code components from our Interactive Sandbox that your existing engineering squad can test and deploy in days without structural disruption.",
      proof: "Direct measured data rather than subjective opinions."
    },
    {
      objection: "We don't have the Capex budget for a full eCommerce replatform right now.",
      talkingPoint: "A complete replatform is unnecessary. Our diagnostic proves that targeting measured high-friction bottlenecks (such as missing variant sizing guides, slow TTFB, and unindexed product schema) recovers up to 35 points of conversion performance on your existing tech stack.",
      proof: "Micro-interventions yield immediate conversion recovery."
    },
    {
      objection: "How do we know the conversion uplift isn't just theoretical?",
      talkingPoint: "We back our recommendations with an Interactive Component Sandbox that models the exact visual and behavioral fix on the client's live storefront DOM, allowing stakeholders to experience the recovered journey prior to any commercial sign-off.",
      proof: "Interactive proof-of-concept before commitment."
    },
    {
      objection: "Why should we invest in Agentic AI Commerce readiness today?",
      talkingPoint: "Autonomous AI agents (Perplexity, ChatGPT Operator, Google Gemini) are already querying product feeds and synthetic APIs. Brands that fail to structure 4-layer master data and KYA authentication will become invisible to machine-led shopping within 12 months.",
      proof: "90-day readiness roadmap aligned with modern agent protocols."
    }
  ];

  return (
    <div className="w-full bg-[var(--theme-page-bg)] text-[var(--theme-page-text)] min-h-screen">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Cockpit Executive Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-[var(--theme-header-bg)] p-6 sm:p-8 rounded-[36px] border border-[var(--theme-header-border)] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-[var(--theme-highlight)]/20 text-[var(--theme-highlight)] border border-[var(--theme-highlight)]/30">
              Smollan Commercial Intelligence
            </span>
            <span className="text-xs text-white/50 font-mono">
              Sales Deal Acceleration Cockpit
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            Sales Cockpit & Deal Pipeline
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Forensic diagnostic telemetry, commercial pitch vectors, and interactive deal acceleration tools for Smollan enterprise sales representatives.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={onLaunchNewAudit}
            className="px-6 py-3.5 bg-[var(--theme-highlight)] text-[var(--theme-header-bg)] hover:bg-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Audit New Client</span>
          </button>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[var(--theme-highlight)]/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* Commercial Portfolio KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-[28px] border border-slate-200 shadow-sm space-y-2 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Audited Portfolio</span>
            <Briefcase className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {totalAudited} <span className="text-xs text-slate-400 font-normal">Storefronts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Prospects evaluated with measured data
          </p>
        </div>

        <div className="p-6 bg-white rounded-[28px] border border-slate-200 shadow-sm space-y-2 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Portfolio Avg Score</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {averageScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Current measured storefront health
          </p>
        </div>

        <div className="p-6 bg-white rounded-[28px] border border-slate-200 shadow-sm space-y-2 hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>High-Priority Targets</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {highPriorityDeals} <span className="text-xs text-slate-400 font-normal">(&lt;70 score)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Immediate conversion recovery deals
          </p>
        </div>

        <div className="p-6 bg-white rounded-[28px] border border-slate-200 shadow-sm space-y-2 hover:border-cyan-400/30 transition">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Avg Projected Uplift</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-cyan-600 tracking-tight">
            +{averageProjectedUplift} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Average post-remediation gain
          </p>
        </div>
      </div>

      {/* Active Deal Dossier & Key Callouts */}
      {activeClient ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Prospect Dossier
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {activeClient.id}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {activeClient.businessName || activeClient.url}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5 text-cyan-700">
                  <Globe className="w-3.5 h-3.5" />
                  <a href={activeClient.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {activeClient.url}
                  </a>
                </span>
                <span>•</span>
                <span>Evaluated: {new Date(activeClient.timestamp).toLocaleDateString()}</span>
                {executionCostZar !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-mono">
                      Audit Conducted: R {executionCostZar.toFixed(3)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-200">
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Diagnostic Score
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeClient.overallScore}<span className="text-base text-slate-400">/100</span>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600">
                  Projected
                </div>
                <div className="text-2xl font-black text-cyan-600 tracking-tight">
                  {activeClient.projectedOverallScore || 90}/100
                </div>
                <div className="text-[10px] font-bold text-emerald-600">
                  +{activeClient.scoreUplift || 30} pts uplift
                </div>
              </div>
            </div>
          </div>

          {/* Quick Diagnostics Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Primary Friction Point</span>
              </div>
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {lowestCat ? `${lowestCat[0]} (${lowestCat[1].score}%)` : 'Technical Bottlenecks'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {essentialFindingsCount} essential measured friction points requiring immediate remediation.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Storefront Asset & Strength</span>
              </div>
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {highestCat ? `${highestCat[0]} (${highestCat[1].score}%)` : 'Core Foundations'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Foundations are sound. Upsell conversion rate optimization without structural overhaul.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 uppercase tracking-wider">
                <Bot className="w-4 h-4 shrink-0" />
                <span>Agentic AI Commerce Status</span>
              </div>
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {agenticScore !== undefined ? `${agenticScore}/100 (${activeClient.agenticCommerce?.readinessTier})` : 'Architecture Ready'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                4-layer data architecture & synthetic buyer bot accessibility index.
              </p>
            </div>
          </div>

          {/* Instant One-Click Pitch & Sales Triggers */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
              One-Click Pitch & Commercial Workspaces
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Pitch Studio */}
              <button
                onClick={() => setActiveTab('pitch')}
                className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl w-fit mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-cyan-700 transition">
                    Email Pitch Studio
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Generate personalized C-suite pitch scripts & cold outreach tailored to findings.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-cyan-700 uppercase tracking-wider">
                  <span>Open Pitch Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Interactive Sandbox */}
              <button
                onClick={() => setActiveTab('sandbox')}
                className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl w-fit mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-700 transition">
                    Interactive Fix Sandbox
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Demonstrate live before/after DOM component enhancements (size guide, fast search, cart).
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-emerald-700 uppercase tracking-wider">
                  <span>Launch Sandbox</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* 12-Factor Diagnostic Report */}
              <button
                onClick={() => setActiveTab('report')}
                className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl w-fit mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-purple-700 transition">
                    Executive Audit Report
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    View full diagnostic audit, category benchmarks, agentic review, and export PDF.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-purple-700 uppercase tracking-wider">
                  <span>View Diagnostic</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Lead Qualification & Commercial Gap */}
              <button
                onClick={() => setActiveTab('leads')}
                className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl w-fit mb-3">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-amber-700 transition">
                    Lead Qualification
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Prioritize deal size, recommended Smollan service lines, and qualification notes.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-amber-700 uppercase tracking-wider">
                  <span>Qualify Deal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-[36px] border border-slate-200 shadow-sm space-y-4">
          <Globe className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">No Active Prospect Loaded</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Audit a storefront to populate commercial telemetry, deal qualification, and one-click pitch generation.
          </p>
          <button
            onClick={onLaunchNewAudit}
            className="px-6 py-3 bg-[#002157] text-[#00e5ff] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-900 transition shadow-lg"
          >
            Launch First Audit
          </button>
        </div>
      )}

      {/* Commercial Talking Points & Field Objection Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deal Talking Points */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Smollan 4-Vector Pitch Framework
              </h3>
              <p className="text-xs text-slate-500">
                Core commercial talking points anchored in measured telemetry
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "1. Conversion Rate Optimization & Variant Hesitation",
                summary: "Eliminate checkout friction caused by absent sizing guides and unclear pricing. Shoppers leave when variant specifications are ambiguous.",
                metric: "Recovers 12-24% of checkout drop-offs"
              },
              {
                title: "2. Agentic AI & Autonomous Machine Purchasing",
                summary: "Equip storefronts with 4-layer master data, Schema.org product feeds, and synthetic agent discovery for ChatGPT Operator & Gemini search.",
                metric: "Future-proofs revenue for 2025-2026 agentic shift"
              },
              {
                title: "3. Mobile Core Web Vitals & Server Latency",
                summary: "Every 100ms delay in TTFB degrades mobile conversion by 1%. Edge distribution and optimized asset bundling restore peak responsiveness.",
                metric: "Sub-second load times on mobile viewports"
              },
              {
                title: "4. Technical SEO & Clean Canonical Hygiene",
                summary: "Prevent duplicate indexation penalties and guarantee that Google and Bing properly index all product catalog variations.",
                metric: "Maximizes zero-cost organic acquisition"
              }
            ].map((vector, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {vector.title}
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-mono">
                    {vector.metric}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {vector.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Objection Handling Playbook */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Enterprise Objection Battlecard
              </h3>
              <p className="text-xs text-slate-500">
                Click any client pushback to review Smollan's proven rebuttal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {objections.map((item, idx) => {
              const isOpen = selectedObjection === idx;
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'bg-slate-50 border-cyan-500/40 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setSelectedObjection(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      "{item.objection}"
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-cyan-600' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100 text-xs">
                      <div className="text-slate-600 leading-relaxed">
                        <strong className="text-cyan-700 font-bold uppercase tracking-wider block mb-1">
                          Commercial Talk Track:
                        </strong>
                        {item.talkingPoint}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        Strategic Pivot: {item.proof}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Prospect Quick Switcher Table */}
      {auditList.length > 1 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-[36px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Audited Deal Pipeline ({auditList.length} Prospects)
              </h3>
              <p className="text-xs text-slate-500">
                Switch active prospect to load specific telemetry and launch targeted pitches
              </p>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-cyan-600 hover:underline uppercase tracking-wider"
            >
              View Full History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-4">Storefront Prospect</th>
                  <th className="py-3 px-4">Current Score</th>
                  <th className="py-3 px-4">Projected Uplift</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Audited Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditList.map((audit) => {
                  const isActive = activeClient?.id === audit.id;
                  return (
                    <tr 
                      key={audit.id} 
                      className={`hover:bg-slate-50 transition ${isActive ? 'bg-cyan-50' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 uppercase tracking-tight">
                          {audit.businessName || audit.url}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                          {audit.url}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                          audit.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          audit.overallScore >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {audit.overallScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-cyan-600">
                        +{audit.scoreUplift || 25} pts
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {audit.findings?.length || 0} issues
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(audit.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectAudit && onSelectAudit(audit)}
                          disabled={isActive}
                          className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition ${
                            isActive 
                              ? 'bg-cyan-100 text-cyan-700 border border-cyan-200 cursor-default'
                              : 'bg-white hover:bg-[#002157] hover:text-white text-slate-700 border border-slate-200 shadow-sm'
                          }`}
                        >
                          {isActive ? 'Active Dossier' : 'Load Prospect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
