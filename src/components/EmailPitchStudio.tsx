import React, { useState, useEffect } from 'react';
import { Mail, Copy, CheckCircle, ShieldAlert, Sparkles, Globe, ExternalLink, RefreshCw } from 'lucide-react';
import { AuditRecord } from '../types';

interface EmailPitchStudioProps {
  audit: AuditRecord;
}

export const EmailPitchStudio: React.FC<EmailPitchStudioProps> = ({ audit }) => {
  const [pitch, setPitch] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);
  const [bodyText, setBodyText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  // Sender identity comes from the server (env-driven), never from a client-side copy of the config.
  const [sender, setSender] = useState<{ name: string; company: string; contactReason: string; optOutNotice: string } | null>(null);

  useEffect(() => {
    fetch('/api/sender').then(r => (r.ok ? r.json() : null)).then(setSender).catch(() => setSender(null));
  }, []);

  // Helper to build formatted email body from pitch data and active hook
  const generateEmailBody = (pitchData: any, hookText: string) => {
    const salutation = pitchData?.salutation || `Dear ${audit.businessName} Digital Commerce Team,`;
    const evidenceList = (pitchData?.coreEvidenceBody || []).map((b: any) =>
      `• ${b.problemFound} (${b.pageLocation})\n  Commercial Impact: ${b.commercialRisk}\n  Recommended Remedy: ${b.smollanRemedy}`
    ).join('\n\n');
    const cta = pitchData?.callToAction ||
      `We would welcome the opportunity to share the full interactive report and enhancement prototype with your team. Would you be open to a brief 15-minute introductory call next week?`;

    return `${salutation}\n\n${hookText}\n\nDuring our technical and UX evaluation of ${audit.url}, our commerce specialists identified key areas impacting customer experience and conversion rates:\n\n${evidenceList}\n\n${cta}\n\nKind regards,\n${pitchData?.senderIdentity?.name || ''}\n${pitchData?.senderIdentity?.company || ''}`;
  };

  useEffect(() => {
    async function fetchPitch() {
      try {
        setLoading(true);
        const topFindings = (audit.findings || []).slice(0, 3);
        const categoryEntries = Object.entries(audit.categoryResults || {}).sort(
          (a: any, b: any) => a[1].score - b[1].score
        );
        const weakestCategory = categoryEntries[0]?.[0] || 'Mobile Optimisation';
        const strongestCategory = categoryEntries[categoryEntries.length - 1]?.[0] || 'Security & TLS';

        const res = await fetch('/api/pitch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: audit.url,
            brandName: audit.businessName,
            overallScore: audit.overallScore,
            weakestCategory,
            strongestCategory,
            topFindings
          })
        });
        const data = await res.json();
        setPitch(data);
        setSelectedSubjectIndex(0);

        const initialHook = data.pitchOptions?.[0]?.hook || data.hook ||
          `Following our comprehensive commercial and conversion-rate evaluation of ${audit.url}, our team identified high-leverage friction points where targeted UX and technical interventions can rapidly unlock incremental sales and performance gains.`;
        setBodyText(generateEmailBody(data, initialHook));
      } catch (e) {
        console.error('Failed to fetch pitch:', e);
      } finally {
        setLoading(false);
      }
    }

    if (audit) {
      fetchPitch();
    }
  }, [audit]);

  // When user selects a different subject option, update the subject line AND synchronize the email body hook!
  const handleSelectSubject = (index: number) => {
    setSelectedSubjectIndex(index);
    if (!pitch) return;

    const chosenOption = pitch.pitchOptions?.[index];
    const newHook = chosenOption?.hook || pitch.hook ||
      `We recently conducted an evaluation of ${audit.businessName} to benchmark conversion readiness and digital commerce performance.`;

    setBodyText(generateEmailBody(pitch, newHook));
  };

  const currentSubject = pitch?.pitchOptions?.[selectedSubjectIndex]?.subject ||
    pitch?.subjectLines?.[selectedSubjectIndex] ||
    `Audit Results: Unlocking ${audit.businessName}'s Digital Growth Potential`;

  const currentAngle = pitch?.pitchOptions?.[selectedSubjectIndex]?.angle || 'Strategic Commercial Opportunity';

  const handleCopy = () => {
    if (!sender) return;
    const footerText = `\n\n---\n${sender.name} | ${sender.company}\n${sender.contactReason}\n${sender.optOutNotice}`;
    navigator.clipboard.writeText(`Subject: ${currentSubject}\n\n${bodyText}${footerText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-extrabold text-slate-900">Synthesising Tailored B2B Sales Pitch...</h2>
          <p className="text-xs text-slate-500">Formulating evidence-based outreach angles in UK English.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Prominent Audited Target URL Banner */}
      <div className="bg-gradient-to-r from-[#002157] to-[#0f274a] text-white p-6 rounded-3xl shadow-xl border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00e5ff] font-extrabold mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Audited Prospect Target</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
              Verified Public Crawl
            </span>
          </div>
          <h2 className="text-2xl font-black">{audit.businessName}</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
            <span>{audit.url}</span>
            <a
              href={audit.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#00e5ff] hover:underline inline-flex items-center gap-0.5"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Assessed Store Score</span>
            <span className="text-xl font-black text-white">{audit.overallScore}<span className="text-xs text-[#00e5ff]">/100</span></span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Projected Score</span>
            <span className="text-xl font-black text-emerald-400">{audit.projectedOverallScore || 92}<span className="text-xs text-emerald-300">/100</span></span>
          </div>
        </div>
      </div>

      {/* Main Pitch Studio Body */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header Strip with Human Review Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-600">Sales Enablement Engine</span>
            <h3 className="text-lg font-black text-[#002157]">Personalised B2B Outreach Draft</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecting a different subject line dynamically updates the introductory angle and body copy below.
            </p>
          </div>
          <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Human Review Required Prior to Sending</span>
          </span>
        </div>

        {/* Dynamic Subject Line Selector */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Select Subject Line & Pitch Angle
            </label>
            <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              Active Focus: {currentAngle}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {pitch?.pitchOptions ? (
              pitch.pitchOptions.map((opt: any, idx: number) => {
                const isSelected = selectedSubjectIndex === idx;
                return (
                  <label
                    key={idx}
                    onClick={() => handleSelectSubject(idx)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-50/70 border-cyan-500 shadow-sm ring-1 ring-cyan-500/20'
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pitchSubject"
                      checked={isSelected}
                      onChange={() => handleSelectSubject(idx)}
                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{opt.subject}</span>
                        <span className="text-[10px] font-semibold text-cyan-800 bg-white px-2 py-0.2 rounded border border-cyan-200">
                          {opt.angle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        &quot;{opt.hook.slice(0, 110)}...&quot;
                      </p>
                    </div>
                  </label>
                );
              })
            ) : (
              (pitch?.subjectLines || []).map((subj: string, idx: number) => {
                const isSelected = selectedSubjectIndex === idx;
                return (
                  <label
                    key={idx}
                    onClick={() => handleSelectSubject(idx)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      isSelected ? 'bg-cyan-50 border-cyan-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pitchSubject"
                      checked={isSelected}
                      onChange={() => handleSelectSubject(idx)}
                      className="text-cyan-600"
                    />
                    <span className="text-xs font-semibold text-slate-800">{subj}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Editable Email Pitch Body */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
              Synchronised Email Copy (UK English · Fully Editable)
            </label>
            <span className="text-[11px] text-slate-400">
              Subject: <strong className="text-slate-700">{currentSubject}</strong>
            </span>
          </div>

          <textarea
            rows={15}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full text-xs font-mono p-4 sm:p-5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none leading-relaxed"
          />

          {/* Mandatory Compliance Footer (Appended to all outreach; uneditable) */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 select-none">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200">
              <span>Mandatory Sender Identification & Compliance Footer</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fixed Footer</span>
            </div>
            <div className="font-bold text-slate-800 pt-1">
              {sender ? `${sender.name} — ${sender.company}` : 'Sender details unavailable: check the server configuration'}
            </div>
            <p className="text-[11px] text-slate-600">
              {sender?.contactReason}
            </p>
            <p className="text-[11px] font-mono font-bold text-cyan-800 pt-1">
              {sender?.optOutNotice}
            </p>
          </div>
        </div>

        {/* Discovery Questions Cheat Sheet for the Business Development Rep */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/50 border border-blue-200/80 rounded-2xl p-5 space-y-2.5">
          <h4 className="text-xs font-black text-[#002157] uppercase flex items-center gap-2">
            💡 Recommended Discovery Questions for Business Development Call
          </h4>
          <ul className="list-disc pl-5 space-y-1.5">
            {pitch?.recommendedDiscoveryQuestions?.map((q: string, i: number) => (
              <li key={i} className="text-xs text-slate-700 leading-relaxed font-medium">
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Safeguard Notice */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-950">
            <strong>Zero Automated Dispatch:</strong> Smollan Digital Commerce strictly requires explicit human verification and manual approval prior to copying into your CRM or email client.
          </p>
        </div>

        {/* Actions Toolbar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 italic">Ready for sales representative review.</span>
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto bg-[#002157] text-white hover:bg-cyan-600 px-8 py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>Copy Pitch to Clipboard</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
