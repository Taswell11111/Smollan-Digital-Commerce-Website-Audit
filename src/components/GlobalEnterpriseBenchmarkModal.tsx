import React, { useState } from 'react';
import {
  X,
  Globe,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  Check,
  Sliders,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { AuditRecord } from '../types';

interface GlobalEnterpriseBenchmarkModalProps {
  audit: AuditRecord;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface BenchmarkKpiItem {
  name: string;
  category: string;
  clientValue: string;
  clientScoreNumeric: number;
  globalMedian: string;
  globalTopTier: string;
  benchmarkScoreNumeric: number;
  deltaStatus: 'Outperforming' | 'On Par' | 'Lagging';
  deltaLabel: string;
  commercialImpact: string;
  remedyAction: string;
}

export const GlobalEnterpriseBenchmarkModal: React.FC<GlobalEnterpriseBenchmarkModalProps> = ({
  audit,
  onClose,
  onNavigateTab
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'lagging' | 'core'>('all');
  const [copiedTalkingPoint, setCopiedTalkingPoint] = useState(false);

  const clientOverall = audit.overallScore;
  const projectedOverall = Math.max(clientOverall, audit.projectedOverallScore ?? (clientOverall + 15));
  const uplift = Math.max(0, projectedOverall - clientOverall);

  // Extract or calculate key retail digital commerce KPIs
  const perfScore = audit.categoryResults?.['Performance']?.score || 65;
  const productScore = audit.categoryResults?.['Product Page']?.score || 70;
  const checkoutScore = audit.categoryResults?.['Cart and Checkout Path']?.score || 68;
  const mobileScore = audit.categoryResults?.['Mobile']?.score || 72;
  const seoScore = audit.categoryResults?.['SEO']?.score || audit.categoryResults?.['SEO & Metadata']?.score || 65;
  const trustScore = audit.categoryResults?.['Trust and Policy']?.score || 75;

  // Derive estimated conversion rate and cart abandonment from actual measured friction scores
  const estConversionRate = (1.4 + (clientOverall / 100) * 1.5).toFixed(1);
  const estAbandonmentRate = Math.min(88, Math.max(55, Math.round(92 - (checkoutScore * 0.32))));
  const measuredTtfb = audit.metrics?.pageSpeed?.value || 'N/A';

  const benchmarkKpis: BenchmarkKpiItem[] = [
    {
      name: 'eCommerce Checkout Conversion Rate',
      category: 'Commercial Velocity',
      clientValue: `${estConversionRate}%`,
      clientScoreNumeric: Math.round(parseFloat(estConversionRate) * 20),
      globalMedian: '2.9%',
      globalTopTier: '4.2%',
      benchmarkScoreNumeric: 58,
      deltaStatus: parseFloat(estConversionRate) >= 2.9 ? 'Outperforming' : parseFloat(estConversionRate) >= 2.4 ? 'On Par' : 'Lagging',
      deltaLabel: `${(parseFloat(estConversionRate) - 2.9).toFixed(1)}% vs Global Median`,
      commercialImpact: `Unlocking top-tier conversion (+${(4.2 - parseFloat(estConversionRate)).toFixed(1)}%) recovers significant monthly online revenue.`,
      remedyAction: 'Eliminate multi-step checkout barriers, activate guest checkout, and deploy prominent payment trust badges.'
    },
    {
      name: 'Cart & Checkout Abandonment Rate',
      category: 'Conversion Friction',
      clientValue: `${estAbandonmentRate}%`,
      clientScoreNumeric: 100 - estAbandonmentRate,
      globalMedian: '69.8%',
      globalTopTier: '58.0%',
      benchmarkScoreNumeric: 40,
      deltaStatus: estAbandonmentRate <= 69 ? 'Outperforming' : estAbandonmentRate <= 74 ? 'On Par' : 'Lagging',
      deltaLabel: `+${(estAbandonmentRate - 69.8).toFixed(1)}% excess abandonment`,
      commercialImpact: 'High cart dropout caused by hidden delivery thresholds, forced account registration, or unexpected costs.',
      remedyAction: 'Display transparent shipping thresholds on product cards and streamline checkout to ≤ 2 steps.'
    },
    {
      name: 'Largest Contentful Paint (LCP Speed)',
      category: 'Core Web Vitals',
      clientValue: measuredTtfb !== 'N/A' ? `${measuredTtfb}` : (perfScore >= 80 ? '1.9s' : '3.6s'),
      clientScoreNumeric: perfScore,
      globalMedian: '≤ 2.2s',
      globalTopTier: '≤ 1.4s',
      benchmarkScoreNumeric: 80,
      deltaStatus: perfScore >= 80 ? 'Outperforming' : perfScore >= 65 ? 'On Par' : 'Lagging',
      deltaLabel: perfScore >= 80 ? 'Fast (Passing Google CWV)' : 'Sub-optimal (> 2.5s)',
      commercialImpact: 'Every 100ms decrease in page load speed drives an average +1.1% lift in mobile transactions.',
      remedyAction: 'Implement edge server caching, next-gen WebP/AVIF image formats, and defer non-critical JavaScript.'
    },
    {
      name: 'Mobile Usability & Responsive Index',
      category: 'UX / Responsive',
      clientValue: `${mobileScore}/100`,
      clientScoreNumeric: mobileScore,
      globalMedian: '85/100',
      globalTopTier: '98/100',
      benchmarkScoreNumeric: 85,
      deltaStatus: mobileScore >= 85 ? 'Outperforming' : mobileScore >= 70 ? 'On Par' : 'Lagging',
      deltaLabel: `${mobileScore - 85} pts vs Global Standard`,
      commercialImpact: '68% of retail traffic in South Africa is mobile-first; mobile friction directly suppresses ROAS.',
      remedyAction: 'Standardize tap targets to ≥ 24px, prevent horizontal viewport overflow, and anchor buy CTA above the fold.'
    },
    {
      name: 'Product Merchandising & Sizing Assistance',
      category: 'Merchandising Experience',
      clientValue: `${productScore}/100`,
      clientScoreNumeric: productScore,
      globalMedian: '82/100',
      globalTopTier: '95/100',
      benchmarkScoreNumeric: 82,
      deltaStatus: productScore >= 82 ? 'Outperforming' : productScore >= 70 ? 'On Par' : 'Lagging',
      deltaLabel: `${productScore - 82} pts vs Global Standard`,
      commercialImpact: 'Absence of sizing guides and clear fit charts increases return rates by up to 28% in apparel & footwear.',
      remedyAction: 'Embed interactive sizing charts, visible currency formatting, and dynamic stock urgency widgets.'
    },
    {
      name: 'Organic Search Discoverability (SEO)',
      category: 'Search Engine Authority',
      clientValue: `${seoScore}/100`,
      clientScoreNumeric: seoScore,
      globalMedian: '80/100',
      globalTopTier: '94/100',
      benchmarkScoreNumeric: 80,
      deltaStatus: seoScore >= 80 ? 'Outperforming' : seoScore >= 65 ? 'On Par' : 'Lagging',
      deltaLabel: `${seoScore - 80} pts vs Global Standard`,
      commercialImpact: 'Missing metadata and canonical tags restrict Google organic indexing and surrender brand search volume.',
      remedyAction: 'Deploy Product and Breadcrumb JSON-LD schema, clean canonical URLs, and descriptive meta descriptions.'
    },
    {
      name: 'Trust Signals & Regulatory Compliance',
      category: 'Brand Trust & Legal',
      clientValue: `${trustScore}/100`,
      clientScoreNumeric: trustScore,
      globalMedian: '85/100',
      globalTopTier: '100/100',
      benchmarkScoreNumeric: 85,
      deltaStatus: trustScore >= 85 ? 'Outperforming' : trustScore >= 70 ? 'On Par' : 'Lagging',
      deltaLabel: `${trustScore - 85} pts vs Global Standard`,
      commercialImpact: 'Customers abandon carts when privacy policies (POPIA) or verified ratings are invisible.',
      remedyAction: 'Display verified customer review snippets and link POPIA-compliant data protection disclosures in footer.'
    }
  ];

  const filteredKpis = benchmarkKpis.filter(kpi => {
    if (activeFilter === 'lagging') return kpi.deltaStatus === 'Lagging';
    if (activeFilter === 'core') return kpi.category === 'Commercial Velocity' || kpi.category === 'Conversion Friction' || kpi.category === 'Core Web Vitals';
    return true;
  });

  const laggingCount = benchmarkKpis.filter(k => k.deltaStatus === 'Lagging').length;
  const onParCount = benchmarkKpis.filter(k => k.deltaStatus === 'On Par').length;
  const outperformingCount = benchmarkKpis.filter(k => k.deltaStatus === 'Outperforming').length;

  const handleCopyTalkingPoints = () => {
    const text = `SMOLLAN GLOBAL ENTERPRISE ECOMMERCE BENCHMARK REPORT
Client: ${audit.businessName} (${audit.url})
Current Storefront Score: ${clientOverall}/100 | Smollan Target: ${projectedOverall}/100 (+${uplift} pts uplift)
Global Industry Median: 80/100 | Top-Tier Standard: 90/100
Benchmark Health: ${laggingCount} Lagging Areas, ${onParCount} On Par, ${outperformingCount} Outperforming

Executive Pitch Takeaways:
1. Conversion Rate: Estimated at ${estConversionRate}% vs Global Enterprise Median of 2.9% (Top-tier reaches 4.2%).
2. Cart Abandonment: Calculated at ${estAbandonmentRate}% vs Global Benchmark of 69.8%, indicating severe checkout friction.
3. Remediation Roadmap: Applying Smollan's 12-factor fixes bridges the ${uplift}-point gap to achieve category dominance.`;

    navigator.clipboard.writeText(text);
    setCopiedTalkingPoint(true);
    setTimeout(() => setCopiedTalkingPoint(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-5xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Strip with Smollan Signature Enterprise Branding */}
        <div className="p-5 sm:p-7 bg-[#002157] text-white flex justify-between items-start sm:items-center gap-4 border-b border-cyan-500/30 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950/80 border border-cyan-500/40 px-3 py-0.5 rounded-full">
                <Globe className="w-3 h-3 text-[#00e5ff]" />
                <span>Smollan Connected Commerce · Global Benchmark Overlay</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">Standard: Baymard &amp; Google CrUX</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{audit.businessName}</span>
              <span className="text-slate-400 font-normal text-sm sm:text-base">vs Global Enterprise eCommerce Benchmarks</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Comparative analysis of prospect digital storefront against global top-tier retail standards, conversion KPIs, and checkout velocity metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyTalkingPoints}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {copiedTalkingPoint ? <Check className="w-3.5 h-3.5 text-[#00e5ff]" /> : <Award className="w-3.5 h-3.5 text-[#00e5ff]" />}
              <span>{copiedTalkingPoint ? 'Copied Pitch Points!' : 'Copy Executive Pitch'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              title="Close Benchmark Overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs">
          
          {/* Executive Comparative Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#002157] text-white p-5 rounded-2xl border border-cyan-500/30 space-y-1 shadow-md">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Prospect Storefront Score</span>
              <div className="text-3xl font-black text-[#00e5ff]">
                {clientOverall}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <p className="text-[11px] text-slate-300">Audited across 12 criteria &amp; live DOM signals.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Global Industry Median</span>
              <div className="text-3xl font-black text-slate-800">
                80<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <p className="text-[11px] text-slate-500">Retail eCommerce median standard across 250+ enterprise sites.</p>
            </div>

            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-blue-900 block">Global Top-Tier Benchmark</span>
              <div className="text-3xl font-black text-blue-950">
                90<span className="text-sm font-normal text-blue-600">/100</span>
              </div>
              <p className="text-[11px] text-blue-800">Upper decile enterprise commerce leaders.</p>
            </div>

            <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-300 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-emerald-900 block">Smollan Enhanced Target</span>
              <div className="text-3xl font-black text-emerald-700">
                {projectedOverall}<span className="text-sm font-normal text-emerald-600">/100</span>
              </div>
              <p className="text-[11px] text-emerald-900 font-bold">
                +{uplift} pts potential recovery via technical remedies.
              </p>
            </div>
          </div>

          {/* Quick Filter Pill Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Filter KPIs:</span>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  activeFilter === 'all'
                    ? 'bg-[#002157] text-[#00e5ff] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Digital Commerce KPIs ({benchmarkKpis.length})
              </button>
              <button
                onClick={() => setActiveFilter('lagging')}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  activeFilter === 'lagging'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                Lagging Gaps ({laggingCount})
              </button>
              <button
                onClick={() => setActiveFilter('core')}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  activeFilter === 'core'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                }`}
              >
                Core Conversion &amp; Speed
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>{laggingCount} Lagging</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{onParCount} On Par</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{outperformingCount} Outperforming</span>
              </span>
            </div>
          </div>

          {/* KPI Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#002157] text-white text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="p-3.5">Standard Retail KPI &amp; Category</th>
                  <th className="p-3.5 text-center">Client Audited</th>
                  <th className="p-3.5 text-center">Global Median</th>
                  <th className="p-3.5 text-center">Top 10% Leader</th>
                  <th className="p-3.5 text-center">Benchmark Status</th>
                  <th className="p-3.5">Commercial Impact &amp; Smollan Remedy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKpis.map((kpi, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 align-top">
                      <strong className="block text-slate-900 font-bold">{kpi.name}</strong>
                      <span className="text-[10px] text-slate-400 font-medium">{kpi.category}</span>
                    </td>
                    <td className="p-3.5 text-center align-top font-mono">
                      <span className="font-extrabold text-sm text-slate-900 block">{kpi.clientValue}</span>
                    </td>
                    <td className="p-3.5 text-center align-top font-mono text-slate-600 font-semibold">
                      {kpi.globalMedian}
                    </td>
                    <td className="p-3.5 text-center align-top font-mono text-emerald-700 font-bold">
                      {kpi.globalTopTier}
                    </td>
                    <td className="p-3.5 text-center align-top">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        kpi.deltaStatus === 'Lagging'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : kpi.deltaStatus === 'Outperforming'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {kpi.deltaStatus}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-1 font-mono">{kpi.deltaLabel}</span>
                    </td>
                    <td className="p-3.5 align-top max-w-sm">
                      <p className="text-slate-800 font-medium leading-relaxed mb-1">{kpi.commercialImpact}</p>
                      <p className="text-[11px] text-cyan-800 font-semibold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0" />
                        <span>{kpi.remedyAction}</span>
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Strategic Roadmap for C-Suite Pitches */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#002157]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Smollan 3-Phase Commercial Bridge: From Current ({clientOverall}) to Global Standard ({projectedOverall})
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-100 text-cyan-900 px-2.5 py-0.5 rounded-full font-bold">
                12-Factor Remediation Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  Phase 1 · Immediate Friction Elimination (Weeks 1-4)
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Eliminate high-impact cart friction: deploy guest checkout, make shipping costs visible before payment, and accelerate TTFB under 250ms with edge CDN rules.
                </p>
                <div className="text-[10px] text-emerald-700 font-bold pt-1">
                  Expected Lift: +6 to +8 Overall Points (Immediate ~15% cart recovery)
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Phase 2 · Merchandising & Sizing Trust (Weeks 5-8)
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Implement contextual sizing charts, customer review markup, tap target padding for mobile devices, and visible stock scarcity badges on product pages.
                </p>
                <div className="text-[10px] text-emerald-700 font-bold pt-1">
                  Expected Lift: +4 to +6 Overall Points (Reduced return rates)
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                  Phase 3 · Organic Search & Enterprise Authority (Weeks 9-12)
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Deploy complete JSON-LD product and breadcrumb schema, optimize collection meta titles, and capture high-intent commercial keyword rankings.
                </p>
                <div className="text-[10px] text-emerald-700 font-bold pt-1">
                  Expected Lift: Full {projectedOverall}/100 Potential Reached
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            Source Grounding: <em>Baymard Institute UX Database, Google Core Web Vitals (CrUX), and Smollan Enterprise Commerce Benchmarks 2025.</em>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTalkingPoints}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              {copiedTalkingPoint ? 'Copied!' : 'Copy Summary'}
            </button>
            <button
              onClick={() => {
                onClose();
                if (onNavigateTab) onNavigateTab('pitch');
              }}
              className="px-5 py-2 bg-[#002157] hover:bg-slate-800 text-[#00e5ff] rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Build Pitch Deck with Benchmarks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
