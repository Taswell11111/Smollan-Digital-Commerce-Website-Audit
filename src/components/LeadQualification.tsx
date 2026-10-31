import React from 'react';
import { Target, ArrowRight, ShieldCheck, Mail, FileText } from 'lucide-react';
import { AuditRecord, LeadRecord } from '../types';

interface LeadQualificationProps {
  audit: AuditRecord;
  lead: LeadRecord;
  onNavigateTab: (tab: string) => void;
}

export const LeadQualification: React.FC<LeadQualificationProps> = ({ audit, lead, onNavigateTab }) => {
  if (!lead || !audit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-4">
          <Target className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">No Lead Profile Generated Yet</h2>
          <p className="text-xs text-slate-500">Run a website audit first to generate an AI-qualified lead profile.</p>
          <button
            onClick={() => onNavigateTab('new_audit')}
            className="bg-[#07162c] text-white px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            Start Website Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#07162c] text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-bold">Smollan Commercial Opportunity Engine</span>
          <h2 className="text-2xl font-black">Lead Qualification & Opportunity Profile</h2>
          <p className="text-xs text-slate-300 mt-1">Structured prospect profile based on verified website findings.</p>
        </div>
        <button
          onClick={() => onNavigateTab('pitch')}
          className="bg-[#00e5ff] text-[#07162c] hover:bg-cyan-300 px-6 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow"
        >
          <Mail className="w-4 h-4" />
          <span>Open Sales Pitch Studio</span>
        </button>
      </div>

      {/* Prospect Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Business & Domain</span>
            <h3 className="text-lg font-extrabold text-slate-900">{lead.businessName}</h3>
            <a href={lead.domain} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline">{lead.domain}</a>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Overall Audit Score</span>
            <div className="text-2xl font-black text-slate-900">
              {audit.overallScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block ${
              lead.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {lead.priority} Priority Lead
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Audit Coverage</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {audit.crawlSummary.inspected} pages successfully inspected
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Zero automated transactions simulated</span>
          </div>
        </div>

        {/* Priority Rationale */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Qualification Rationale</h4>
          <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
            {lead.priorityReason}
          </p>
        </div>

        {/* Recommended Service Lines */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Recommended Smollan Service Lines</h4>
          <div className="flex flex-wrap gap-2">
            {lead.recommendedServices.map((srv: string, idx: number) => (
              <span key={idx} className="bg-cyan-50 text-cyan-900 border border-cyan-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-600" /> {srv}
              </span>
            ))}
          </div>
        </div>

        {/* Top Verified Findings */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Top Verified Findings Supporting Opportunity</h4>
          <div className="space-y-2">
            {lead.topFindings.map((f: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 block">{f.title}</strong>
                  <span className="text-[11px] text-slate-500">{f.businessImpact}</span>
                </div>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => onNavigateTab('pitch')}
            className="bg-[#07162c] text-white hover:bg-cyan-600 px-6 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow"
          >
            <span>Proceed to Email Pitch Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
