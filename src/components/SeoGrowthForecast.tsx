import React from 'react';
import { Search, Info } from 'lucide-react';
import { AuditRecord } from '../types';

interface SeoGrowthForecastProps {
  audit: AuditRecord;
}

/**
 * Traffic and revenue forecasts need analytics data (organic visits, conversion rate, order value)
 * and keyword ranking data, neither of which this audit collects. This component therefore shows
 * only the measured SEO checks and says what is missing.
 */
export const SeoGrowthForecast: React.FC<SeoGrowthForecastProps> = ({ audit }) => {
  const seoChecks = Object.values(audit.categoryResults || {})
    .flatMap((cat: any) => cat.checks || [])
    .filter((c: any) => typeof c.id === 'string' && c.id.startsWith('CHK-SEO-'));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 font-sans">
      <div className="border-b border-slate-100 pb-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full mb-2 border border-cyan-200">
          <Search className="w-3.5 h-3.5" />
          <span>SEO (measured)</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Measured SEO checks</h2>
      </div>

      <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
        {seoChecks.map((c: any) => (
          <li key={c.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{c.name}</span>
              <span className="text-xs font-bold uppercase text-slate-500">{c.status.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{c.evidence}</p>
          </li>
        ))}
        {seoChecks.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No SEO checks recorded for this audit.</li>}
      </ul>

      <div className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
        <Info className="w-5 h-5 shrink-0 text-slate-400" />
        <p>
          A traffic and revenue forecast is not shown. It needs your analytics data (organic visits, conversion rate and average order value)
          and keyword ranking data, which this audit does not collect.
        </p>
      </div>
    </div>
  );
};
