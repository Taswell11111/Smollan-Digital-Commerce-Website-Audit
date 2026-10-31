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
import { ThemeOption } from './components/ThemeSelector';
import { AuditRecord, LeadRecord, UrlInspectionResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('new_audit');
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'detailed'>('overview');
  const [currentAudit, setCurrentAudit] = useState<AuditRecord | null>(null);
  const [currentLead, setCurrentLead] = useState<LeadRecord | null>(null);
  const [savedAudits, setSavedAudits] = useState<AuditRecord[]>([]);
  const [savedLeads, setSavedLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditTargetUrl, setAuditTargetUrl] = useState<string>('');

  // Top Left Theme Selection State with LocalStorage Persistence
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('smollan_theme') as ThemeOption) || 'sharp-modern';
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
      if (Array.isArray(auditsData)) setSavedAudits(auditsData);
      if (Array.isArray(leadsData)) setSavedLeads(leadsData);
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

  // Step 2: Confirmation callback to launch the full 12-factor crawl and scoring
  const handleConfirmAudit = async (selectedDepth: 'quick' | 'standard' | 'deep') => {
    if (!pendingAuditParams) {
      alert("Missing audit parameters. Please try again.");
      return;
    }
    
    const finalAuditUrl = inspectionResult?.resolvedUrl || pendingAuditParams.url;
    
    // Immediately close modal and switch to progress page
    console.log("Launching audit for:", finalAuditUrl, "Depth:", selectedDepth);
    setIsVerificationOpen(false);
    setAuditTargetUrl(finalAuditUrl);
    setIsLoading(true);
    setActiveTab('progress');
    setCurrentAudit(null); 

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingAuditParams,
          url: finalAuditUrl,
          depth: selectedDepth,
          businessName: pendingAuditParams.businessName || inspectionResult?.pageTitle || new URL(finalAuditUrl).hostname
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAudit(data.audit);
        setCurrentLead(data.lead);
        setSavedAudits(prev => [data.audit, ...prev]);
        setSavedLeads(prev => [data.lead, ...prev]);
      } else {
        alert(data.error || 'Audit failed');
        setActiveTab('new_audit');
      }
    } catch (e: any) {
      alert(e.message || 'Network error during audit execution');
      setActiveTab('new_audit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white transition-colors duration-250"
      style={{ backgroundColor: 'var(--theme-page-bg)', color: 'var(--theme-page-text)' }}
    >
      {activeTab !== 'new_audit' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dashboardMode={dashboardMode}
          setDashboardMode={setDashboardMode}
          currentAudit={currentAudit}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
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

        {activeTab === 'new_audit' && (
          <NewAuditForm onStartAudit={handleInitiateAuditVerification} isLoading={isLoading} />
        )}

        {activeTab === 'progress' && (
          <AuditProgress
            url={auditTargetUrl}
            isLoading={isLoading}
            onComplete={() => setActiveTab('report')}
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

      {activeTab !== 'new_audit' && activeTab !== 'progress' && (
        <footer 
          className="text-white py-8 border-t text-center text-xs text-slate-400 transition-colors duration-250"
          style={{ backgroundColor: 'var(--theme-header-bg)', borderColor: 'var(--theme-header-border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-bold text-slate-300">Smollan Digital Commerce · Website Intelligence & Opportunity Audit Platform</p>
            <p>Powered by server-side crawling, deterministic scoring rules, and Gemini AI analysis.</p>
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
