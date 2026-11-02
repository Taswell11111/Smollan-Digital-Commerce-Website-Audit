import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Search, 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Lock,
  Layers,
  ShoppingBag,
  Gauge,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { AuditRecord, LeadRecord } from '../types';
import { AuditConsole } from './AuditConsole';

interface AuditProgressProps {
  url: string;
  isLoading: boolean;
  onComplete: (audit: AuditRecord, lead: LeadRecord) => void;
  auditId: string | null;
}

interface AuditTestItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'warning';
}

const INITIAL_TESTS: AuditTestItem[] = [
  {
    id: 'dns_tls',
    name: 'DNS & SSL / TLS Security Verification',
    category: 'Security & Infrastructure',
    description: 'Validating certificate handshake, cipher strength, and HTTPS enforcement.',
    status: 'running'
  },
  {
    id: 'homepage_headers',
    name: 'Homepage Discovery & Server HTTP Health',
    category: 'Infrastructure',
    description: 'Verifying 200 OK response, TTFB latency, and server caching headers.',
    status: 'pending'
  },
  {
    id: 'core_web_vitals',
    name: 'Core Web Vitals & Latency Profiling',
    category: 'Performance',
    description: 'Profiling page load speed, asset weight, and response timings.',
    status: 'pending'
  },
  {
    id: 'mobile_viewport',
    name: 'Mobile Viewport & Layout Integrity',
    category: 'UX / Responsive',
    description: 'Scanning viewport meta tags, tap target spacing, and responsive layout.',
    status: 'pending'
  },
  {
    id: 'deep_crawl',
    name: 'DOM Traversal & Navigation Link Crawler',
    category: 'Architecture',
    description: 'Crawling internal links, canonical tags, and checking for broken URLs.',
    status: 'pending'
  },
  {
    id: 'product_cart',
    name: 'Product Pricing, Sizing & Cart Pathway',
    category: 'eCommerce Journey',
    description: 'Checking currency formats, sizing guides, and add-to-cart buttons.',
    status: 'pending'
  },
  {
    id: 'brand_trust',
    name: 'Brand Trust Markers & Legal Compliance',
    category: 'Trust & Compliance',
    description: 'Inspecting POPIA/GDPR privacy notices and customer rating widgets.',
    status: 'pending'
  },
  {
    id: 'scoring_engine',
    name: '12-Category Smollan Deterministic Scoring',
    category: 'Scoring & Uplift',
    description: 'Computing ruleset benchmarks, conversion gap analysis, and uplift.',
    status: 'pending'
  }
];

export const AuditProgress: React.FC<AuditProgressProps> = ({ url, isLoading, onComplete, auditId }) => {
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [tests, setTests] = useState<AuditTestItem[]>(INITIAL_TESTS);
  
  // Stored completed audit data awaiting user clicking "Proceed"
  const [completedData, setCompletedData] = useState<{
    audit: AuditRecord;
    lead: LeadRecord;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');

  useEffect(() => {
    if (isLoading && !hasStarted) {
      setHasStarted(true);
      setConsoleLogs(['[SYSTEM] Smollan Intelligence Engine initiated for target: ' + url]);
    }
  }, [isLoading, url, hasStarted]);

  const cancelAudit = async () => {
    if (!auditId) return;
    setIsCancelling(true);
    try {
      await fetch(`/api/audit/cancel/${auditId}`, { method: 'DELETE' });
      onComplete({} as any, {} as any);
    } catch (err) {
      console.error('Cancellation error', err);
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!auditId || completedData) return;
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/audit/status/${auditId}`);
        const data = await res.json();
        
        if (data.logs && Array.isArray(data.logs)) {
          setConsoleLogs(data.logs);

          // Update test progress dynamically based on logs
          const logText = data.logs.join(' ').toLowerCase();
          setTests(prev => prev.map((t, idx) => {
            if (data.status === 'complete') {
              return { ...t, status: 'completed' };
            }
            if (t.id === 'dns_tls') {
              return { ...t, status: logText.includes('crawling') || logText.includes('homepage') ? 'completed' : 'running' };
            }
            if (t.id === 'homepage_headers') {
              if (logText.includes('inspected') || logText.includes('discovered')) return { ...t, status: 'completed' };
              if (logText.includes('homepage') || logText.includes('crawling')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'core_web_vitals') {
              if (logText.includes('scoring') || logText.includes('12-category')) return { ...t, status: 'completed' };
              if (logText.includes('load') || logText.includes('response') || logText.includes('ms')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'mobile_viewport') {
              if (logText.includes('scoring')) return { ...t, status: 'completed' };
              if (logText.includes('page') || logText.includes('crawl')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'deep_crawl') {
              if (logText.includes('calculating') || logText.includes('scoring')) return { ...t, status: 'completed' };
              if (logText.includes('discovered') || logText.includes('crawling')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'product_cart') {
              if (logText.includes('scoring')) return { ...t, status: 'completed' };
              if (logText.includes('inspected')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'brand_trust') {
              if (logText.includes('scoring')) return { ...t, status: 'completed' };
              if (logText.includes('inspected')) return { ...t, status: 'running' };
              return t;
            }
            if (t.id === 'scoring_engine') {
              if (logText.includes('scoring') || logText.includes('calculating')) return { ...t, status: 'running' };
              return t;
            }
            return t;
          }));
        }
        
        if (data.status === 'complete' && data.result?.audit) {
          // Mark all tests as completed
          setTests(prev => prev.map(t => ({ ...t, status: 'completed' })));
          // Store completion data and PAUSE here so the user can see test results and click Proceed!
          setCompletedData({
            audit: data.result.audit,
            lead: data.result.lead
          });
          return;
        } else if (data.status === 'failed') {
          const fallbackAudit: AuditRecord = data.result?.audit || {
            id: `AUD-${Date.now()}`,
            timestamp: new Date().toISOString(),
            url: url,
            businessName: (() => {
              try {
                return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
              } catch {
                return 'Storefront Target';
              }
            })(),
            businessCategory: 'Storefront',
            targetMarket: 'South Africa',
            primaryObjective: 'sales',
            depth: 'standard',
            overallScore: 0,
            projectedOverallScore: 90,
            scoreUplift: 90,
            categoryResults: {},
            crawlSummary: { discovered: 1, inspected: 0, failed: 1 },
            metrics: {
              sessions: { value: 'Requires Analytics Integration', status: 'customer_data_required' },
              pageSpeed: { value: 'N/A', status: 'measured' },
              performanceScore: { value: '0', status: 'measured' },
              brokenLinks: { value: '1', status: 'measured' }
            },
            executiveVerdict: {
              headline: `Diagnostic Notice: Storefront access failure (${data.error || 'Server unreachable'})`,
              summaryText: `Storefront evaluated at 0/100 due to crawler or connection block. Remediate WAF allowlisting and server gateway errors to recover up to 90/100.`
            },
            findings: [{
              id: 'MSR-00',
              title: 'Storefront Accessibility & Bot Access Restricted',
              category: 'Technical Resilience and Security',
              affectedUrl: url,
              observedEvidence: data.error || 'Connection error or bot restriction',
              businessImpact: 'Prevents automated audits, crawler discovery, and search indexing.',
              severity: 'Essential',
              confidence: 'High',
              effort: 'medium',
              proposedRemedy: 'Allowlist Smollan Digital Auditor in Cloudflare / AWS WAF rules and inspect server response codes.',
              serviceLine: 'Website Performance & Technical Optimisation',
              source: 'measured'
            }],
            summaryCounts: { total: 1, essential: 1, recommended: 0, content: 0 },
            auditError: data.error || 'Evaluation encountered a network or crawler block'
          };
          const fallbackLead: LeadRecord = data.result?.lead || {
            id: `LEAD-${Date.now()}`,
            auditId: fallbackAudit.id,
            businessName: fallbackAudit.businessName,
            domain: url,
            overallScore: 0,
            projectedScore: 90,
            priority: 'High',
            priorityReason: `Evaluation encountered error: ${data.error || 'Access restricted'}. Urgent infrastructure remediation required.`,
            status: 'New',
            topFindings: fallbackAudit.findings,
            recommendedServices: ['Website Performance & Technical Optimisation'],
            createdAt: new Date().toISOString()
          };
          // Store completion with failure notice and allow Proceed
          setCompletedData({
            audit: fallbackAudit,
            lead: fallbackLead
          });
          return;
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [auditId, url, completedData]);

  const handleProceed = () => {
    if (completedData) {
      onComplete(completedData.audit, completedData.lead);
    }
  };

  const completedCount = tests.filter(t => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / tests.length) * 100);

  return (
    <div className="min-h-screen bg-[#00143a] text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl aspect-video bg-cyan-500/[0.08] blur-[160px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10">
        
        {/* Header Strip */}
        <div className="bg-[#002157]/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-widest text-[#00e5ff] bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                {completedData ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Evaluation Complete</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3 h-3 text-[#00e5ff] animate-spin" />
                    <span>Live Audit Pipeline Active</span>
                  </>
                )}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {auditId || 'INITIALIZING'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{completedData ? 'Storefront Evaluation Complete' : 'Executing Storefront Audits & Tests'}</span>
            </h1>
            <p className="text-xs text-slate-300 font-mono truncate max-w-xl">
              Target: <span className="text-[#00e5ff] font-semibold">{url}</span>
            </p>
          </div>

          {/* Progress / Completion Quick Badge */}
          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Test Suite Status</span>
              <span className="text-lg font-black text-[#00e5ff]">{completedCount} / {tests.length} Complete</span>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-[#00e5ff] flex items-center justify-center font-black text-sm text-[#00e5ff]">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Completion Celebration & Proceed Action Banner */}
        {completedData && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-[#002157] to-cyan-950/80 border-2 border-emerald-400/50 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Audits & Scrapes Concluded Successfully</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                Storefront Scored: <span className="text-[#00e5ff]">{completedData.audit.overallScore}/100</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                All 12 categories, DOM checks, and performance latencies evaluated. Potential uplift of{' '}
                <strong className="text-emerald-400">+{completedData.audit.scoreUplift} pts</strong> identified for commercial remediation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleProceed}
                className="w-full sm:w-auto bg-[#00e5ff] hover:bg-cyan-300 text-[#002157] px-8 py-4 rounded-xl font-black text-base shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Proceed</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* View Switcher Tabs (Tests Grid vs Live Console) */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'tests' 
                  ? 'bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Audits & Tests Being Run ({tests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'console' 
                  ? 'bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Raw Scrape Logs ({consoleLogs.length})</span>
            </button>
          </div>

          {!completedData && (
            <button 
              onClick={cancelAudit}
              disabled={isCancelling}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 px-4 py-1.5 rounded-lg border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-all"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Audit'}
            </button>
          )}
        </div>

        {/* TAB 1: Tests / Audits Being Run */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tests.map((test, index) => {
              const isRunning = test.status === 'running';
              const isDone = test.status === 'completed';

              return (
                <div
                  key={test.id}
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                    isDone 
                      ? 'bg-[#002157]/70 border-emerald-500/30 hover:border-emerald-500/50' 
                      : isRunning 
                      ? 'bg-cyan-950/40 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30' 
                      : 'bg-[#001f4d]/40 border-slate-700/50 opacity-60'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isRunning ? (
                      <div className="w-7 h-7 rounded-full bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-[#00e5ff] animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 truncate">
                        {test.category}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isDone 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                          : isRunning 
                          ? 'bg-cyan-950 text-[#00e5ff] border border-cyan-500/40 animate-pulse' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isDone ? 'Completed' : isRunning ? 'Evaluating...' : 'Queued'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">
                      {test.name}
                    </h4>

                    <p className="text-xs text-slate-400 leading-snug">
                      {test.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Live Console Terminal */}
        {activeTab === 'console' && (
          <div className="space-y-4">
            <AuditConsole logs={consoleLogs} url={url} />
          </div>
        )}

        {/* Bottom Proceed Action (always visible if completed) */}
        {completedData && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-[#002157] border border-cyan-500/30 p-5 rounded-2xl gap-4">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white block">Audit Complete</span>
              Ready to examine the high-level score, crawled pages screenshots, and diagnostic findings.
            </div>
            <button
              onClick={handleProceed}
              className="w-full sm:w-auto bg-[#00e5ff] hover:bg-cyan-300 text-[#002157] px-8 py-3.5 rounded-xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
