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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Cockpit Executive Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#002157] via-slate-900 to-[#0f172a] p-6 sm:p-8 rounded-[36px] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30">
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
            className="px-6 py-3.5 bg-[#00e5ff] text-[#002157] hover:bg-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Audit New Client</span>
          </button>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* Commercial Portfolio KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-slate-900/60 rounded-[28px] border border-white/10 space-y-2 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Audited Portfolio</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {totalAudited} <span className="text-xs text-white/40 font-normal">Storefronts</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Prospects evaluated with measured data
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 rounded-[28px] border border-white/10 space-y-2 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Portfolio Avg Score</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {averageScore} <span className="text-xs text-white/40 font-normal">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Current measured storefront health
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 rounded-[28px] border border-white/10 space-y-2 hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>High-Priority Targets</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {highPriorityDeals} <span className="text-xs text-white/40 font-normal">(&lt;70 score)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Immediate conversion recovery deals
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 rounded-[28px] border border-white/10 space-y-2 hover:border-cyan-400/30 transition">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Avg Projected Uplift</span>
            <TrendingUp className="w-4 h-4 text-[#00e5ff]" />
          </div>
          <div className="text-3xl font-black text-[#00e5ff] tracking-tight">
            +{averageProjectedUplift} <span className="text-xs text-white/40 font-normal">pts</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Average post-remediation gain
          </p>
        </div>
      </div>

      {/* Active Deal Dossier & Key Callouts */}
      {activeClient ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Prospect Dossier
                </span>
                <span className="text-xs text-white/40 font-mono">
                  ID: {activeClient.id}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                {activeClient.businessName || activeClient.url}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-cyan-400">
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
                    <span className="text-emerald-400 font-mono">
                      Audit Conducted: R {executionCostZar.toFixed(3)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-3xl border border-white/10">
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Diagnostic Score
                </div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {activeClient.overallScore}<span className="text-base text-white/40">/100</span>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">
                  Projected
                </div>
                <div className="text-2xl font-black text-[#00e5ff] tracking-tight">
                  {activeClient.projectedOverallScore || 90}/100
                </div>
                <div className="text-[10px] font-bold text-emerald-400">
                  +{activeClient.scoreUplift || 30} pts uplift
                </div>
              </div>
            </div>
          </div>

          {/* Quick Diagnostics Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Primary Friction Point</span>
              </div>
              <div className="text-sm font-black text-white uppercase tracking-tight">
                {lowestCat ? `${lowestCat[0]} (${lowestCat[1].score}%)` : 'Technical Bottlenecks'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {essentialFindingsCount} essential measured friction points requiring immediate remediation.
              </p>
            </div>

            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Storefront Asset & Strength</span>
              </div>
              <div className="text-sm font-black text-white uppercase tracking-tight">
                {highestCat ? `${highestCat[0]} (${highestCat[1].score}%)` : 'Core Foundations'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foundations are sound. Upsell conversion rate optimization without structural overhaul.
              </p>
            </div>

            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00e5ff] uppercase tracking-wider">
                <Bot className="w-4 h-4 shrink-0" />
                <span>Agentic AI Commerce Status</span>
              </div>
              <div className="text-sm font-black text-white uppercase tracking-tight">
                {agenticScore !== undefined ? `${agenticScore}/100 (${activeClient.agenticCommerce?.readinessTier})` : 'Architecture Ready'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
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
                className="p-5 bg-[#002157] hover:bg-[#002157]/80 border border-[#00e5ff]/40 rounded-2xl text-left transition group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="p-2.5 bg-[#00e5ff]/20 text-[#00e5ff] rounded-xl w-fit mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#00e5ff] transition">
                    Email Pitch Studio
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Generate personalized C-suite pitch scripts & cold outreach tailored to findings.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-[#00e5ff] uppercase tracking-wider">
                  <span>Open Pitch Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Interactive Sandbox */}
              <button
                onClick={() => setActiveTab('sandbox')}
                className="p-5 bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 rounded-2xl text-left transition group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition">
                    Interactive Fix Sandbox
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Demonstrate live before/after DOM component enhancements (size guide, fast search, cart).
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-emerald-400 uppercase tracking-wider">
                  <span>Launch Sandbox</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* 12-Factor Diagnostic Report */}
              <button
                onClick={() => setActiveTab('report')}
                className="p-5 bg-slate-800/80 hover:bg-slate-800 border border-white/10 rounded-2xl text-left transition group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl w-fit mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition">
                    Executive Audit Report
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    View full diagnostic audit, category benchmarks, agentic review, and export PDF.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-purple-400 uppercase tracking-wider">
                  <span>View Diagnostic</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Lead Qualification & Commercial Gap */}
              <button
                onClick={() => setActiveTab('leads')}
                className="p-5 bg-slate-800/80 hover:bg-slate-800 border border-white/10 rounded-2xl text-left transition group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl w-fit mb-3">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition">
                    Lead Qualification
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Prioritize deal size, recommended Smollan service lines, and qualification notes.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-wider">
                  <span>Qualify Deal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>

            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/60 rounded-[36px] border border-white/10 space-y-4">
          <Globe className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">No Active Prospect Loaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Audit a storefront to populate commercial telemetry, deal qualification, and one-click pitch generation.
          </p>
          <button
            onClick={onLaunchNewAudit}
            className="px-6 py-3 bg-[#00e5ff] text-[#002157] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition"
          >
            Launch First Audit
          </button>
        </div>
      )}

      {/* Commercial Talking Points & Field Objection Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deal Talking Points */}
        <div className="bg-slate-900/60 border border-white/10 rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Smollan 4-Vector Pitch Framework
              </h3>
              <p className="text-xs text-slate-400">
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
              <div key={i} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">
                    {vector.title}
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded font-mono">
                    {vector.metric}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {vector.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Objection Handling Playbook */}
        <div className="bg-slate-900/60 border border-white/10 rounded-[36px] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Enterprise Objection Battlecard
              </h3>
              <p className="text-xs text-slate-400">
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
                    isOpen ? 'bg-[#002157]/40 border-[#00e5ff]/40 shadow-lg' : 'bg-black/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <button
                    onClick={() => setSelectedObjection(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-bold text-white uppercase tracking-tight">
                      "{item.objection}"
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#00e5ff]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/5 text-xs">
                      <div className="text-slate-300 leading-relaxed">
                        <strong className="text-[#00e5ff] font-bold uppercase tracking-wider block mb-1">
                          Commercial Talk Track:
                        </strong>
                        {item.talkingPoint}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
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
        <div className="bg-slate-900/60 border border-white/10 rounded-[36px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Audited Deal Pipeline ({auditList.length} Prospects)
              </h3>
              <p className="text-xs text-slate-400">
                Switch active prospect to load specific telemetry and launch targeted pitches
              </p>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-[#00e5ff] hover:underline uppercase tracking-wider"
            >
              View Full History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-4">Storefront Prospect</th>
                  <th className="py-3 px-4">Current Score</th>
                  <th className="py-3 px-4">Projected Uplift</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Audited Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditList.map((audit) => {
                  const isActive = activeClient?.id === audit.id;
                  return (
                    <tr 
                      key={audit.id} 
                      className={`hover:bg-white/5 transition ${isActive ? 'bg-[#002157]/30' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white uppercase tracking-tight">
                          {audit.businessName || audit.url}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                          {audit.url}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                          audit.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          audit.overallScore >= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {audit.overallScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#00e5ff]">
                        +{audit.scoreUplift || 25} pts
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {audit.findings?.length || 0} issues
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(audit.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectAudit && onSelectAudit(audit)}
                          disabled={isActive}
                          className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition ${
                            isActive 
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 cursor-default'
                              : 'bg-white/5 hover:bg-[#00e5ff] hover:text-[#002157] text-white border border-white/10'
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
  );
};
