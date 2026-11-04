import React from 'react';
import { Info } from 'lucide-react';
import { AuditRecord } from '../types';

interface CompetitiveGapProps {
  primaryAudit: AuditRecord;
}

/**
 * The previous version generated a 12-month traffic and revenue forecast and a keyword gap table
 * from hardcoded assumptions. Those figures were not derived from the audit, so they are removed.
 * This view shows only measured category scores and states what is missing.
 */
export const CompetitiveGap: React.FC<CompetitiveGapProps> = ({ primaryAudit }) => {
  const categories = Object.entries(primaryAudit.categoryResults || {});
  const notMeasured = categories.flatMap(([, cat]: [string, any]) => (cat.checks || []).filter((c: any) => c.status === 'not_measured'));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 font-sans">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Measured category scores</h2>
        <p className="text-sm text-slate-500 mt-1">
          Overall score {primaryAudit.overallScore}/100 from {primaryAudit.summaryCounts?.total ?? 0} findings.
        </p>
      </div>

      <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
        {categories.map(([name, cat]: [string, any]) => (
          <li key={name} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-semibold text-slate-800">{name}</span>
            <span className="font-mono text-slate-600">{cat.score}/100</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
        <Info className="w-5 h-5 shrink-0 text-slate-400" />
        <p>
          No traffic, revenue or competitor-ranking forecast is shown. It needs your analytics data and competitor measurements.
          {notMeasured.length > 0 && ` ${notMeasured.length} check(s) in this audit were not measured.`}
        </p>
      </div>
    </div>
  );
};
