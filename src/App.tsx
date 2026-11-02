import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { NewAuditForm } from './components/NewAuditForm';
import { AuditProgress } from './components/AuditProgress';
import { AuditReport } from './components/AuditReport';
import { EnhancementSandbox } from './components/EnhancementSandbox';
import { CompetitiveGap } from './components/CompetitiveGap';
import { FindingsExplorer } from './components/FindingsExplorer';
import { LeadQualification } from './components/LeadQualification';
import { EmailPitchStudio } from './components/EmailPitchStudio';
import { SavedAudits } from './components/SavedAudits';
import { SettingsCatalogue } from './components/SettingsCatalogue';
import { UrlVerificationModal } from './components/UrlVerificationModal';
import { SalesDashboard } from './components/SalesDashboard';
import { ThemeOption } from './components/ThemeSelector';
import { AuditRecord, LeadRecord, UrlInspectionResult } from './types';
import { calculateScores } from './utils/scoring';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('new_audit');
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'detailed'>('overview');
  const [currentAudit, setCurrentAudit] = useState<AuditRecord | null>(null);
  const [currentLead, setCurrentLead] = useState<LeadRecord | null>(null);
  const [savedAudits, setSavedAudits] = useState<AuditRecord[]>([]);
  const [savedLeads, setSavedLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditTargetUrl, setAuditTargetUrl] = useState<string>('');
  const [auditError, setAuditError] = useState<string | null>(null);

  // Top Left Theme Selection State with LocalStorage Persistence (Smollan Executive default)
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('smollan_theme') as ThemeOption) || 'navy-cyan';
  });

  const handleThemeChange = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    localStorage.setItem('smollan_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Storefront URL Verification states
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);
  const [isInspectingUrl, setIsInspectingUrl] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<UrlInspectionResult | null>(null);
  const [pendingAuditParams, setPendingAuditParams] = useState<{
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    depth: 'quick' | 'standard' | 'deep';
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Fetch initial saved audits & leads
    Promise.all([
      fetch('/api/audits').then(res => res.json()).catch(() => []),
      fetch('/api/leads').then(res => res.json()).catch(() => [])
    ]).then(([auditsData, leadsData]) => {
      if (Array.isArray(auditsData)) {
        setSavedAudits(auditsData);
        if (auditsData.length > 0) {
          setCurrentAudit(prev => prev || auditsData[0]);
        }
      }
      if (Array.isArray(leadsData)) {
        setSavedLeads(leadsData);
        if (leadsData.length > 0) {
          setCurrentLead(prev => prev || leadsData[0]);
        }
      }
    }).finally(() => setIsLoading(false));
  }, []);

  // Step 1: Pre-audit verification (fetches live title, platform, and homepage screenshot)
  const handleInitiateAuditVerification = async (params: {
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    depth: 'quick' | 'standard' | 'deep';
  }) => {
    setPendingAuditParams(params);
    setIsVerificationOpen(true);
    setIsInspectingUrl(true);
    setInspectionResult(null);

    try {
      const res = await fetch('/api/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: params.url })
      });
      const data = await res.json();
      if (data.success) {
        setInspectionResult(data);
      } else {
        setInspectionResult({
          success: false,
          inputUrl: params.url,
          resolvedUrl: params.url,
          domain: params.url,
          pageTitle: 'Unable to resolve domain',
          metaDescription: '',
          screenshotUrl: '',
          httpStatus: 0,
          responseTimeMs: 0,
          platform: 'Unknown',
          isHttps: false,
          securityStatus: 'Verification Failed',
          error: data.error || 'Could not verify target storefront. Please check URL.'
        });
      }
    } catch (err: any) {
      setInspectionResult({
        success: false,
        inputUrl: params.url,
        resolvedUrl: params.url,
        domain: params.url,
        pageTitle: 'Connection Error',
        metaDescription: '',
        screenshotUrl: '',
        httpStatus: 0,
        responseTimeMs: 0,
        platform: 'Unknown',
        isHttps: false,
        securityStatus: 'Offline',
        error: err.message || 'Network error during URL inspection.'
      });
    } finally {
      setIsInspectingUrl(false);
    }
  };

  // Step 1b: Re-inspect if the user corrected the URL inside the verification modal
  const handleReverifyUrl = async (newUrl: string) => {
    if (!pendingAuditParams) return;
    const updatedParams = { ...pendingAuditParams, url: newUrl };
    setPendingAuditParams(updatedParams);
    setIsInspectingUrl(true);

    try {
      const res = await fetch('/api/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await res.json();
      if (data.success) {
        setInspectionResult(data);
      } else {
        setInspectionResult({
          success: false,
          inputUrl: newUrl,
          resolvedUrl: newUrl,
          domain: newUrl,
          pageTitle: 'Unable to resolve domain',
          metaDescription: '',
          screenshotUrl: '',
          httpStatus: 0,
          responseTimeMs: 0,
          platform: 'Unknown',
          isHttps: false,
          securityStatus: 'Verification Failed',
          error: data.error || 'Could not verify target storefront.'
        });
      }
    } catch (err: any) {
      setInspectionResult({
        success: false,
        inputUrl: newUrl,
        resolvedUrl: newUrl,
        domain: newUrl,
        pageTitle: 'Connection Error',
        metaDescription: '',
        screenshotUrl: '',
        httpStatus: 0,
        responseTimeMs: 0,
        platform: 'Unknown',
        isHttps: false,
        securityStatus: 'Offline',
        error: err.message || 'Network error during URL inspection.'
      });
    } finally {
      setIsInspectingUrl(false);
    }
  };

  const [auditId, setAuditId] = useState<string | null>(null);

  function createClientFallbackAudit(targetUrl: string, name: string, errorMsg: string): { audit: AuditRecord, lead: LeadRecord } {
    let hostname = 'Storefront Target';
    try {
      hostname = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname.replace('www.', '');
    } catch {
      hostname = name || targetUrl;
    }
    const cleanName = name || hostname;
    const fallbackScoring = calculateScores({
      pagesInspected: [],
      failedPages: [{ url: targetUrl, status: 0, error: errorMsg }],
      pagesDiscoveredCount: 1,
      homepageReachable: false,
      homepageFailReason: errorMsg
    });

    const audit: AuditRecord = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: targetUrl,
      businessName: cleanName,
      businessCategory: 'Retail / Ecommerce',
      targetMarket: 'South Africa',
      primaryObjective: 'sales',
      depth: 'standard',
      overallScore: fallbackScoring.overallScore,
      projectedOverallScore: fallbackScoring.projectedOverallScore,
      scoreUplift: fallbackScoring.scoreUplift,
      categoryResults: fallbackScoring.categoryResults,
      crawlSummary: { discovered: 1, inspected: 0, failed: 1 },
      metrics: {
        sessions: { value: 'Requires Analytics Integration', status: 'customer_data_required' },
        pageSpeed: { value: 'N/A', status: 'measured' },
        performanceScore: { value: '0', status: 'measured' },
        brokenLinks: { value: '1', status: 'measured' }
      },
      executiveVerdict: {
        headline: `Diagnostic Notice: Storefront access failure (${errorMsg})`,
        summaryText: `Storefront evaluated at 0/100 due to crawler or connection block. Remediate WAF allowlisting and server gateway errors to recover up to 90/100.`
      },
      findings: [{
        id: 'MSR-00',
        title: 'Storefront Accessibility & Bot Access Restricted',
        category: 'Technical Resilience and Security',
        affectedUrl: targetUrl,
        observedEvidence: errorMsg,
        businessImpact: 'Prevents automated audits, crawler discovery, and search indexing.',
        severity: 'Essential',
        confidence: 'High',
        effort: 'medium',
        proposedRemedy: 'Allowlist Smollan Digital Auditor in Cloudflare / AWS WAF rules and inspect server response codes.',
        serviceLine: 'Website Performance & Technical Optimisation',
        source: 'measured'
      }],
      summaryCounts: { total: 1, essential: 1, recommended: 0, content: 0 },
      auditError: errorMsg,
      evaluationNotice: {
        type: 'error',
        title: 'Storefront Evaluation Notice',
        description: errorMsg,
        remediationSteps: [
          'Whitelist Smollan Digital Auditor in Cloudflare / AWS WAF',
          'Verify server HTTP status codes on entry URLs',
          'Check TLS / SSL certificate status'
        ],
        affectedUrl: targetUrl
      }
    };
    const lead: LeadRecord = {
      id: `LEAD-${Date.now()}`,
      auditId: audit.id,
      businessName: cleanName,
      domain: targetUrl,
      overallScore: 0,
      projectedScore: 90,
      priority: 'High',
      priorityReason: `Evaluation encountered error: ${errorMsg}. Urgent infrastructure remediation required.`,
      status: 'New',
      topFindings: audit.findings,
      recommendedServices: ['Website Performance & Technical Optimisation'],
      createdAt: new Date().toISOString()
    };
    return { audit, lead };
  }

  // Direct start from landing page without intermediate modal or 2nd landing page
  const handleDirectStartAudit = async (params: {
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    depth: 'quick' | 'standard' | 'deep';
    allowCartJourney: boolean;
    cartJourneyConfirmed: boolean;
  }) => {
    setPendingAuditParams(params);
    const finalAuditUrl = params.url;
    setIsVerificationOpen(false);
    setAuditTargetUrl(finalAuditUrl);
    setAuditId(null);
    setIsLoading(true);
    setActiveTab('progress');
    setCurrentAudit(null);
    setAuditError(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          url: finalAuditUrl,
          businessName: params.businessName || (() => {
            try { return new URL(finalAuditUrl).hostname.replace('www.', ''); } catch { return finalAuditUrl; }
          })()
        })
      });
      const data = await res.json();
      if (data.auditId) {
        setAuditId(data.auditId);
      } else {
        const errorMsg = data.error || 'Audit initiation encountered an issue.';
        setAuditError(errorMsg);
        const fallback = createClientFallbackAudit(finalAuditUrl, params.businessName, errorMsg);
        setCurrentAudit(fallback.audit);
        setCurrentLead(fallback.lead);
        setSavedAudits(prev => [fallback.audit, ...prev]);
        setSavedLeads(prev => [fallback.lead, ...prev]);
        setActiveTab('overview');
        setIsLoading(false);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Network error during audit initiation.';
      setAuditError(errorMsg);
      const fallback = createClientFallbackAudit(finalAuditUrl, params.businessName, errorMsg);
      setCurrentAudit(fallback.audit);
      setCurrentLead(fallback.lead);
      setSavedAudits(prev => [fallback.audit, ...prev]);
      setSavedLeads(prev => [fallback.lead, ...prev]);
      setActiveTab('overview');
      setIsLoading(false);
    }
  };

  // Step 2: Confirmation callback to launch the full 12-factor crawl and scoring (from modal if open)
  const handleConfirmAudit = async (
    selectedDepth: 'quick' | 'standard' | 'deep',
    allowCartJourney: boolean,
    cartJourneyConfirmed: boolean,
    selectedMaxPages?: number
  ) => {
    if (!pendingAuditParams) {
      return;
    }
    
    const finalAuditUrl = inspectionResult?.resolvedUrl || pendingAuditParams.url;
    
    // Immediately close modal and switch to progress page
    setIsVerificationOpen(false);
    setAuditTargetUrl(finalAuditUrl);
    setAuditId(null);
    setIsLoading(true);
    setActiveTab('progress');
    setCurrentAudit(null); 
    setAuditError(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingAuditParams,
          url: finalAuditUrl,
          depth: selectedDepth,
          maxPages: selectedMaxPages,
          allowCartJourney: allowCartJourney && cartJourneyConfirmed,
          cartJourneyConfirmed,
          businessName: pendingAuditParams.businessName || inspectionResult?.pageTitle || new URL(finalAuditUrl).hostname
        })
      });
      const data = await res.json();
      if (data.auditId) {
        setAuditId(data.auditId);
      } else {
        const errorMsg = data.error || 'Audit initiation failed.';
        setAuditError(errorMsg);
        const fallback = createClientFallbackAudit(finalAuditUrl, pendingAuditParams.businessName, errorMsg);
        setCurrentAudit(fallback.audit);
        setCurrentLead(fallback.lead);
        setSavedAudits(prev => [fallback.audit, ...prev]);
        setSavedLeads(prev => [fallback.lead, ...prev]);
        setActiveTab('overview');
        setIsLoading(false);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Network error during audit initiation.';
      setAuditError(errorMsg);
      const fallback = createClientFallbackAudit(finalAuditUrl, pendingAuditParams?.businessName || '', errorMsg);
      setCurrentAudit(fallback.audit);
      setCurrentLead(fallback.lead);
      setSavedAudits(prev => [fallback.audit, ...prev]);
      setSavedLeads(prev => [fallback.lead, ...prev]);
      setActiveTab('overview');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white transition-colors duration-250"
      style={{ backgroundColor: 'var(--theme-page-bg)', color: 'var(--theme-page-text)' }}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardMode={dashboardMode}
        setDashboardMode={setDashboardMode}
        currentAudit={currentAudit}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {auditError && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-6 py-3 text-rose-200 text-sm flex items-center justify-between z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-400">Audit Notice:</span>
            <span>{auditError}</span>
          </div>
          <button 
            onClick={() => setAuditError(null)}
            className="text-rose-300 hover:text-white text-xs px-2.5 py-1 rounded bg-rose-900/50 hover:bg-rose-800 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100]">
          <div className="h-full bg-[#00e5ff] animate-pulse w-full"></div>
        </div>
      )}

      <main className={`flex-1 ${(activeTab === 'new_audit' || activeTab === 'progress') ? '' : 'pb-16'}`}>
        {activeTab === 'overview' && (
          <OverviewDashboard
            setActiveTab={setActiveTab}
            dashboardMode={dashboardMode}
            setDashboardMode={setDashboardMode}
            savedAudits={savedAudits}
            savedLeads={savedLeads}
            currentAudit={currentAudit}
            isLoading={isLoading}
            onStartAudit={handleInitiateAuditVerification}
            onSelectAudit={(audit) => {
              setCurrentAudit(audit);
              const matchingLead = savedLeads.find(l => l.auditId === audit.id) || savedLeads[0];
              setCurrentLead(matchingLead);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <SalesDashboard 
            setActiveTab={setActiveTab} 
            recentAudit={currentAudit} 
            savedAudits={savedAudits}
            onSelectAudit={(audit) => {
              setCurrentAudit(audit);
              const matchingLead = savedLeads.find(l => l.auditId === audit.id) || savedLeads[0];
              setCurrentLead(matchingLead);
            }}
            onLaunchNewAudit={() => setActiveTab('new_audit')}
          />
        )}

        {activeTab === 'new_audit' && (
          <NewAuditForm onStartAudit={handleDirectStartAudit} isLoading={isLoading} />
        )}

        {activeTab === 'progress' && (
          <AuditProgress
            url={auditTargetUrl}
            isLoading={isLoading}
            auditId={auditId}
            onComplete={(audit, lead) => {
              setCurrentAudit(audit);
              setCurrentLead(lead);
              setSavedAudits(prev => [audit, ...prev]);
              setSavedLeads(prev => [lead, ...prev]);
              setActiveTab('overview');
              setIsLoading(false);
            }}
          />
        )}

        {activeTab === 'report' && currentAudit && (
          <AuditReport audit={currentAudit} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'sandbox' && (
          <EnhancementSandbox currentAudit={currentAudit} />
        )}

        {activeTab === 'findings' && currentAudit && (
          <FindingsExplorer audit={currentAudit} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'gap' && currentAudit && (
          <CompetitiveGap primaryAudit={currentAudit} />
        )}

        {activeTab === 'leads' && currentLead && currentAudit && (
          <LeadQualification audit={currentAudit} lead={currentLead} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'pitch' && currentAudit && (
          <EmailPitchStudio audit={currentAudit} />
        )}

        {activeTab === 'history' && (
          <SavedAudits
            savedAudits={savedAudits}
            onSelectAudit={(audit) => {
              setCurrentAudit(audit);
              const matchingLead = savedLeads.find(l => l.auditId === audit.id) || savedLeads[0];
              setCurrentLead(matchingLead);
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsCatalogue />
        )}
      </main>

      {activeTab !== 'progress' && (
        <footer 
          className="text-white py-8 border-t text-center text-xs text-slate-400 transition-colors duration-250 mt-auto"
          style={{ backgroundColor: 'var(--theme-header-bg)', borderColor: 'var(--theme-header-border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-bold text-slate-300">Smollan Digital Commerce · Connected Commerce Intelligence & Growth Audit Platform</p>
            <p className="text-slate-400">Deterministic 12-factor scoring engine, SSRF-protected sandboxed crawler, and Google Gemini AI enterprise synthesis.</p>
            <p className="text-[11px] text-slate-500">Connecting people, brands, and commerce across 60+ global markets.</p>
          </div>
        </footer>
      )}

      {/* Pre-Audit Storefront Screenshot & Domain Verification Modal */}
      <UrlVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        inspection={inspectionResult}
        isLoading={isInspectingUrl}
        onConfirm={handleConfirmAudit}
        onReverify={handleReverifyUrl}
        currentDepth={pendingAuditParams?.depth || 'standard'}
      />
    </div>
  );
}
