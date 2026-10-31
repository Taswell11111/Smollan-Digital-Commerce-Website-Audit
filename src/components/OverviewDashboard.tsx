import React, { useState } from 'react';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Target,
  FileText,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  BarChart3,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Image as ImageIcon,
  Check,
  X,
  Zap,
  Info,
  Server
} from 'lucide-react';
import { AuditRecord, LeadRecord, InspectedPage, UrlInspectionResult } from '../types';

interface OverviewDashboardProps {
  setActiveTab: (tab: string) => void;
  dashboardMode: 'overview' | 'detailed';
  setDashboardMode: (mode: 'overview' | 'detailed') => void;
  savedAudits: AuditRecord[];
  savedLeads: LeadRecord[];
  currentAudit: AuditRecord | null;
  onSelectAudit: (audit: AuditRecord) => void;
  onStartAudit?: (params: {
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    depth: 'quick' | 'standard' | 'deep';
  }) => void;
  isLoading?: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  setActiveTab,
  dashboardMode,
  setDashboardMode,
  savedAudits,
  savedLeads,
  currentAudit,
  onSelectAudit,
  onStartAudit,
  isLoading = false,
}) => {
  const activeAudit = currentAudit || (savedAudits.length > 0 ? savedAudits[0] : null);
  const isHistoricalArchive = !currentAudit && savedAudits.length > 0;

  // Quick scraper form state for sales reps
  const [scrapeUrl, setScrapeUrl] = useState<string>('');
  const [scrapeDepth, setScrapeDepth] = useState<'quick' | 'standard'>('standard');
  const [selectedPageForModal, setSelectedPageForModal] = useState<InspectedPage | null>(null);
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Proactive Inline Verification State (displays screenshot & domain preview immediately upon URL entry)
  const [inlineInspection, setInlineInspection] = useState<UrlInspectionResult | null>(null);
  const [isInspectingInline, setIsInspectingInline] = useState<boolean>(false);

  const handleInspectUrl = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.includes('.')) return;
    setIsInspectingInline(true);
    try {
      const res = await fetch('/api/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        setInlineInspection(data);
      }
    } catch {
      // ignore
    } finally {
      setIsInspectingInline(false);
    }
  };

  // Run initial inline inspection on mount or when scrapeUrl changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (scrapeUrl.trim().length >= 8) {
        handleInspectUrl(scrapeUrl.trim());
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [scrapeUrl]);

  const avgScore = savedAudits.length > 0
    ? Math.round(savedAudits.reduce((acc, a) => acc + a.overallScore, 0) / savedAudits.length)
    : 72;

  const highPriorityLeadsCount = savedLeads.filter(l => l.priority === 'High').length;

  const handleQuickScrapeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim() || !onStartAudit) return;
    
    let businessName = inlineInspection?.pageTitle || '';
    if (!businessName) {
      try {
        businessName = new URL(scrapeUrl.startsWith('http') ? scrapeUrl : `https://${scrapeUrl}`).hostname;
      } catch {
        businessName = scrapeUrl;
      }
    }

    onStartAudit({
      url: inlineInspection?.resolvedUrl || scrapeUrl.trim(),
      businessName: businessName.replace('www.', ''),
      businessCategory: 'Retail / Ecommerce',
      targetMarket: 'South Africa',
      primaryObjective: 'sales',
      depth: scrapeDepth
    });
  };

  const presetUrls: any[] = [];

  // Filtered inspected pages for the detailed view
  const pagesList: InspectedPage[] = activeAudit?.pagesInspected || [];
  const filteredPages = pagesList.filter(p => {
    const matchesFilter = pageTypeFilter === 'all' || p.pageType.toLowerCase() === pageTypeFilter.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      p.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      



      {/* Overview Header / Welcome */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#002157]">Intelligence Command Centre</h2>
          <p className="text-sm text-slate-500 font-medium">Review saved audits, manage sales leads, and monitor retail performance trends.</p>
        </div>
        <button
           onClick={() => setActiveTab('new_audit')}
           className="bg-[#00e5ff] text-[#002157] px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:scale-105 transition-transform"
        >
          Initiate New Audit
        </button>
      </div>

      {/* 3. VIEW MODE 1: OVERVIEW DASHBOARD */}
      {dashboardMode === 'overview' && (
        <div className="space-y-8">
          
          {/* Active Diagnostic Target Banner */}
          {activeAudit && (
            <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              isHistoricalArchive ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase font-extrabold tracking-widest block ${
                    isHistoricalArchive ? 'text-amber-800' : 'text-cyan-700'
                  }`}>
                    {isHistoricalArchive ? '📁 Reference Case Study (Historical Archive)' : 'Active Storefront Audit'}
                  </span>
                  {isHistoricalArchive && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      Historical Benchmark
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{activeAudit.businessName}</h3>
                  <a
                    href={activeAudit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-cyan-600 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{activeAudit.url}</p>
                {isHistoricalArchive && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    * Showing archived Reebok South Africa benchmark. To audit a new storefront, enter its URL above. Enhanced scores will compute only after crawl completes.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-center pr-4 border-r border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Score</span>
                  <span className="text-2xl font-black text-slate-900">{activeAudit.overallScore}<span className="text-xs text-slate-400">/100</span></span>
                </div>
                <div className="text-center pr-4 border-r border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Smollan Target</span>
                  <span className="text-2xl font-black text-emerald-600">{activeAudit.projectedOverallScore || 93}<span className="text-xs text-emerald-500">/100</span></span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-[#002157] text-[#00e5ff] hover:bg-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <span>View Executive Report</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDashboardMode('detailed')}
                    className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>View Crawled Pages ({activeAudit.pagesInspected?.length || activeAudit.crawlSummary.inspected})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">01 — Web Scraping & Inspection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Server-side Cheerio crawler crawls prospect storefronts, extracts metadata, identifies page types, checks size guides, prices, and alt tags.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">02 — Industry Benchmarking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic 12-category scoring model evaluates friction points against South African and global eCommerce standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">03 — Sales Commercial Studio</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cost-effective Gemini Flash AI drafts targeted sales pitches and discovery questions directly from verified crawl findings.
              </p>
            </div>
          </div>

          {/* Two-Column Lower Section: Audits & Leads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Audits Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  Recent Storefront Audits
                </h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-800"
                >
                  View All ({savedAudits.length}) →
                </button>
              </div>

              {savedAudits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No audits recorded yet. Run your first scrape above.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAudits.slice(0, 4).map((audit) => (
                    <div
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        activeAudit?.id === audit.id
                          ? 'border-cyan-500 bg-cyan-50/40'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{audit.businessName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(audit.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{audit.url}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Inspected: {audit.crawlSummary.inspected} pages · Uplift: +{audit.scoreUplift} pts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900">{audit.overallScore}/100</span>
                        <span className="block text-[10px] font-bold text-cyan-600 mt-1">Open Report →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Qualified B2B Sales Leads */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Commercial Leads Pipeline
                </h3>
                <button
                  onClick={() => setActiveTab('leads')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  Lead Details ({savedLeads.length}) →
                </button>
              </div>

              {savedLeads.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No sales leads generated yet. Run an audit to qualify prospects.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedLeads.slice(0, 4).map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        const matchingAudit = savedAudits.find(a => a.id === lead.auditId);
                        if (matchingAudit) onSelectAudit(matchingAudit);
                        setActiveTab('pitch');
                      }}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{lead.businessName}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${lead.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {lead.priority} Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{lead.domain}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Service Line: {lead.recommendedServices?.[0] || 'UX/UI & CRO Optimisation'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700">Score: {lead.overallScore}/100</span>
                        <span className="block text-[10px] font-semibold text-cyan-600 mt-1">Review Pitch →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE 2: DETAILED DASHBOARD & CRAWLED PAGES SCRAPE INVENTORY */}
      {dashboardMode === 'detailed' && (
        <div className="space-y-8">
          
          {/* Active Diagnostic Target Banner */}
          <div className="bg-[#002157] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-cyan-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#00e5ff] block mb-1">
                  Active Crawl & Diagnostic Target
                </span>
                <h2 className="text-2xl font-black">{activeAudit ? activeAudit.businessName : 'No Active Storefront'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-300 font-mono">{activeAudit?.url}</span>
                  <a
                    href={activeAudit?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00e5ff] hover:underline text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {activeAudit && (
                <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-center pr-4 border-r border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Score</span>
                    <span className="text-2xl font-black text-white">{activeAudit.overallScore}<span className="text-xs text-[#00e5ff]">/100</span></span>
                  </div>
                  <div className="text-center pr-4 border-r border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Smollan Target</span>
                    <span className="text-2xl font-black text-emerald-400">{activeAudit.projectedOverallScore || 93}<span className="text-xs text-emerald-300">/100</span></span>
                  </div>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-[#00e5ff] text-[#002157] hover:bg-cyan-300 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <span>Full Executive Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Technical Crawl Hygiene & Health Matrix */}
          {activeAudit && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pages Scraped</span>
                <div className="text-xl font-black text-slate-900">{pagesList.length || activeAudit.crawlSummary.inspected}</div>
                <span className="text-[10px] text-slate-500 font-medium">of {activeAudit.crawlSummary.discovered} discovered</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Server TTFB / Load</span>
                <div className="text-xl font-black text-cyan-700">{activeAudit.metrics.pageSpeed.value}</div>
                <span className="text-[10px] text-emerald-600 font-bold">Fast server response</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Critical Blockers</span>
                <div className="text-xl font-black text-red-600">{activeAudit.summaryCounts.essential}</div>
                <span className="text-[10px] text-red-700 font-medium">Essential fixes required</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Identified Opportunities</span>
                <div className="text-xl font-black text-amber-600">{activeAudit.summaryCounts.recommended + activeAudit.summaryCounts.content}</div>
                <span className="text-[10px] text-slate-500 font-medium">Recommended & Content</span>
              </div>
            </div>
          )}

          {/* SECTION A: CRAWLED PAGES & EXTRACTED INTELLIGENCE INVENTORY */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md mb-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Verified Scrape Inventory</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Crawled Pages & Extracted Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review every single page the crawler traversed and the exact DOM elements extracted (titles, headings, buttons, pricing, size guide triggers, image alt coverage).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search URL or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['all', 'homepage', 'product', 'category', 'cart', 'checkout', 'delivery'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPageTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                    pageTypeFilter === type
                      ? 'bg-[#002157] text-[#00e5ff]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'all' ? 'All Pages' : type}
                </button>
              ))}
            </div>

            {/* Pages Table / Grid */}
            {filteredPages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p>No inspected pages matching your filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3">Page Type</th>
                      <th className="py-3 px-3">Scraped URL & Title</th>
                      <th className="py-3 px-3 text-center">Status / Load</th>
                      <th className="py-3 px-3 text-center">Price</th>
                      <th className="py-3 px-3 text-center">Size Guide</th>
                      <th className="py-3 px-3 text-center">Images / Alt</th>
                      <th className="py-3 px-3 text-center">CTAs / Buttons</th>
                      <th className="py-3 px-3 text-right">Extracted Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPages.map((page, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            page.pageType === 'product'
                              ? 'bg-purple-100 text-purple-800'
                              : page.pageType === 'cart'
                              ? 'bg-emerald-100 text-emerald-800'
                              : page.pageType === 'category'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {page.pageType}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs sm:max-w-md">
                          <div className="font-bold text-slate-900 truncate" title={page.title}>{page.title || 'Untitled Page'}</div>
                          <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5" title={page.url}>{page.url}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-[11px] text-emerald-600 font-bold">{page.status || 200}</span>
                          <span className="text-[10px] text-slate-400 block">{page.loadTimeMs}ms</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {page.hasPrice ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                              <Check className="w-3.5 h-3.5 mr-0.5" /> Detected
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {page.hasSizeGuide ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                              <Check className="w-3.5 h-3.5 mr-0.5" /> Present
                            </span>
                          ) : page.pageType === 'product' ? (
                            <span className="inline-flex items-center text-red-600 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> Missing
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-slate-700 text-xs">{page.imagesCount} imgs</span>
                          {page.missingAltCount > 0 ? (
                            <span className="block text-[10px] text-red-600 font-semibold">{page.missingAltCount} missing alt</span>
                          ) : (
                            <span className="block text-[10px] text-emerald-600 font-semibold">100% alt coverage</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                          {page.buttons?.length || 0} buttons
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedPageForModal(page)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                          >
                            <Code2 className="w-3 h-3 text-cyan-600" />
                            <span>Inspect DOM</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: INDUSTRY STANDARD BENCHMARKING & COMPARISON MATRIX */}
          {activeAudit && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Industry Benchmark Comparison</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Client Storefront vs Retail Industry Standard Benchmarks
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Measured against South African and global retail eCommerce median standards (~80% baseline).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-red-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Lagging (&lt; -4 pts)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> On Par (±3 pts)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Outperforming (&gt; +4 pts)
                  </span>
                </div>
              </div>

              {/* Benchmark Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prospect Storefront Score</span>
                  <div className="text-2xl font-black text-slate-900">{activeAudit.overallScore}/100</div>
                  <span className="text-[11px] text-slate-500">Audited across 12 criteria</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Industry Median Benchmark</span>
                  <div className="text-2xl font-black text-blue-600">
                    {activeAudit.industryBenchmarks?.industryAverage || 80}/100
                  </div>
                  <span className="text-[11px] text-slate-500">Top-tier retail standard: 90/100</span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Smollan Enhanced Target</span>
                  <div className="text-2xl font-black text-emerald-700">
                    {activeAudit.projectedOverallScore || 93}/100
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800">+{activeAudit.scoreUplift} pts competitive advantage</span>
                </div>
              </div>

              {/* Detailed 12-Category Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {Object.entries(activeAudit.categoryResults).map(([catName, catData]: [string, any]) => {
                  const currentVal = catData.score;
                  const enhancedVal = Math.max(currentVal, catData.enhancedScore || Math.min(100, currentVal + 20));
                  const benchmarkData = activeAudit.industryBenchmarks?.categoryBenchmarks?.[catName] || {
                    benchmark: 80,
                    delta: currentVal - 80,
                    status: currentVal < 76 ? 'Lagging' : currentVal > 84 ? 'Outperforming' : 'On Par'
                  };

                  return (
                    <div
                      key={catName}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{catName}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {catData.checks?.length || 0} checks executed
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                          benchmarkData.status === 'Lagging'
                            ? 'bg-red-100 text-red-800'
                            : benchmarkData.status === 'Outperforming'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {benchmarkData.status} ({benchmarkData.delta > 0 ? `+${benchmarkData.delta}` : benchmarkData.delta} pts)
                        </span>
                      </div>

                      {/* Tri-metric visual bar: Current vs Benchmark vs Enhanced */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>Current: <strong className="text-slate-900">{currentVal}%</strong></span>
                          <span>Industry Std: <strong className="text-blue-700">{benchmarkData.benchmark}%</strong></span>
                          <span>Smollan: <strong className="text-emerald-600">{enhancedVal}%</strong></span>
                        </div>

                        {/* Current Bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              currentVal >= 80 ? 'bg-emerald-500' : currentVal >= 65 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${currentVal}%` }}
                          ></div>
                        </div>

                        {/* Enhanced Bar */}
                        <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${enhancedVal}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Commercial talking point for sales reps */}
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-snug">
                        {benchmarkData.status === 'Lagging' ? (
                          <span className="text-red-900 font-medium">
                            <strong>Sales Gap:</strong> Storefront lags industry standard by {Math.abs(benchmarkData.delta)} pts. High risk of cart drop-off relative to competitors.
                          </span>
                        ) : benchmarkData.status === 'Outperforming' ? (
                          <span className="text-emerald-900 font-medium">
                            <strong>Sales Asset:</strong> Category exceeds standard benchmark by {benchmarkData.delta} pts. Reinforce this strength while closing remaining gaps.
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            <strong>On Par:</strong> Aligned with baseline standard. Enhancements will yield competitive conversion superiority.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION C: ACTION PRIORITISATION DISTRIBUTION */}
          {activeAudit && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-600" />
                Flaw Prioritisation & Remediation Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
                  <span className="text-xs font-extrabold uppercase text-red-700">Essential Fixes</span>
                  <div className="text-2xl font-black text-red-700">{activeAudit.summaryCounts.essential}</div>
                  <p className="text-[11px] text-red-900 leading-snug">
                    Critical conversion barriers (missing inline size guides, buried CTA controls, broken links).
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <span className="text-xs font-extrabold uppercase text-amber-700">Recommended Enhancements</span>
                  <div className="text-2xl font-black text-amber-700">{activeAudit.summaryCounts.recommended}</div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Conversion-rate lifts (filtering refinements, low-stock triggers, secondary product card hovers).
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                  <span className="text-xs font-extrabold uppercase text-blue-700">Content & Settings Updates</span>
                  <div className="text-2xl font-black text-blue-700">{activeAudit.summaryCounts.content}</div>
                  <p className="text-[11px] text-blue-900 leading-snug">
                    Merchandising polish (rich product bullet copy, delivery cut-off banners, sizing chart tables).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. MODAL: RAW DOM SIGNALS INSPECTOR */}
      {selectedPageForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#002157] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#00e5ff] tracking-wider block">DOM Scrape Signals</span>
                <h4 className="text-base font-bold truncate max-w-md">{selectedPageForModal.title || 'Page Details'}</h4>
              </div>
              <button
                onClick={() => setSelectedPageForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Scraped URL:</span>
                <div className="font-mono bg-slate-100 p-2 rounded-lg text-slate-800 break-all">{selectedPageForModal.url}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">Page Type</span>
                  <span className="font-bold text-slate-900 text-sm capitalize">{selectedPageForModal.pageType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">Load Duration</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedPageForModal.loadTimeMs}ms</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Headings (H1):</span>
                {selectedPageForModal.h1s && selectedPageForModal.h1s.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-0.5">
                    {selectedPageForModal.h1s.map((h, i) => (
                      <li key={i} className="text-slate-800 font-medium">{h}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No H1 tags detected on page.</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Buttons & CTAs Discovered:</span>
                {selectedPageForModal.buttons && selectedPageForModal.buttons.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPageForModal.buttons.map((b, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No standard buttons detected.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                  <span>Price Detected:</span>
                  <span className={selectedPageForModal.hasPrice ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {selectedPageForModal.hasPrice ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                  <span>Size Guide Detected:</span>
                  <span className={selectedPageForModal.hasSizeGuide ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {selectedPageForModal.hasSizeGuide ? 'Yes' : 'Missing'}
                  </span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                  <span>Canonical Tag:</span>
                  <span className={selectedPageForModal.hasCanonical ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {selectedPageForModal.hasCanonical ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                  <span>Mobile Viewport:</span>
                  <span className={selectedPageForModal.hasMetaViewport ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {selectedPageForModal.hasMetaViewport ? 'Valid' : 'Missing'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPageForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
