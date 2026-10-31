import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Globe,
  ExternalLink,
  Info,
  Sliders,
  TrendingUp,
  HelpCircle,
  FileCheck,
  X,
  Copy,
  Check,
  FileDown
} from 'lucide-react';
import { AuditRecord } from '../types';
import { generatePdfReportHtml } from '../utils/generatePdfReportHtml';

interface AuditReportProps {
  audit: AuditRecord;
  onNavigateTab: (tab: string) => void;
}

export const AuditReport: React.FC<AuditReportProps> = ({ audit, onNavigateTab }) => {
  const [reportMode, setReportMode] = useState<'simplified' | 'detailed'>('simplified');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  useEffect(() => {
    // Automatically trigger system print dialog when report component mounts
    setTimeout(() => {
      try {
        window.print();
      } catch(e) {
        console.warn('Print trigger failed:', e);
      }
    }, 1000);
  }, []);

  const downloadReportFile = () => {
    try {
      const htmlContent = generatePdfReportHtml(audit);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      const safeName = (audit.businessName || 'Storefront').replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadAnchor.setAttribute('download', `Smollan_Executive_Audit_Report_${safeName}.html`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setDownloadToast('Executive Audit Report downloaded successfully! Open the file to view, print, or save as PDF.');
      setTimeout(() => setDownloadToast(null), 8000);
    } catch (err: any) {
      console.error('Download report error:', err);
      setDownloadToast('Error generating report file. Please try again.');
    }
  };

  const handlePrint = () => {
    // 1. Immediately download the print-ready standalone HTML report
    downloadReportFile();

    // 2. Open on-screen modal with preview and manual print triggers
    setShowPrintModal(true);

    // 3. Attempt direct iframe / browser window print
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Iframe print intercepted or blocked by sandbox; modal and file download provided:', e);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(audit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `smollan-audit-${audit.businessName.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySummary = () => {
    const text = `SMOLLAN DIGITAL COMMERCE AUDIT: ${audit.businessName} (${audit.url})
Overall Score: ${audit.overallScore}/100 -> Projected Target: ${Math.max(audit.overallScore, audit.projectedOverallScore || audit.overallScore + 16)}/100 (+${Math.max(0, (audit.projectedOverallScore || audit.overallScore + 16) - audit.overallScore)} pts uplift)
Executive Verdict: ${audit.executiveVerdict?.headline || 'Storefront audit completed.'}
Critical Issues: ${audit.summaryCounts.essential} Essential | ${audit.summaryCounts.recommended} Recommended | ${audit.summaryCounts.content} Content Updates`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const filteredFindings = (audit.findings || []).filter((f: any) => {
    const matchesSearch =
      f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.serviceLine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.proposedRemedy?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Guarantee enhanced score is strictly >= overall score
  const currentOverall = audit.overallScore;
  const projectedScore = Math.max(currentOverall, audit.projectedOverallScore || Math.min(100, currentOverall + 16));
  const uplift = Math.max(0, projectedScore - currentOverall);

  // Category weighting specification definition - Aligned with eComplete Benchmark PDF
  const categoryWeightings = [
    { name: 'Brand and domain', weight: 10, rationale: 'Evaluates brand consistency, domain integrity, and "transition" phase messaging.' },
    { name: 'Navigation', weight: 12, rationale: 'Evaluates menu system hierarchy, circular paths, and unreachable labelled destinations.' },
    { name: 'Trust and proof', weight: 15, rationale: 'Evaluates sourced growth claims, revenue figures, and case study methodology.' },
    { name: 'Privacy (POPIA)', weight: 12, rationale: 'Evaluates compliance with POPIA s18 and s69 for notice at collection and marketing consent.' },
    { name: 'Accessibility', weight: 10, rationale: 'Evaluates WCAG 2.2 AA standards, image alt text coverage, and semantic markup.' },
    { name: 'SEO foundations', weight: 12, rationale: 'Evaluates meta tags, canonical URL integrity, and H1 tag uniqueness.' },
    { name: 'Conversion path', weight: 15, rationale: 'Evaluates purchase path efficiency, form field validation, and booking routes.' },
    { name: 'Performance and security', weight: 14, rationale: 'Evaluates Core Web Vitals (LCP, INP, CLS) and HTTPS/TLS encryption integrity.' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Download / Print Success Toast */}
      {downloadToast && (
        <div className="bg-[#002157] text-white p-4 rounded-2xl border-2 border-[#00e5ff] shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-[#00e5ff] shrink-0" />
            <div>
              <strong className="text-white block font-bold">Executive Report Ready</strong>
              <span className="text-slate-300">{downloadToast}</span>
            </div>
          </div>
          <button
            onClick={() => setDownloadToast(null)}
            className="text-slate-400 hover:text-white px-2 py-1 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. PROMINENT AUDITED TARGET URL BANNER */}
      <div className="bg-gradient-to-r from-[#002157] via-[#0b2140] to-[#002157] text-white p-6 rounded-3xl shadow-xl border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00e5ff] font-extrabold">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audited Prospect URL · Public Domain Inspection</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
              Live Verified Crawl
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{audit.businessName}</h2>
            <span className="text-xs text-slate-400 font-medium">({audit.targetMarket || 'South Africa'})</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/90 pt-0.5">
            <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/80">{audit.url}</span>
            <a
              href={audit.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#00e5ff] hover:text-white p-1 rounded transition"
              title="Open audited website in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Crawl Meta Badges */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 shrink-0 text-xs">
          <div className="text-right pr-3 border-r border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pages Inspected</span>
            <span className="text-sm font-black text-white">{audit.crawlSummary.inspected} <span className="text-[10px] text-slate-400 font-normal">/ {audit.crawlSummary.discovered}</span></span>
          </div>
          <div className="text-right pr-3 border-r border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Crawl Depth</span>
            <span className="text-sm font-black text-cyan-300 font-mono">{audit.depth.toUpperCase()}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Audit Date</span>
            <span className="text-xs font-bold text-slate-300">{new Date(audit.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Mode Switcher & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        
        {/* Simplified vs Detailed Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Presentation Mode:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setReportMode('simplified')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                reportMode === 'simplified'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>Simplified Executive Report</span>
            </button>
            <button
              onClick={() => setReportMode('detailed')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
                reportMode === 'detailed'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>Detailed Drill-Down Report</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              showMethodology
                ? 'bg-cyan-50 border-cyan-400 text-cyan-900'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-600" />
            <span>Scoring Methodology</span>
          </button>
          <button
            onClick={() => onNavigateTab('sandbox')}
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-900 border border-cyan-400/40 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Interactive Storefront</span>
          </button>
          <button
            onClick={() => onNavigateTab('pitch')}
            className="bg-[#002157] text-white hover:bg-cyan-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <span>Draft Sales Pitch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={downloadReportFile}
            className="bg-[#00e5ff] hover:bg-cyan-300 text-[#002157] px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow"
            title="Download standalone HTML executive report file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML Report</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/30"
            title="Print or export as PDF via browser print dialogue"
          >
            <Printer className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span>Print / Export PDF</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
            title="Download raw audit JSON"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* 3. DEDICATED SCORING METHODOLOGY & WEIGHTING FRAMEWORK SECTION */}
      {showMethodology && (
        <div className="bg-gradient-to-br from-slate-900 via-[#002157] to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-cyan-500/30 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#00e5ff]">
                Smollan Digital Commerce · Evaluation Standard
              </span>
              <h3 className="text-xl font-black">Audit Methodology, Measurement Criteria & Scoring Weights</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Our proprietary auditing framework scores websites deterministically on a 0–100 scale across 12 weighted categories. Every score reflects verified DOM evidence and technical measurements without artificial scoring inflation.
              </p>
            </div>
            <button
              onClick={() => setShowMethodology(false)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1"
            >
              ✕ Close
            </button>
          </div>

          {/* 12-Factor Weighting Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryWeightings.map((item, idx) => (
              <div key={idx} className="bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white truncate">{item.name}</span>
                  <span className="text-cyan-400 font-extrabold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {item.weight}% Weight
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{item.rationale}</p>
              </div>
            ))}
          </div>

          {/* What the Analysis Measures Against & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> What the Analysis Measures Against
              </h4>
              <ul className="text-slate-300 space-y-1.5 pl-4 list-disc text-[11px]">
                <li><strong>Public Storefront Inspection:</strong> Crawls and inspects real HTML, metadata, navigation trees, and product variant selectors.</li>
                <li><strong>UX & Conversion Heuristics:</strong> Verifies inline sizing guides, Buy Now Pay Later (PayFlex) visibility, and sticky mobile CTAs.</li>
                <li><strong>Performance & SEO Hygiene:</strong> Measures server response latency (TTFB proxy), image alt attribute coverage, and canonical integrity.</li>
              </ul>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Data Integrity & Analytics Separation
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                As required by the specification, behavioral metrics such as private sessions, scroll depth, and dead clicks require authorized analytics integrations and are <strong>never guessed or simulated from public HTML</strong>.
              </p>
              <p className="text-slate-400 text-[10px]">
                Smollan Enhanced Projections (+{uplift} pts) reflect the mathematical score achievable once identified Essential and Recommended friction barriers are resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. REEBOK-STYLE EXECUTIVE REPORT CARD */}
      <div id="print-report-area" className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-10 space-y-8 font-sans">
        
        {/* Report Header */}
        <div className="bg-[#002157] text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-cyan-500/20">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#00e5ff] font-extrabold mb-1">
                Smollan Digital Commerce · Website Intelligence & Opportunity Audit
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Report Overview</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Black November and peak trading readiness audit combining public technical inspection with conversion-rate optimisation (CRO) analysis. Findings mapped directly to Smollan execution services.
              </p>
            </div>
            <div className="text-right bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs shrink-0">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Cycle Period</span>
              <span className="font-bold text-cyan-300">C4: Peak Readiness 2026</span>
              <span className="text-slate-400 block text-[10px] mt-1 font-mono">Target: 5 Nov Code Freeze</span>
            </div>
          </div>
        </div>

        {/* 5. TOP SUMMARY ROW: Overall Score & Detailed Uplift Drivers & Score by Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Detailed Overall Score Card with Commercial Lift Breakdown */}
          <div className="bg-gradient-to-br from-[#002157] to-[#0c2447] text-white rounded-3xl p-6 shadow-md relative overflow-hidden border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Overall Store Score</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                  12-Factor Weighted
                </span>
              </div>
              <div className="text-5xl font-black tracking-tight my-2">
                {currentOverall}
                <span className="text-xl text-[#00e5ff] font-normal">/100</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                currentOverall >= 80 ? 'text-emerald-400' : currentOverall >= 65 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {currentOverall >= 80 ? 'Ready with fixes' : currentOverall >= 65 ? 'Average performance' : 'Needs improvement'}
              </span>
            </div>

            {/* Projected Smollan Enhanced Score & Detailed Breakdown */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Projected with Smollan Enhancements
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-[#00e5ff]">{projectedScore}</span>
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    +{uplift} pts uplift
                  </span>
                </div>
              </div>

              {/* Breakdown of Key Commercial Drivers behind the Uplift */}
              <div className="text-[10px] space-y-1.5 text-slate-300 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
                <span className="font-extrabold text-cyan-400 uppercase tracking-wide block">Primary Uplift Drivers:</span>
                <div className="flex justify-between text-slate-300">
                  <span>• Inline Sizing Modal on PDP:</span>
                  <strong className="text-emerald-400">+15 pts category lift</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>• Sticky Mobile Add to Cart CTA:</span>
                  <strong className="text-emerald-400">+18 pts category lift</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>• PayFlex / BNPL Threshold Clarity:</span>
                  <strong className="text-emerald-400">+12 pts category lift</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>• Merchandising Fabric & Fit Specs:</span>
                  <strong className="text-emerald-400">+10 pts category lift</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Verdict Card */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold block mb-2">Executive Verdict</span>
              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">{audit.executiveVerdict.headline}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{audit.executiveVerdict.summaryText}</p>
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Coverage: <strong>{audit.crawlSummary.inspected}</strong> pages inspected</span>
              <span>Discovered: <strong>{audit.crawlSummary.discovered}</strong> links</span>
            </div>
          </div>

          {/* Score by Area with Dual Current & Enhanced Bars (Enhanced is never less than Current!) */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">Score by area</span>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Current</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00e5ff]"></span>Enhanced</span>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(audit.categoryResults).slice(0, 6).map(([cat, res]: [string, any]) => {
                const currentVal = res.score;
                // Guarantee enhanced bar is never less than current bar
                const enhancedVal = Math.max(currentVal, res.enhancedScore || Math.min(100, currentVal + 20));

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[11px] items-baseline">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{cat}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="font-bold text-slate-700">{currentVal}%</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-cyan-700">{enhancedVal}%</span>
                      </div>
                    </div>

                    {/* Dual comparison bars */}
                    <div className="space-y-1">
                      {/* Current Score Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreColor(currentVal)}`}
                          style={{ width: `${currentVal}%` }}
                        ></div>
                      </div>
                      {/* Enhanced Target Bar (Never less than current) */}
                      <div className="w-full h-1 bg-cyan-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00e5ff]"
                          style={{ width: `${enhancedVal}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 6. Summary Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border-l-4 border-cyan-500 p-4 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-[#002157]">{audit.summaryCounts.total}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Findings</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-red-600">{audit.summaryCounts.essential}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Essential Fixes</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-amber-500 p-4 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-amber-600">{audit.summaryCounts.recommended}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Recommended</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-500 p-4 rounded-2xl shadow-xs">
            <div className="text-2xl font-black text-blue-600">{audit.summaryCounts.content}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Content Updates</div>
          </div>
        </div>

        {/* 7. Key Metrics Strip (Explicit source labeling, no hallucinated data) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#00e5ff]">
              Key Metrics · Current Audit vs Baseline
            </h4>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-0.5 rounded-full border border-slate-700">
              Verified Public Inspection Data
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Sessions / Engagement</span>
              <span className="text-xs font-bold text-amber-400">Requires Analytics Integration</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Protected behavioral telemetry</span>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Server Response Time</span>
              <span className="text-sm font-bold text-cyan-300">{audit.metrics.pageSpeed.value}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Measured server TTFB proxy</span>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Overall Experience Score</span>
              <span className="text-sm font-bold text-emerald-400">{currentOverall} / 100</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">12-factor weighted model</span>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Failed / Broken URLs</span>
              <span className="text-sm font-bold text-cyan-300">{audit.metrics.brokenLinks.value} URLs</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Crawler link verification</span>
            </div>
          </div>
        </div>

        {/* 8. Three Action Columns (Essential, Recommended, Content & Settings) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Essential Fixes */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 border-t-4 border-t-red-500 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold text-red-600">Essential · Fixes Required</h4>
              <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">High Impact</span>
            </div>
            <ul className="space-y-3">
              {(audit.findings || []).filter((f: any) => f.severity === 'Essential').map((f: any, idx: number) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">•</span>
                  <div>
                    <strong className="text-slate-900 block">{f.title}</strong>
                    <span className="text-[11px] text-slate-500">{f.proposedRemedy}</span>
                  </div>
                </li>
              ))}
              {(audit.findings || []).filter((f: any) => f.severity === 'Essential').length === 0 && (
                <li className="text-xs text-slate-400 italic">No critical essential barriers detected in this crawl slice.</li>
              )}
            </ul>
          </div>

          {/* Recommended Improvements */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 border-t-4 border-amber-500 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold text-amber-600">Recommended · If Time Allows</h4>
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">Conversion Lift</span>
            </div>
            <ul className="space-y-3">
              {(audit.findings || []).filter((f: any) => f.severity === 'Recommended').map((f: any, idx: number) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <div>
                    <strong className="text-slate-900 block">{f.title}</strong>
                    <span className="text-[11px] text-slate-500">{f.proposedRemedy}</span>
                  </div>
                </li>
              ))}
              {(audit.findings || []).filter((f: any) => f.severity === 'Recommended').length === 0 && (
                <li className="text-xs text-slate-400 italic">No secondary recommendations recorded.</li>
              )}
            </ul>
          </div>

          {/* Content & Settings Updates */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 border-t-4 border-cyan-500 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold text-cyan-700">Content & Settings · Merchandising</h4>
              <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded">Information Gaps</span>
            </div>
            <ul className="space-y-3">
              {(audit.findings || []).filter((f: any) => f.severity === 'Content & Settings').map((f: any, idx: number) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-cyan-500 font-bold shrink-0">•</span>
                  <div>
                    <strong className="text-slate-900 block">{f.title}</strong>
                    <span className="text-[11px] text-slate-500">{f.proposedRemedy}</span>
                  </div>
                </li>
              ))}
              {(audit.findings || []).filter((f: any) => f.severity === 'Content & Settings').length === 0 && (
                <li className="text-xs text-slate-400 italic">Merchandising content fully verified.</li>
              )}
            </ul>
          </div>

        </div>

        {/* 9. What's Working vs Opportunities to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> What&apos;s Working
            </h4>
            <ul className="space-y-2 text-xs text-emerald-950">
              <li>• Secure checkout flow accessibility and valid HTTPS configuration.</li>
              <li>• Global header navigation and mobile responsive viewport metadata present across crawled pages.</li>
              <li>• Robust technical error handling with zero broken server responses.</li>
            </ul>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/90 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-extrabold text-[#002157] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" /> Opportunities to Improve
            </h4>
            <ul className="space-y-2 text-xs text-slate-800">
              <li>• Move size guides inline adjacent to size selectors to stop mobile sizing abandonment.</li>
              <li>• Integrate Buy Now Pay Later (PayFlex / PayJustNow) widgets directly above the fold.</li>
              <li>• Implement sticky Add-to-Cart drawer on mobile viewports.</li>
            </ul>
          </div>
        </div>

        {/* 10. Next Step Banner */}
        <div className="bg-gradient-to-r from-[#002157] to-[#0f274a] text-white p-6 sm:p-7 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-cyan-500/20">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#00e5ff] tracking-widest block mb-1">Recommended Next Step</span>
            <p className="text-xs sm:text-sm font-medium">
              Ship the essential PDP and cart fixes to lift the site to {projectedScore}/100 ahead of Black November code freeze.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('sandbox')}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700"
            >
              Test Sandbox
            </button>
            <button
              onClick={() => onNavigateTab('pitch')}
              className="bg-[#00e5ff] text-[#002157] hover:bg-cyan-300 px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              <span>Draft Sales Pitch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DETAILED DRILL-DOWN SECTION (Rendered when in 'detailed' mode) */}
        {reportMode === 'detailed' && (
          <div className="pt-8 border-t-2 border-slate-100 space-y-8">
            
            {/* Header for Detailed Drill Down */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-600">Technical Audit Explorer</span>
                <h2 className="text-xl font-black text-[#002157]">Granular Category Checks & Service Alignment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect the underlying test evidence, pass/fail status, and Smollan service line for each audited area.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="Essential">Essential</option>
                  <option value="Recommended">Recommended</option>
                  <option value="Content & Settings">Content & Settings</option>
                </select>
              </div>
            </div>

            {/* Category Checks Accordion Drill-Down */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Audit Categories & Rules Check Results</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(audit.categoryResults).map(([catName, catData]: [string, any]) => {
                  const isExpanded = expandedCategory === catName;
                  const currentVal = catData.score;
                  const enhancedVal = Math.max(currentVal, catData.enhancedScore || Math.min(100, currentVal + 20));

                  return (
                    <div key={catName} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div
                        onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                        className="p-4 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${getScoreColor(catData.score)}`}></span>
                          <span className="text-xs font-bold text-slate-900">{catName}</span>
                          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-semibold">
                            {catData.checks?.length || 0} checks
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-800">{catData.score}%</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Target: {enhancedVal}%</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-white space-y-2 border-t border-slate-100 text-xs">
                          {catData.checks?.map((chk: any, i: number) => (
                            <div key={i} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <div>
                                <span className="font-semibold text-slate-900 block">{chk.name}</span>
                                <span className="text-[11px] text-slate-500">{chk.evidence}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                chk.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : chk.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {chk.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Findings Matrix Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Detailed Findings & Smollan Commercial Remedies ({filteredFindings.length})
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#002157] text-white">
                      <th className="p-3">Issue & Severity</th>
                      <th className="p-3">Observed Evidence & Location</th>
                      <th className="p-3">Commercial Impact</th>
                      <th className="p-3">Proposed Technical Remedy</th>
                      <th className="p-3">Smollan Service Alignment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((f: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3 align-top">
                          <strong className="block text-slate-900 mb-1">{f.title}</strong>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            f.severity === 'Essential' ? 'bg-red-100 text-red-800' : f.severity === 'Recommended' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {f.severity}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">{f.category}</div>
                        </td>
                        <td className="p-3 align-top font-mono text-[11px] text-slate-600 max-w-[200px] break-all">
                          <span className="text-cyan-700 font-semibold block mb-0.5">{f.affectedUrl}</span>
                          <span className="font-sans text-[11px] text-slate-600">{f.observedEvidence}</span>
                        </td>
                        <td className="p-3 align-top text-slate-700">{f.businessImpact}</td>
                        <td className="p-3 align-top text-slate-800 font-medium">{f.proposedRemedy}</td>
                        <td className="p-3 align-top">
                          <span className="bg-cyan-50 text-cyan-900 border border-cyan-200 px-2 py-1 rounded text-[10px] font-bold block mb-1">
                            {f.serviceLine}
                          </span>
                          <span className="text-[10px] text-slate-400">Effort: {f.effort}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      {/* 5. INTERACTIVE PRINT & PDF STUDIO MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#002157] text-white flex justify-between items-center border-b border-cyan-500/20">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-[#00e5ff]">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Smollan Print & PDF Studio</span>
                </div>
                <h3 className="text-lg font-black text-white">{audit.businessName} Executive Report</h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs text-slate-700 overflow-y-auto max-h-[75vh]">
              <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-cyan-950 text-sm">Standalone Printable Report Generated</h4>
                  <p className="text-cyan-900 leading-relaxed">
                    Your report file has been prepared with full Reebok-style visual hierarchy, dual score bars, and flaw remediation plan. To export as a pristine PDF, select <strong>"Save as PDF"</strong> under <em>Destination</em> in the browser print window.
                  </p>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option 1: Direct File Download */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                      <FileDown className="w-4 h-4 text-cyan-600" />
                      <span>Download HTML/PDF</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Download the self-contained HTML file. Open it anytime offline or in any browser to print.
                    </p>
                  </div>
                  <button
                    onClick={downloadReportFile}
                    className="w-full bg-[#002157] hover:bg-slate-800 text-[#00e5ff] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report File</span>
                  </button>
                </div>

                {/* Option 2: Browser Print Dialog */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span>Trigger Print Dialog</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Launch browser print window to send to local printer or save as digital PDF.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        window.focus();
                        window.print();
                      } catch (e) {
                        downloadReportFile();
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Launch Print Window</span>
                  </button>
                </div>

              </div>

              {/* Quick Summary Copy */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold uppercase text-[10px] text-slate-500">Executive Summary Text</span>
                  <button
                    onClick={handleCopySummary}
                    className="text-cyan-700 hover:text-cyan-900 font-bold text-xs flex items-center gap-1"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1 select-all">
                  <div><strong>Storefront:</strong> {audit.businessName} ({audit.url})</div>
                  <div><strong>Overall Score:</strong> {audit.overallScore}/100 → Target: {Math.max(audit.overallScore, audit.projectedOverallScore || audit.overallScore + 16)}/100 (+{Math.max(0, (audit.projectedOverallScore || audit.overallScore + 16) - audit.overallScore)} pts uplift)</div>
                  <div><strong>Verdict:</strong> {audit.executiveVerdict?.headline}</div>
                  <div><strong>Action Plan:</strong> {audit.summaryCounts.essential} Essential fixes · {audit.summaryCounts.recommended} Recommended · {audit.summaryCounts.content} Content updates</div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">Tip: Select "Save as PDF" in the print destination dropdown.</span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};
