import React from 'react';
import { TrendingUp, Search, BarChart3, Globe, Zap, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { AuditRecord } from '../types';
import { calculateSeoForecast } from '../utils/seoForecasting';

interface SeoGrowthForecastProps {
  audit: AuditRecord;
}

export const SeoGrowthForecast: React.FC<SeoGrowthForecastProps> = ({ audit }) => {
  const forecast = calculateSeoForecast(audit);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full mb-2 border border-cyan-200">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Global Enterprise eCommerce Benchmark & SEO Forecasting</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Advanced SEO Keyword Gap & Traffic Growth Forecast
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Projected organic search visibility, high-intent commercial keyword gaps, and estimated annual revenue uplift calibrated against global enterprise retail benchmarks.
          </p>
        </div>

        <div className="bg-[#002157] text-white px-5 py-3 rounded-2xl shadow-lg border border-cyan-500/30 flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#00e5ff] block">Projected Uplift</span>
            <span className="text-2xl font-black">+{forecast.trafficUpliftPercentage}%</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Annual Value</span>
            <span className="text-lg font-black text-emerald-300">{forecast.estimatedAnnualRevenueUplift}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Current Estimated Monthly Traffic</span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {forecast.currentMonthlyOrganicTraffic.toLocaleString('en-ZA')} <span className="text-xs font-normal text-slate-500">visits/mo</span>
          </div>
          <p className="text-[11px] text-slate-600">Based on indexed pages, meta coverage, and current SEO score ({forecast.seoHealthScore}/100).</p>
        </div>

        <div className="bg-cyan-50/70 p-5 rounded-2xl border border-cyan-200 space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-cyan-800 block">Projected Post-Remediation Traffic</span>
          <div className="text-2xl font-black text-cyan-950 font-mono">
            {forecast.projectedMonthlyOrganicTraffic.toLocaleString('en-ZA')} <span className="text-xs font-semibold text-cyan-700">visits/mo</span>
          </div>
          <p className="text-[11px] text-cyan-900">+{forecast.trafficUpliftPercentage}% surge after addressing technical and structural gaps.</p>
        </div>

        <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-blue-800 block">Global Enterprise Standard Benchmark</span>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {forecast.globalEnterpriseBenchmarkTraffic.toLocaleString('en-ZA')} <span className="text-xs font-semibold text-blue-700">visits/mo</span>
          </div>
          <p className="text-[11px] text-blue-900">Top-tier global retail benchmark standard for category dominance.</p>
        </div>
      </div>

      {/* Keyword Gap Matrix Table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-600" />
            <span>High-Intent Commercial Keyword Gap Analysis</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">
            {forecast.keywordGaps.length} Target Keywords Analyzed
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#002157] text-white text-[10px] uppercase tracking-wider font-extrabold">
                <th className="p-3.5">Target Keyword</th>
                <th className="p-3.5 text-center">Monthly Search Volume</th>
                <th className="p-3.5 text-center">Current Rank</th>
                <th className="p-3.5 text-center">Target Rank</th>
                <th className="p-3.5 text-center">Ranking Difficulty</th>
                <th className="p-3.5 text-right">Est. Traffic Uplift</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.keywordGaps.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900">{item.keyword}</td>
                  <td className="p-3.5 text-center font-mono text-slate-700">{item.searchVolume.toLocaleString('en-ZA')}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-amber-600">#{item.currentRank}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-emerald-600">#{item.targetRank}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.difficulty === 'Low' ? 'bg-emerald-100 text-emerald-800' : item.difficulty === 'Medium' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.difficulty}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-cyan-700">+{item.estimatedTrafficUplift.toLocaleString('en-ZA')} /mo</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      item.status === 'Leader' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Opportunity' ? 'bg-cyan-100 text-cyan-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
