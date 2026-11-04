import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  FileCheck2, 
  Scale, 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  Code2, 
  Globe, 
  ArrowUpRight,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AuditRecord, QaAuditReport, QaFinding, QaSeverity, QaFindingStatus } from '../types';

interface SourceQaAuditProps {
  currentAudit: AuditRecord | null;
  onNavigateTab?: (tab: string) => void;
}

export const SourceQaAudit: React.FC<SourceQaAuditProps> = ({ currentAudit, onNavigateTab }) => {
  const [report, setReport] = useState<QaAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [activeSheetTab, setActiveSheetTab] = useState<'all' | 'technical' | 'legal' | 'verification'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Manual source inspection input drawer
  const [isSourceInputOpen, setIsSourceInputOpen] = useState<boolean>(false);
  const [manualUrl, setManualUrl] = useState<string>(currentAudit?.url || '');
  const [manualHtml, setManualHtml] = useState<string>('');

  // Run audit against target or custom source
  const runQaAudit = async (targetUrl?: string, customHtml?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload: any = {};
      if (customHtml && customHtml.trim().length > 0) {
        payload.html = customHtml.trim();
        payload.url = targetUrl || currentAudit?.url || 'https://uploaded.local';
      } else if (targetUrl && targetUrl.trim().length > 0) {
        payload.url = targetUrl.trim();
      } else if (currentAudit?.url) {
        payload.url = currentAudit.url;
        payload.auditId = currentAudit.id;
      } else {
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/qa-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data: QaAuditReport = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('QA Source Audit failed:', err);
      setErrorMessage(err.message || 'Audit execution encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAudit?.url) {
      setManualUrl(currentAudit.url);
      runQaAudit(currentAudit.url);
    }
  }, [currentAudit?.id]);

  const handleDownloadExcel = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/qa-audit/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });

      if (!res.ok) {
        throw new Error('Failed to generate Excel workbook on server');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Technical-Website-QA-Audit-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Could not download Excel workbook.');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, refId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(refId);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Filter findings based on active view and search
  const filteredFindings = (report?.findings || []).filter((f) => {
    // Sheet tab filter
    if (activeSheetTab === 'technical' && f.findingClassification !== 'Technical observation') {
      return false;
    }
    if (activeSheetTab === 'legal' && f.category !== 'Legal and compliance' && f.category !== 'Promotions and campaigns') {
      return false;
    }
    if (activeSheetTab === 'verification' && f.findingClassification !== 'Requires live verification') {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && f.category !== selectedCategory) {
      return false;
    }

    // Severity filter
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) {
      return false;
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const match =
        f.refId.toLowerCase().includes(q) ||
        f.anomalyDescription.toLowerCase().includes(q) ||
        f.supportingEvidence.toLowerCase().includes(q) ||
        f.sourceLocation.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.whyAnomaly.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getSeverityBadge = (severity: QaSeverity) => {
    switch (severity) {
      case 'Critical':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-300">Critical</span>;
      case 'High':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-orange-100 text-orange-800 border border-orange-300">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">Medium</span>;
      case 'Low':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-300">Low</span>;
    }
  };

  const getClassificationBadge = (status: QaFindingStatus) => {
    switch (status) {
      case 'Confirmed anomaly':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">Confirmed Anomaly</span>;
      case 'Potential anomaly':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-800 border border-amber-200">Potential Anomaly</span>;
      case 'Technical observation':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-50 text-sky-800 border border-sky-200">Technical Observation</span>;
      case 'Requires live verification':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-50 text-purple-800 border border-purple-200">Requires Live Verification</span>;
    }
  };

  return (
    <div className="w-full bg-[#f8fafc] text-[#091b42] min-h-screen">
      {/* Executive QA Header */}
      <section className="bg-[#091b42] text-white border-b border-[#0f2866] pt-10 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(to right, #00e5ff 1px, #091b42 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-cyan-300">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Technical Website Auditor & QA Specialist</span>
              <span className="text-white/40">·</span>
              <span className="text-white">Page-Source & Inconsistency Register</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Systematic Source-Code QA & Anomaly Audit
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Examines live HTML, inline scripts, embedded JSON-LD metadata, legal compliance consistency, and promotional freshness across 12 rigorous QA categories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSourceInputOpen(!isSourceInputOpen)}
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>{isSourceInputOpen ? 'Hide Source Sandbox' : 'Inspect Custom HTML / URL'}</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={isExporting || !report || report.findings.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#00e5ff] hover:bg-white text-[#091b42] text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating .xlsx...' : 'Download Register (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Source Inspection Drawer / Sandbox */}
        {isSourceInputOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Code2 className="w-4 h-4 text-[#0f2866]" />
                <span>Page-Source Inspection Sandbox</span>
              </div>
              <span className="text-xs text-slate-400">
                Analyze active storefront, enter URL, or paste raw HTML
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Target Storefront URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://www.targetstore.com"
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0f2866]"
                  />
                  <button
                    onClick={() => runQaAudit(manualUrl, manualHtml)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#091b42] text-white rounded-lg text-xs font-bold hover:bg-[#0f2866] transition disabled:opacity-50"
                  >
                    {isLoading ? 'Auditing...' : 'Fetch & Audit'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Direct HTML Source Code Paste (Optional)
                </label>
                <textarea
                  value={manualHtml}
                  onChange={(e) => setManualHtml(e.target.value)}
                  placeholder="Paste <!DOCTYPE html>... or page source code here"
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0f2866]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => runQaAudit(manualUrl)}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Executive Summary Cards */}
        {report && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Findings</div>
              <div className="text-2xl font-black text-slate-900">{report.totalFindings}</div>
              <div className="text-[11px] text-slate-500">Across 12 QA categories</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-rose-200 shadow-sm space-y-1 bg-rose-50/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Confirmed Anomalies</span>
              </div>
              <div className="text-2xl font-black text-rose-700">{report.countsByStatus.confirmed}</div>
              <div className="text-[11px] text-slate-500">Proven defects in source code</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Potential Anomalies</span>
              </div>
              <div className="text-2xl font-black text-amber-800">{report.countsByStatus.potential}</div>
              <div className="text-[11px] text-slate-500">Suggested inconsistencies</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-sky-200 shadow-sm space-y-1 bg-sky-50/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Technical Observations</span>
              </div>
              <div className="text-2xl font-black text-sky-800">{report.countsByStatus.observation}</div>
              <div className="text-[11px] text-slate-500">Code structure & redundancies</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-purple-200 shadow-sm space-y-1 bg-purple-50/20 col-span-2 lg:col-span-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Requires Live Verification</span>
              </div>
              <div className="text-2xl font-black text-purple-800">{report.countsByStatus.requiresVerification}</div>
              <div className="text-[11px] text-slate-500">Requires runtime testing</div>
            </div>
          </div>
        )}

        {/* Severity Strip */}
        {report && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="font-bold text-slate-600 uppercase tracking-wider">Severity Distribution:</div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                <span>Critical: {report.countsBySeverity.critical}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-orange-100 text-orange-800 font-bold border border-orange-200">
                <span>High: {report.countsBySeverity.high}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                <span>Medium: {report.countsBySeverity.medium}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                <span>Low: {report.countsBySeverity.low}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Target: <strong className="text-slate-700">{report.targetUrl}</strong>
            </div>
          </div>
        )}

        {/* Sheet Tabs & Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Sheet Tab Switcher Bar */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'Complete Anomaly Register', count: report?.findings.length || 0 },
                { id: 'technical', label: 'Technical Findings', count: report?.countsByStatus.observation || 0 },
                { id: 'legal', label: 'Legal & Compliance', count: (report?.countsByCategory['Legal and compliance'] || 0) + (report?.countsByCategory['Promotions and campaigns'] || 0) },
                { id: 'verification', label: 'Verification Required', count: report?.countsByStatus.requiresVerification || 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSheetTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-t border-l border-r -mb-px flex items-center gap-2 ${
                    activeSheetTab === tab.id
                      ? 'bg-white text-[#091b42] border-slate-200 shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeSheetTab === tab.id ? 'bg-[#091b42] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="pb-3 text-xs text-slate-500 font-medium flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Matching Excel Workbook Sheet Specifications</span>
            </div>
          </div>

          {/* Table Filters & Search Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Ref ID, description, evidence, or location..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0f2866]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="Branding and identity">Branding and identity</option>
                <option value="Navigation and footer">Navigation and footer</option>
                <option value="Website content">Website content</option>
                <option value="Legal and compliance">Legal and compliance</option>
                <option value="Promotions and campaigns">Promotions and campaigns</option>
                <option value="External links">External links</option>
                <option value="Retailer references">Retailer references</option>
                <option value="Forms and third-party applications">Forms and third-party applications</option>
                <option value="SEO and metadata">SEO and metadata</option>
                <option value="Technical implementation">Technical implementation</option>
                <option value="Customer experience">Customer experience</option>
                <option value="Product and shopping experience">Product and shopping experience</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-slate-800">{filteredFindings.length}</strong> of {report?.findings.length || 0} findings
            </div>
          </div>

          {/* Register Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#091b42] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap">Ref ID</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Severity</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap">Category / Subcategory</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap">Source Location</th>
                  <th className="py-3 px-4 font-bold min-w-[200px]">Anomaly Description</th>
                  <th className="py-3 px-4 font-bold min-w-[220px]">Supporting Evidence</th>
                  <th className="py-3 px-4 font-bold min-w-[220px]">Why This Is An Anomaly</th>
                  <th className="py-3 px-4 font-bold min-w-[200px]">Impact & Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-5 h-5 text-cyan-600 animate-spin" />
                        <span>Conducting systematic source-code inspection...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-600">No matching anomalies found for selected criteria</p>
                        <p className="text-xs text-slate-400">Adjust your search term or select another category filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f, idx) => (
                    <tr 
                      key={f.refId} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Ref ID & Classification */}
                      <td className="py-3.5 px-3.5 align-top font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div>{f.refId}</div>
                        <div className="mt-1">{getClassificationBadge(f.findingClassification)}</div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        {getSeverityBadge(f.severity)}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-bold text-slate-900">{f.category}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{f.subcategory}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3.5 align-top font-mono text-[11px] text-slate-600 max-w-[160px] truncate" title={f.sourceLocation}>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {f.sourceLocation}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 align-top leading-relaxed text-slate-800 font-medium">
                        {f.anomalyDescription}
                      </td>

                      {/* Evidence */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="p-2 rounded bg-slate-900 text-cyan-300 font-mono text-[11px] relative group overflow-hidden max-h-24 overflow-y-auto">
                          <button
                            onClick={() => copyToClipboard(f.supportingEvidence, f.refId)}
                            className="absolute top-1 right-1 p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 transition"
                            title="Copy code quote"
                          >
                            {copiedRef === f.refId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <pre className="whitespace-pre-wrap font-mono">{f.supportingEvidence}</pre>
                        </div>
                      </td>

                      {/* Rationale */}
                      <td className="py-3.5 px-4 align-top text-slate-600 leading-relaxed text-[11px]">
                        {f.whyAnomaly}
                      </td>

                      {/* Impact & Recommendation */}
                      <td className="py-3.5 px-4 align-top space-y-1.5 text-[11px]">
                        <div>
                          <strong className="text-slate-800">Customer Impact:</strong>{' '}
                          <span className="text-slate-600">{f.customerImpact}</span>
                        </div>
                        <div>
                          <strong className="text-slate-800">Business Impact:</strong>{' '}
                          <span className="text-slate-600">{f.businessImpact}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-100">
                          <strong className="text-[#0f2866]">Remedy:</strong>{' '}
                          <span className="text-slate-700">{f.recommendedCorrectiveAction}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Audit Scope:</span>
              <span>12 Categories Checked</span>
              <span>·</span>
              <span>Classification Verified Against WCAG & Consumer Disclosure Benchmarks</span>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={isExporting || !report || report.findings.length === 0}
              className="text-[#0f2866] hover:underline font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Register with All 5 Sheets (.xlsx)</span>
            </button>
          </div>

        </div>

        {/* Audit Scope Reference Cards */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Systematic Scope Coverage & Methodological Limitations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict rules enforced during source examination to prevent false positive assumptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 font-bold block">1. Zero Fabrication Rule</strong>
              <p className="leading-relaxed">
                All identified anomalies are directly extracted from delivered HTML elements, metadata tags, inline script code, or embedded JSON payloads. No errors are hallucinated.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 font-bold block">2. Hidden Payloads & Configurations</strong>
              <p className="leading-relaxed">
                Backend JSON payloads and hidden configurations are never assumed to be visually displayed to shoppers; they are classified as Technical Observations or Require Live Verification.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 font-bold block">3. Excel Workbook Schema Alignment</strong>
              <p className="leading-relaxed">
                The downloadable Excel (.xlsx) file is generated server-side via Python, containing all 5 designated worksheets, frozen header panes, auto-filters, and conditional severity highlighting.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
