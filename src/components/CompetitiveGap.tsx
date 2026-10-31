import React, { useState } from 'react';
import { AuditRecord } from '../types';
import { Target, ArrowRight, BarChart3, AlertTriangle } from 'lucide-react';

interface CompetitiveGapProps {
  primaryAudit: AuditRecord;
}

export const CompetitiveGap: React.FC<CompetitiveGapProps> = ({ primaryAudit }) => {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [competitorAudit, setCompetitorAudit] = useState<AuditRecord | null>(null);

  const handleRunComparison = async () => {
    if (!competitorUrl) return;
    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: competitorUrl,
          businessName: 'Competitor',
          businessCategory: 'Retail',
          targetMarket: 'South Africa',
          primaryObjective: 'comparison',
          depth: 'quick'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompetitorAudit(data.audit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900">Competitive Gap Analysis</h2>
        <p className="text-sm text-slate-600">Enter a competitor URL to run a parallel 12-factor audit for a side-by-side comparison.</p>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="Enter competitor URL"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleRunComparison}
            disabled={isAuditing}
            className="px-6 py-2 bg-[#07162c] text-[#00e5ff] rounded-lg font-bold text-sm hover:bg-slate-800 transition"
          >
            {isAuditing ? 'Auditing...' : 'Run Parallel Audit'}
          </button>
        </div>
      </div>

      {competitorAudit && (
        <div className="grid grid-cols-2 gap-8">
            {/* Display side-by-side comparison here */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold mb-4">{primaryAudit.businessName} (Primary)</h3>
                <div className="text-4xl font-black text-slate-900">{primaryAudit.overallScore}/100</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold mb-4">{competitorAudit.businessName} (Competitor)</h3>
                <div className="text-4xl font-black text-emerald-600">{competitorAudit.overallScore}/100</div>
            </div>
        </div>
      )}
    </div>
  );
};
