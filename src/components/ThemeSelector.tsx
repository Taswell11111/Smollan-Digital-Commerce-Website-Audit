import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';

export type ThemeOption = 'sharp-modern' | 'navy-cyan' | 'luxury-gold' | 'tech-cobalt';

export interface ThemeConfig {
  id: ThemeOption;
  name: string;
  tagline: string;
  fontDisplay: string;
  fontBody: string;
  fontPreviewText: string;
  primaryColor: string;
  accentColor: string;
  highlightColor: string;
  badge: string;
  characteristics: string;
}

export const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'navy-cyan',
    name: 'Smollan Executive Navy & Cyan',
    tagline: 'Smollan Brand Standard · Enterprise Connected Commerce Intelligence',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'Plus Jakarta Sans',
    fontPreviewText: 'Aa Smollan Connected Commerce',
    primaryColor: '#002157',
    accentColor: '#002157',
    highlightColor: '#00e5ff',
    badge: 'Brand Standard',
    characteristics: 'Smollan signature navy (#002157), crisp enterprise cards & electric process cyan (#00e5ff)'
  },
  {
    id: 'sharp-modern',
    name: 'Sharp Modern & Contemporary',
    tagline: 'Architectural Precision & High-Impact Contemporary Typography',
    fontDisplay: 'Space Grotesk (700)',
    fontBody: 'Plus Jakarta Sans',
    fontPreviewText: 'Aa Sharp Geometric Commerce',
    primaryColor: '#090d16',
    accentColor: '#00f2fe',
    highlightColor: '#10b981',
    badge: 'Sharp Contemporary',
    characteristics: 'Razor-sharp 6px geometry, high-contrast obsidian & hyper-cyan'
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Obsidian & Editorial Gold',
    tagline: 'Strategic Editorial & Boardroom Advisory Typography',
    fontDisplay: 'Playfair Display Serif',
    fontBody: 'Plus Jakarta Sans',
    fontPreviewText: 'Aa Refined Executive Editorial',
    primaryColor: '#121217',
    accentColor: '#f59e0b',
    highlightColor: '#059669',
    badge: 'Boardroom Advisory',
    characteristics: 'High-end serif headlines, warm amber & charcoal palette'
  },
  {
    id: 'tech-cobalt',
    name: 'High-Contrast Terminal Cobalt',
    tagline: 'Technical Diagnostic & Core Web Vitals Engineering',
    fontDisplay: 'Space Grotesk',
    fontBody: 'JetBrains Mono',
    fontPreviewText: 'Aa 12-Factor Diagnostic Engine',
    primaryColor: '#09090b',
    accentColor: '#38bdf8',
    highlightColor: '#34d399',
    badge: 'Technical Cockpit',
    characteristics: 'Precision monospace code font, electric cobalt accents'
  }
];

interface ThemeSelectorProps {
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastChangedTheme, setLastChangedTheme] = useState<ThemeConfig | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeConfig = THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (themeId: ThemeOption) => {
    const selected = THEME_OPTIONS.find(t => t.id === themeId);
    onThemeChange(themeId);
    setIsOpen(false);
    if (selected) {
      setLastChangedTheme(selected);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3500);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg border-2 border-cyan-400/50 hover:border-cyan-400 transition-all shadow-md group focus:outline-hidden focus:ring-2 focus:ring-cyan-400"
        title="Change theme design and typography style"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <div 
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeConfig.accentColor }}
          />
          <Palette className="w-3.5 h-3.5 text-cyan-300" />
        </div>
        
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-cyan-300 font-extrabold leading-none">
            Theme & Font
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[150px] leading-tight">
            {activeConfig.badge}
          </span>
        </div>
        
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-300' : ''}`} />
      </button>

      {/* Floating Immediate Confirmation Banner / Toast when Theme changes */}
      {showToast && lastChangedTheme && (
        <div className="fixed top-20 left-4 z-50 bg-slate-900/95 backdrop-blur-md text-white border-2 border-cyan-400 p-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/40">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Theme Applied</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                {lastChangedTheme.badge}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">
              {lastChangedTheme.name}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Typography: <span className="font-semibold text-cyan-200">{lastChangedTheme.fontDisplay}</span> · {lastChangedTheme.characteristics}
            </p>
          </div>
        </div>
      )}

      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-88 bg-slate-950 border-2 border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                <Palette className="w-4 h-4" />
                <span>Theme & Font Styler</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                4 Executive Options
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Changes full typography (Plus Jakarta Sans, Space Grotesk, Playfair Serif, JetBrains Mono), borders, and colorways:
            </p>
          </div>

          <div className="space-y-1.5 p-1 max-h-[420px] overflow-y-auto">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                      : 'hover:bg-slate-900 border-slate-800/80 text-slate-300'
                  }`}
                >
                  {/* Swatch indicator */}
                  <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                    <div
                      className="w-5 h-5 rounded border border-white/30 shadow-xs"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-xs -mt-1.5"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>

                  {/* Theme Details & Typography Sample */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate">
                          {theme.name}
                        </span>
                        {theme.id === 'sharp-modern' && (
                          <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded">
                            New
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <div className="flex items-center gap-1 bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-500 shrink-0 ml-1">
                          <Check className="w-3 h-3 text-cyan-400" />
                          <span>Active</span>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {theme.tagline}
                    </p>

                    {/* Font Specimen Box */}
                    <div className="mt-2 p-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-300 font-medium">
                        Head: <strong className="text-white">{theme.fontDisplay}</strong>
                      </span>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ 
                          backgroundColor: `${theme.accentColor}25`, 
                          color: theme.accentColor 
                        }}
                      >
                        {theme.badge}
                      </span>
                    </div>

                    {/* Characteristics pill */}
                    <p className="text-[9px] text-slate-400 mt-1 italic">
                      {theme.characteristics}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
