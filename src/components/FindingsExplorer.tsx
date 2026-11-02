import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { AuditRecord } from '../types';

interface FindingsExplorerProps {
  audit: AuditRecord;
  onNavigateTab: (tab: string) => void;
}

export const FindingsExplorer: React.FC<FindingsExplorerProps> = ({ audit, onNavigateTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredFindings = audit.findings.filter((f: any) => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.serviceLine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#002157] text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-bold">Audit Intelligence & Service Mapping</span>
          <h2 className="text-2xl font-black">Findings Explorer</h2>
          <p className="text-xs text-slate-300 mt-1">
            Browse and filter verified findings for <strong className="text-white">{audit.businessName}</strong>, mapped directly to Smollan Digital Commerce services.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('leads')}
          className="bg-[#00e5ff] text-[#002157] hover:bg-cyan-300 px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2"
        >
          <span>View Lead Opportunity</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings by keyword, category, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Essential">Essential Fixes</option>
            <option value="Recommended">Recommended</option>
            <option value="Content & Settings">Content & Settings</option>
          </select>
        </div>
      </div>

      {/* Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFindings.map((f: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-cyan-500 transition">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  f.severity === 'Essential' ? 'bg-red-100 text-red-800' : f.severity === 'Recommended' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {f.severity}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{f.title}</h3>
                <span className="text-xs text-slate-500">{f.category}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {f.id || `MSR-${idx + 1}`}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                  f.source === 'ai' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {f.source === 'ai' ? 'AI Narrative' : 'Measured'}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-mono">
              <span className="text-cyan-700 font-semibold block truncate">URL: {f.affectedUrl}</span>
              <p className="text-slate-600 font-sans"><strong>Evidence:</strong> {f.observedEvidence}</p>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <p><strong>Commercial Impact:</strong> {f.businessImpact}</p>
              <p><strong>Proposed Remedy:</strong> <span className="font-medium text-slate-900">{f.proposedRemedy}</span></p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="bg-cyan-50 text-cyan-900 font-bold px-2.5 py-1 rounded border border-cyan-200">
                Service: {f.serviceLine}
              </span>
              <span className="text-slate-400 font-medium">Effort: {f.effort}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredFindings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">No findings match your search filter criteria.</p>
        </div>
      )}
    </div>
  );
};
