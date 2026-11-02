import React, { useState, useMemo } from 'react';
import {
  Target,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Search,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Award,
  DollarSign
} from 'lucide-react';
import { AuditRecord } from '../types';
import { calculateSeoForecast, SeoKeywordGapItem, MonthlyProjectionItem } from '../utils/seoForecasting';

interface CompetitiveGapProps {
  primaryAudit: AuditRecord;
  onNavigateTab?: (tab: string) => void;
}

export const CompetitiveGap: React.FC<CompetitiveGapProps> = ({ primaryAudit, onNavigateTab }) => {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [competitorAudit, setCompetitorAudit] = useState<AuditRecord | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Commercial Lever simulation states
  const [customConversionRate, setCustomConversionRate] = useState<number>(2.2); // 2.2%
  const [customAov, setCustomAov] = useState<number>(850); // R850
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'Transactional' | 'Commercial' | 'Opportunity'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(12); // default view 12th month milestone

  // Compute 12-month forecast using historical and crawled site metrics
  const forecast = useMemo(() => {
    return calculateSeoForecast(
      primaryAudit,
      customConversionRate / 100,
      customAov
    );
  }, [primaryAudit, customConversionRate, customAov]);

  const handleRunComparison = async (targetToCrawl?: string) => {
    const urlToTest = targetToCrawl || competitorUrl;
    if (!urlToTest) return;
    setIsAuditing(true);
    setAuditError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let cleanName = 'Competitor';
    try {
      cleanName = new URL(urlToTest.startsWith('http') ? urlToTest : `https://${urlToTest}`).hostname.replace('www.', '');
    } catch {
      cleanName = 'Competitor Store';
    }

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          url: urlToTest,
          businessName: cleanName,
          businessCategory: primaryAudit.businessCategory || 'Retail',
          targetMarket: primaryAudit.targetMarket || 'South Africa',
          primaryObjective: 'comparison',
          mode: 'comparison',
          depth: 'quick'
        })
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.audit) {
        setCompetitorAudit(data.audit);
      } else if (data.auditId) {
        // Poll for completion
        let attempts = 0;
        const poll = async () => {
          if (attempts > 30) {
            setIsAuditing(false);
            return;
          }
          attempts++;
          try {
            const statusRes = await fetch(`/api/audit/status/${data.auditId}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'complete' && statusData.result?.audit) {
              setCompetitorAudit(statusData.result.audit);
              setIsAuditing(false);
            } else if (statusData.status === 'failed') {
              setAuditError(statusData.error || 'Competitor evaluation failed.');
              setIsAuditing(false);
            } else {
              setTimeout(poll, 1500);
            }
          } catch {
            setTimeout(poll, 1500);
          }
        };
        poll();
      } else {
        setAuditError(data.error || 'Unable to audit competitor storefront.');
        setIsAuditing(false);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setAuditError(e.message || 'Competitive gap audit timed out or failed.');
      setIsAuditing(false);
    }
  };

  const filteredKeywords = forecast.keywordGaps.filter(k => {
    if (keywordFilter === 'Opportunity') return k.status === 'Opportunity';
    if (keywordFilter === 'Transactional') return k.intent === 'Transactional';
    if (keywordFilter === 'Commercial') return k.intent === 'Commercial';
    return true;
  });

  const primaryScore = primaryAudit.overallScore;
  const competitorScore = competitorAudit?.overallScore ?? 80;
  const scoreDiff = competitorAudit ? primaryScore - competitorScore : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      
      {/* 1. Header & Executive Breadcrumb */}
      <div className="bg-[#002157] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-cyan-500/25 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] uppercase font-extrabold tracking-widest text-[#00e5ff]">
              <Target className="w-3.5 h-3.5" />
              <span>Smollan Connected Commerce · Competitive Intelligence &amp; Growth Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Competitive Gap &amp; 12-Month Traffic Growth Forecasting
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Benchmark <strong className="text-white font-bold">{primaryAudit.businessName}</strong> ({primaryAudit.url}) against direct retail rivals, uncover high-intent commercial keyword gaps, and project compounding 12-month organic revenue uplift.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 flex items-center gap-4 shrink-0 shadow-inner">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Storefront</span>
              <span className="text-2xl font-black text-[#00e5ff]">{primaryScore}<span className="text-xs text-slate-400 font-normal">/100</span></span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Smollan Target</span>
              <span className="text-2xl font-black text-emerald-400">{primaryAudit.projectedOverallScore || 92}<span className="text-xs text-emerald-600 font-normal">/100</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADVANCED 12-MONTH SEO KEYWORD GAP & TRAFFIC GROWTH FORECASTING MODULE */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Module Title & Key Statistics Strip */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
              <span>Actionable 12-Month Traffic &amp; Revenue Growth Model</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Actionable 12-Month Organic Traffic &amp; Commercial Projections
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Calibrated from crawled DOM scale, SEO hygiene ({forecast.seoHealthScore}/100), and Core Web Vitals latency.
            </p>
          </div>

          <div className="bg-[#002157] text-white p-4 rounded-2xl border border-cyan-500/30 flex items-center gap-5 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#00e5ff] block">Annual Organic Revenue Gain</span>
              <span className="text-xl sm:text-2xl font-black text-white">{forecast.formattedTotalRevenue}</span>
            </div>
            <div className="w-px h-9 bg-white/20" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Traffic Uplift</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">+{forecast.trafficUpliftPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Interactive Commercial Lever Controls for C-Suite Presentations */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#002157]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Interactive Commercial Levers &amp; ROI Simulator
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Adjust levers to model scenario impact during client pitch meetings.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">eCommerce Conversion Rate:</span>
                <span className="font-mono font-black text-[#002157] text-sm">{customConversionRate}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.5"
                step="0.1"
                value={customConversionRate}
                onChange={(e) => setCustomConversionRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Retail median: 2.2% · Top-tier standard: 3.8%</span>
            </div>

            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Average Order Value (AOV):</span>
                <span className="font-mono font-black text-[#002157] text-sm">R {customAov}</span>
              </div>
              <input
                type="range"
                min="350"
                max="2500"
                step="50"
                value={customAov}
                onChange={(e) => setCustomAov(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Average basket size across South African retail</span>
            </div>

            <div className="bg-gradient-to-br from-[#002157] to-[#0c2447] text-white p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#00e5ff] block">Net New Annual Orders</span>
                <span className="text-2xl font-black">{forecast.totalAnnualOrders.toLocaleString('en-ZA')}</span>
              </div>
              <span className="text-[10px] text-slate-300">
                +{forecast.totalAnnualIncrementalVisits.toLocaleString('en-ZA')} incremental organic visits unlocked
              </span>
            </div>
          </div>
        </div>

        {/* 12-Month SVG Traffic Growth Trajectory Visualizer */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              <span>12-Month Cumulative Organic Traffic Growth Curve</span>
            </h4>
            <span className="text-[10px] font-semibold text-slate-400">M1 Status-Quo vs M12 Smollan Accelerated Target</span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-inner space-y-4">
            {/* SVG Visual Chart */}
            <div className="w-full h-48 sm:h-56 relative">
              <svg viewBox="0 0 1000 240" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="1000" y2="40" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="160" x2="1000" y2="160" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="220" x2="1000" y2="220" stroke="#475569" opacity="0.6" />

                {/* Baseline Flat Line */}
                <path
                  d="M 20,200 L 980,200"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Growth Area & Curve */}
                <path
                  d={`M 20,200 
                     C 220,190 320,165 480,120 
                     C 640,75 800,45 980,35 
                     L 980,220 L 20,220 Z`}
                  fill="url(#growthGradient)"
                />

                <path
                  d={`M 20,200 
                     C 220,190 320,165 480,120 
                     C 640,75 800,45 980,35`}
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="3.5"
                />

                {/* Data Points */}
                {forecast.monthlyBreakdown.map((m, idx) => {
                  const x = 20 + idx * (960 / 11);
                  const progress = (m.organicVisits - forecast.currentMonthlyOrganicTraffic) / (forecast.projectedMonthlyOrganicTraffic - forecast.currentMonthlyOrganicTraffic || 1);
                  const y = 200 - Math.min(165, progress * 165);
                  const isSelected = selectedMonth === m.month;

                  return (
                    <g key={m.month} className="cursor-pointer" onClick={() => setSelectedMonth(m.month)}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#00e5ff' : '#002157'}
                        stroke="#00e5ff"
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <text
                        x={x}
                        y={235}
                        fill={isSelected ? '#00e5ff' : '#94a3b8'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        M{m.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Month Detail Strip */}
            {forecast.monthlyBreakdown[selectedMonth - 1] && (
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#00e5ff] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      {forecast.monthlyBreakdown[selectedMonth - 1].phase} · {forecast.monthlyBreakdown[selectedMonth - 1].phaseTitle}
                    </span>
                    <span className="text-xs font-bold text-white">Month {selectedMonth} Focus</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {forecast.monthlyBreakdown[selectedMonth - 1].focusMilestone}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Organic Traffic</span>
                    <strong className="text-white text-sm">{forecast.monthlyBreakdown[selectedMonth - 1].organicVisits.toLocaleString('en-ZA')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Orders</span>
                    <strong className="text-emerald-400 text-sm">+{forecast.monthlyBreakdown[selectedMonth - 1].projectedOrders.toLocaleString('en-ZA')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cumulative Lift</span>
                    <strong className="text-cyan-300 text-sm">R {forecast.monthlyBreakdown[selectedMonth - 1].cumulativeRevenue.toLocaleString('en-ZA')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 12-Month Progression Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              12-Month Milestone Roadmap &amp; Revenue Projection Schedule
            </h4>
            <span className="text-[10px] font-semibold text-slate-500">
              Deterministic Trajectory Based on Technical Indexation Timing
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#002157] text-white text-[10px] uppercase tracking-wider font-extrabold">
                  <th className="p-3">Timeline</th>
                  <th className="p-3">Implementation Phase &amp; Milestones</th>
                  <th className="p-3 text-center">Projected Visits</th>
                  <th className="p-3 text-center">Net New Visits</th>
                  <th className="p-3 text-center">Est. Orders</th>
                  <th className="p-3 text-right">Cumulative Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecast.monthlyBreakdown.map((m) => (
                  <tr
                    key={m.month}
                    onClick={() => setSelectedMonth(m.month)}
                    className={`cursor-pointer transition ${
                      selectedMonth === m.month ? 'bg-cyan-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3 align-top font-bold text-slate-900 font-mono whitespace-nowrap">
                      Month {m.month}
                    </td>
                    <td className="p-3 align-top">
                      <span className="inline-block text-[9px] uppercase font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded mb-1">
                        {m.phase}
                      </span>
                      <p className="text-slate-700 leading-snug">{m.focusMilestone}</p>
                    </td>
                    <td className="p-3 align-top text-center font-mono font-bold text-slate-900">
                      {m.organicVisits.toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3 align-top text-center font-mono text-emerald-600 font-bold">
                      +{m.incrementalVisits.toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3 align-top text-center font-mono text-slate-700">
                      {m.projectedOrders.toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3 align-top text-right font-mono font-bold text-cyan-900">
                      R {m.cumulativeRevenue.toLocaleString('en-ZA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Advanced SEO Keyword Gap Analysis Table */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-600" />
                <span>High-Intent Commercial Keyword Gap Analysis</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Targeting high-converting commercial keywords where competitors or category leaders currently rank.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Filter Intent:</span>
              <button
                onClick={() => setKeywordFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  keywordFilter === 'all' ? 'bg-[#002157] text-[#00e5ff]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({forecast.keywordGaps.length})
              </button>
              <button
                onClick={() => setKeywordFilter('Transactional')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  keywordFilter === 'Transactional' ? 'bg-cyan-700 text-white' : 'bg-cyan-50 text-cyan-800'
                }`}
              >
                Transactional
              </button>
              <button
                onClick={() => setKeywordFilter('Commercial')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  keywordFilter === 'Commercial' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800'
                }`}
              >
                Commercial
              </button>
              <button
                onClick={() => setKeywordFilter('Opportunity')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  keywordFilter === 'Opportunity' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                Top Opportunities
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#002157] text-white text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="p-3.5">Keyword &amp; Intent</th>
                  <th className="p-3.5 text-center">Search Volume</th>
                  <th className="p-3.5 text-center">Current Rank</th>
                  <th className="p-3.5 text-center">Competitor Rank</th>
                  <th className="p-3.5 text-center">Smollan Target</th>
                  <th className="p-3.5 text-center">Difficulty</th>
                  <th className="p-3.5 text-right">Traffic Lift</th>
                  <th className="p-3.5">Actionable Remedy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKeywords.map((kpi, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 align-top">
                      <strong className="block text-slate-900 font-bold">{kpi.keyword}</strong>
                      <span className={`inline-block text-[9px] uppercase font-extrabold px-2 py-0.5 rounded mt-1 ${
                        kpi.intent === 'Transactional' ? 'bg-emerald-100 text-emerald-800' : kpi.intent === 'Commercial' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {kpi.intent}
                      </span>
                    </td>
                    <td className="p-3.5 text-center align-top font-mono text-slate-700 font-bold">
                      {kpi.searchVolume.toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3.5 text-center align-top font-mono font-bold text-amber-600">
                      #{kpi.currentRank}
                    </td>
                    <td className="p-3.5 text-center align-top font-mono font-bold text-blue-600">
                      #{kpi.competitorRank ?? 3}
                    </td>
                    <td className="p-3.5 text-center align-top font-mono font-black text-emerald-600 text-sm">
                      #{kpi.targetRank}
                    </td>
                    <td className="p-3.5 text-center align-top">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        kpi.difficulty === 'Low' ? 'bg-emerald-100 text-emerald-800' : kpi.difficulty === 'Medium' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {kpi.difficulty}
                      </span>
                    </td>
                    <td className="p-3.5 text-right align-top font-mono font-black text-cyan-800">
                      +{kpi.estimatedTrafficUplift.toLocaleString('en-ZA')} /mo
                    </td>
                    <td className="p-3.5 align-top max-w-xs text-slate-600 leading-snug">
                      {kpi.actionableRemedy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* 4. LIVE COMPETITOR PARALLEL AUDIT RUNNER */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-[#002157] bg-slate-100 px-3 py-1 rounded-full mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              <span>Real-Time Competitor Crawl Engine</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Run Parallel Side-by-Side Audit Against a Competitor Storefront
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any direct retail competitor URL to evaluate head-to-head on the 12-factor standard.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="e.g. https://www.superbalist.com or https://www.takealot.com"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
          />
          <button
            onClick={() => handleRunComparison()}
            disabled={isAuditing || !competitorUrl.trim()}
            className="px-6 py-3 bg-[#002157] text-[#00e5ff] rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Zap className="w-4 h-4 text-[#00e5ff]" />
            <span>{isAuditing ? 'Crawling Competitor...' : 'Run Parallel Competitor Audit'}</span>
          </button>
        </div>

        {auditError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{auditError}</span>
          </div>
        )}

        {/* Side-by-Side Scorecards */}
        {competitorAudit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in duration-300">
            {/* Primary Audited Storefront */}
            <div className="bg-gradient-to-br from-[#002157] to-[#0c2447] text-white p-6 rounded-3xl border border-cyan-500/30 shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">Primary Storefront</span>
                  <h4 className="text-xl font-black text-white">{primaryAudit.businessName}</h4>
                  <span className="text-xs text-slate-300 font-mono mt-0.5 block truncate max-w-xs">{primaryAudit.url}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#00e5ff]">{primaryScore}</span>
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-700 text-xs">
                {Object.entries(primaryAudit.categoryResults).slice(0, 5).map(([cat, res]: [string, any]) => (
                  <div key={cat} className="flex justify-between items-center text-slate-300">
                    <span className="truncate max-w-[180px]">{cat}:</span>
                    <strong className="text-white font-mono">{res.score}%</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Storefront */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-300 shadow-md space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 block tracking-wider">Direct Competitor</span>
                  <h4 className="text-xl font-black text-slate-900">{competitorAudit.businessName}</h4>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block truncate max-w-xs">{competitorAudit.url}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900">{competitorScore}</span>
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                {Object.entries(competitorAudit.categoryResults).slice(0, 5).map(([cat, res]: [string, any]) => (
                  <div key={cat} className="flex justify-between items-center text-slate-600">
                    <span className="truncate max-w-[180px]">{cat}:</span>
                    <strong className="text-slate-900 font-mono">{res.score}%</strong>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-700">Competitive Advantage:</span>
                <span className={`font-mono font-bold ${
                  scoreDiff >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {scoreDiff >= 0 ? `+${scoreDiff} pts Ahead` : `${scoreDiff} pts Gap to Close`}
                </span>
              </div>
            </div>
          </div>
        )}

      </section>

    </div>
  );
};
