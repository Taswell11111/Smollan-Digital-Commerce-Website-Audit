import React from 'react';
import { Bot, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { AuditRecord, AiBotAccess } from '../types';

interface AgenticCommerceAuditViewProps {
  audit: AuditRecord;
}

const ACCESS_LABEL: Record<AiBotAccess, string> = {
  allowed: 'Allowed',
  partially_disallowed: 'Partly disallowed',
  disallowed: 'Disallowed',
  unknown: 'Not determined'
};

const ACCESS_ICON: Record<AiBotAccess, React.ReactNode> = {
  allowed: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  partially_disallowed: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  disallowed: <AlertTriangle className="w-4 h-4 text-red-600" />,
  unknown: <HelpCircle className="w-4 h-4 text-slate-400" />
};

export const AgenticCommerceAuditView: React.FC<AgenticCommerceAuditViewProps> = ({ audit }) => {
  const ac = audit.agenticCommerce;

  // Audits stored before this change have the old shape (no `measured`); treat them as not captured.
  if (!ac || !ac.measured) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 text-sm text-slate-500">
        Agentic-commerce signals were not captured for this audit.
      </div>
    );
  }

  const { jsonLd, robots, https } = ac.measured;
  const robotsNote =
    robots.status === 'fetched' ? 'robots.txt fetched and parsed.'
    : robots.status === 'absent' ? 'No robots.txt found; no crawler rules apply.'
    : 'robots.txt could not be retrieved; access is not determined.';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 font-sans">
      <div className="border-b border-slate-100 pb-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full mb-2 border border-cyan-200">
          <Bot className="w-3.5 h-3.5" />
          <span>Agentic commerce signals (measured)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Structured data and AI crawler access</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Only what this audit observed on {jsonLd.pagesInspected} inspected page(s) and in robots.txt is shown. No readiness score is calculated.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Schema.org types (JSON-LD)</h3>
        <p className="text-sm text-slate-600">
          Found on {jsonLd.pagesWithJsonLd} of {jsonLd.pagesInspected} inspected page(s).
        </p>
        <div className="flex flex-wrap gap-2">
          {jsonLd.typesFound.length === 0 && <span className="text-sm text-slate-500">No JSON-LD types found.</span>}
          {jsonLd.typesFound.map(t => (
            <span key={t} className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
        {jsonLd.missingRequiredTypes.length > 0 && (
          <p className="text-sm text-slate-600">
            Not found on inspected pages: {jsonLd.missingRequiredTypes.join(', ')}.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">AI crawler access (robots.txt)</h3>
        <p className="text-sm text-slate-600">{robotsNote}</p>
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
          {Object.entries(robots.aiBots).map(([bot, access]) => (
            <li key={bot} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold text-slate-800">{bot}</span>
              <span className="flex items-center gap-2 text-slate-600">{ACCESS_ICON[access]}{ACCESS_LABEL[access]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Transport</h3>
        <p className="text-sm text-slate-600">{https ? 'Storefront served over HTTPS.' : 'Storefront URL is not HTTPS.'}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Not measured by this audit</h3>
        <p className="text-xs text-slate-500">These need access this audit does not have, so no value is shown.</p>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          {ac.notMeasured.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </div>
  );
};
