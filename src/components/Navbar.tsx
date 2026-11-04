import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Mail,
  Plus,
  Archive,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  FileCode
} from 'lucide-react';
import { AuditRecord } from '../types';
import { ThemeSelector, ThemeOption } from './ThemeSelector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dashboardMode: 'overview' | 'detailed';
  setDashboardMode: (mode: 'overview' | 'detailed') => void;
  currentAudit: AuditRecord | null;
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dashboardMode,
  setDashboardMode,
  currentAudit,
  currentTheme,
  onThemeChange
}) => {
  const mainNavItems = [
    { id: 'new_audit', label: 'Audit Gateway', icon: Plus },
    { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard, disabled: !currentAudit },
    { id: 'report', label: 'Audit & Intelligence Report', icon: FileText, disabled: !currentAudit },
    { id: 'qa_audit', label: 'QA Source Audit', icon: FileCode },
    { id: 'gap', label: 'Competitive Gap', icon: SlidersHorizontal, disabled: !currentAudit },
    { id: 'dashboard', label: 'Sales Cockpit', icon: TrendingUp, disabled: !currentAudit },
    { id: 'sandbox', label: 'Sandbox', icon: Sparkles, disabled: !currentAudit },
    { id: 'pitch', label: 'Pitch Studio', icon: Mail, disabled: !currentAudit }
  ];

  return (
    <header 
      className="text-white border-b sticky top-0 z-40 shadow-xl transition-colors duration-200"
      style={{ 
        backgroundColor: 'var(--theme-header-bg)', 
        borderColor: 'var(--theme-header-border)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Top Left: Theme Selector, Toggle & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
            
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => {
                setActiveTab('new_audit');
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-[#00b4d8] text-[#091b42] flex items-center justify-center font-black text-sm tracking-tighter shadow-md shrink-0">
                SM
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-extrabold">Smollan Digital</span>
                  <span className="text-[9px] bg-white/10 text-cyan-200 px-1.5 py-0.2 rounded font-medium">
                    Commerce Intelligence
                  </span>
                </div>
                <h1 className="text-xs font-bold tracking-tight text-white/90 truncate max-w-[200px] lg:max-w-none">
                  Website Intelligence & Opportunity Audit
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Audit Score Pill (Current vs Enhanced) */}
            {currentAudit && (
              <div
                onClick={() => setActiveTab('report')}
                className="hidden xl:flex items-center gap-2.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 text-xs cursor-pointer transition shadow-sm"
                title="Click to view current report"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white font-semibold max-w-[130px] truncate">{currentAudit.businessName}</span>
                <div className="flex items-center gap-1 font-bold">
                  <span className="text-white">{currentAudit.overallScore}</span>
                  <span className="text-[#00e5ff]">→</span>
                  <span className="text-emerald-400">{currentAudit.projectedOverallScore || 92}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">/100</span>
                </div>
              </div>
            )}

            {/* Saved Audits History */}
            <button
              onClick={() => setActiveTab('history')}
              className={`p-2 rounded-xl text-xs font-semibold transition border ${
                activeTab === 'history'
                  ? 'bg-[#00e5ff] text-[#002157] border-[#00e5ff]'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Saved Audits History"
            >
              <Archive className="w-4 h-4" />
            </button>

            {/* Settings Catalogue */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl text-xs font-semibold transition border ${
                activeTab === 'settings'
                  ? 'bg-[#00e5ff] text-[#002157] border-[#00e5ff]'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Service Catalogue & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Clean, Streamlined Navigation Bar (Revealed only after audit is completed and proceeded) */}
        {currentAudit && (
          <nav className="flex space-x-1 py-1.5 border-t border-white/10">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  disabled={item.disabled}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition border ${
                    isActive
                      ? 'bg-[#00e5ff] text-[#002157] border-[#00e5ff] shadow-md font-bold'
                      : item.disabled
                      ? 'text-white/30 border-transparent cursor-not-allowed'
                      : 'text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#002157]' : 'text-[#00e5ff]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
