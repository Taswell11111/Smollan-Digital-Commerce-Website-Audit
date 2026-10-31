import React from 'react';
import { Archive, Globe, ArrowRight, Trash2 } from 'lucide-react';
import { AuditRecord } from '../types';

interface SavedAuditsProps {
  savedAudits: AuditRecord[];
  onSelectAudit: (audit: AuditRecord) => void;
  onNavigateTab: (tab: string) => void;
}

export const SavedAudits: React.FC<SavedAuditsProps> = ({ savedAudits, onSelectAudit, onNavigateTab }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#002157] text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-bold">Audit History & Persistence</span>
          <h2 className="text-2xl font-black">Saved Website Audits</h2>
          <p className="text-xs text-slate-300 mt-1">Access past audit reports and review historical scores.</p>
        </div>
        <button
          onClick={() => onNavigateTab('new_audit')}
          className="bg-[#00e5ff] text-[#002157] hover:bg-cyan-300 px-5 py-2.5 rounded-xl font-bold text-xs transition"
        >
          + New Audit
        </button>
      </div>

      {savedAudits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <Archive className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Audits Stored</h3>
          <p className="text-xs text-slate-500">Conduct your first website intelligence audit to populate historical records.</p>
          <button
            onClick={() => onNavigateTab('new_audit')}
            className="bg-[#002157] text-white px-6 py-3 rounded-xl text-xs font-bold"
          >
            Start Website Audit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedAudits.map((audit) => (
            <div
              key={audit.id}
              onClick={() => {
                onSelectAudit(audit);
                onNavigateTab('report');
              }}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-cyan-500 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900">{audit.businessName}</h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{audit.id}</span>
                </div>
                <p className="text-xs text-cyan-600">{audit.url}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Timestamp: {new Date(audit.timestamp).toLocaleString()}</span>
                  <span>·</span>
                  <span>Inspected: {audit.crawlSummary.inspected} pages</span>
                  <span>·</span>
                  <span>Findings: {audit.summaryCounts.total}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className={`text-2xl font-black ${audit.overallScore >= 80 ? 'text-emerald-600' : audit.overallScore >= 65 ? 'text-amber-600' : 'text-red-600'}`}>
                    {audit.overallScore}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">
                    {audit.overallScore >= 80 ? 'Ready' : audit.overallScore >= 65 ? 'Average' : 'Needs Fixes'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-cyan-500 hover:text-white transition">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
