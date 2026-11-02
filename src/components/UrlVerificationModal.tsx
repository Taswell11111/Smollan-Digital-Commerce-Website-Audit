import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Clock, 
  Layers, 
  RefreshCw, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Globe,
  Sparkles,
  ShoppingCart,
  Sliders,
  FileText,
  ChevronDown,
  ChevronUp,
  Compass
} from 'lucide-react';
import { UrlInspectionResult } from '../types';

interface UrlVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: UrlInspectionResult | null;
  isLoading: boolean;
  onConfirm: (
    selectedDepth: 'quick' | 'standard' | 'deep', 
    allowCartJourney: boolean, 
    cartJourneyConfirmed: boolean,
    selectedMaxPages: number
  ) => void;
  onReverify: (newUrl: string) => void;
  onUpdateInspection: (newData: Partial<UrlInspectionResult>) => void;
  currentDepth: 'quick' | 'standard' | 'deep';
}

export const UrlVerificationModal: React.FC<UrlVerificationModalProps> = ({
  isOpen,
  onClose,
  inspection,
  isLoading,
  onConfirm,
  onReverify,
  onUpdateInspection,
  currentDepth,
}) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<'quick' | 'standard' | 'deep'>(currentDepth);
  const [editedUrl, setEditedUrl] = useState(inspection?.resolvedUrl || inspection?.inputUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [useFallbackScreenshot, setUseFallbackScreenshot] = useState(false);
  const [showDiscoveredUrls, setShowDiscoveredUrls] = useState(false);

  // Available pages discovered on target domain
  const availablePages = inspection?.pagesDiscoveredCount || inspection?.availablePagesCount || inspection?.internalLinksCount || 15;
  const [selectedMaxPages, setSelectedMaxPages] = useState<number>(
    Math.min(availablePages, currentDepth === 'quick' ? 5 : currentDepth === 'deep' ? 50 : 15)
  );

  // Cart & Checkout Journey settings
  const [allowCartJourney, setAllowCartJourney] = useState(false);
  const [cartJourneyConfirmed, setCartJourneyConfirmed] = useState(false);

  React.useEffect(() => {
    if (inspection) {
      setEditedUrl(inspection.resolvedUrl || inspection.inputUrl);
      setScreenshotError(false);
      setUseFallbackScreenshot(false);
      const avail = inspection.pagesDiscoveredCount || inspection.availablePagesCount || inspection.internalLinksCount || 15;
      const initialBudget = Math.min(avail, selectedDepth === 'quick' ? 5 : selectedDepth === 'deep' ? 50 : 15);
      setSelectedMaxPages(Math.max(1, initialBudget));
    }
  }, [inspection, selectedDepth]);

  if (!isOpen) return null;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedUrl.trim()) {
      onReverify(editedUrl.trim());
      setIsEditing(false);
    }
  };

  const handlePresetSelect = (count: number, depth: 'quick' | 'standard' | 'deep') => {
    setSelectedDepth(depth);
    setSelectedMaxPages(Math.min(count, Math.max(availablePages, 1)));
  };

  const currentScreenshotSrc = !useFallbackScreenshot
    ? inspection?.screenshotUrl
    : inspection?.fallbackScreenshotUrl || inspection?.ogImage;

  const sampleUrls = inspection?.sampleDiscoveredUrls || ['/'];
  const maxAllowedCrawl = Math.min(Math.max(availablePages, 10), 100);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="bg-[#0f172a] rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#002157] text-white px-8 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-[#00e5ff] shadow-2xl shadow-blue-900/40">
              <ShieldCheck className="w-6 h-6 stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase font-black tracking-[0.3em] text-[#00e5ff]">
                  Pre-Audit Verification
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
                  Target Verified
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase mt-1">
                Storefront Identification & Scraping Scope
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-3 rounded-2xl hover:bg-white/5 transition-all"
            aria-label="Close Verification"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-[#00e5ff] border-t-transparent animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black text-white uppercase tracking-widest">Inspecting Storefront & Discovering Pages...</p>
                <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Resolving redirects, parsing internal links & sitemap index</p>
              </div>
            </div>
          ) : inspection?.error ? (
            <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-[32px] space-y-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-widest">Verification Failed</h4>
                  <p className="text-sm font-bold text-red-400/80 mt-1 uppercase tracking-tight">{inspection.error}</p>
                </div>
              </div>
              <form onSubmit={handleEditSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  placeholder="https://www.reebok.co.za"
                  className="flex-1 px-6 py-4 text-sm font-bold border border-red-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-black/40 text-white placeholder:text-white/10"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-red-700 transition shadow-xl shadow-red-900/40"
                >
                  Retry
                </button>
              </form>
            </div>
          ) : inspection ? (
            <>
              {/* Guidance Banner */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Inspection completed. Review discovered domain pages and select your scraping budget below before full audit.
                  </span>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-black text-[#00e5ff] hover:text-white uppercase tracking-widest underline underline-offset-4 decoration-2"
                  >
                    Modify Target URL
                  </button>
                )}
              </div>

              {isEditing && (
                <form onSubmit={handleEditSubmit} className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-[#00e5ff]/30">
                  <input
                    type="text"
                    value={editedUrl}
                    onChange={(e) => setEditedUrl(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs font-mono bg-black/50 text-white border border-white/10 rounded-xl focus:border-[#00e5ff] outline-none"
                    placeholder="https://example.com"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00e5ff] text-[#002157] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white transition"
                  >
                    Re-Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-white/10 text-xs text-white/50 rounded-xl hover:text-white transition"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Technical Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Platform', val: inspection.platform, icon: Server, color: 'text-cyan-400' },
                  { label: 'Latency', val: `${inspection.responseTimeMs}ms`, icon: Clock, color: 'text-emerald-400' },
                  { 
                    label: 'Sitemap', 
                    val: inspection.hasSitemap 
                      ? `${inspection.sitemapUrlCount ? `${inspection.sitemapUrlCount} URLs` : 'Detected'}` 
                      : 'Not Found', 
                    icon: ShieldCheck, 
                    color: inspection.hasSitemap ? 'text-blue-400' : 'text-amber-400' 
                  },
                  { 
                    label: 'Discovered Pages', 
                    val: `${availablePages} Available`, 
                    icon: Globe, 
                    color: 'text-[#00e5ff]',
                    action: (
                      <button
                        disabled={isDiscovering}
                        onClick={async () => {
                          if (!inspection) return;
                          setIsDiscovering(true);
                          try {
                            const res = await fetch('/api/discover-pages', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url: inspection.resolvedUrl || inspection.inputUrl, depth: 'deep' })
                            });
                            const data = await res.json();
                            if (data.success) {
                              onUpdateInspection({
                                availablePagesCount: data.discoveredCount,
                                internalLinksCount: data.discoveredCount,
                                sampleDiscoveredUrls: data.pages.map((p: any) => p.url)
                              });
                            }
                          } catch (err) {
                            console.error('Discovery failed', err);
                          } finally {
                            setIsDiscovering(false);
                          }
                        }}
                        className={`mt-1 text-[9px] font-black uppercase tracking-widest hover:underline ${isDiscovering ? 'text-white/20 animate-pulse' : 'text-[#00e5ff]'}`}
                      >
                        {isDiscovering ? 'Discovering...' : 'Deep Discovery Scan'}
                      </button>
                    )
                  }
                ].map((stat, i) => (
                  <div key={i} className="p-5 bg-white/[0.03] rounded-[28px] border border-white/5 hover:bg-white/[0.05] transition-colors relative">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span>{stat.label}</span>
                    </div>
                    <div className="text-sm font-black text-white uppercase tracking-widest truncate">{stat.val}</div>
                    {'action' in stat && stat.action}
                  </div>
                ))}
              </div>

              {/* NEW: Pages Available for Scraping & Selection Control */}
              <div className="p-6 bg-gradient-to-br from-[#002157]/40 via-slate-900/60 to-black/60 border border-[#00e5ff]/30 rounded-[32px] space-y-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00e5ff]">
                        Crawl Discovery Intelligence
                      </div>
                      <div className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                        <span>{availablePages} Pages Available for Scraping</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 font-mono">
                          {inspection.domain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {sampleUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowDiscoveredUrls(prev => !prev)}
                      className="text-xs font-bold text-white/70 hover:text-[#00e5ff] flex items-center gap-1.5 transition px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#00e5ff]" />
                      <span>{showDiscoveredUrls ? 'Hide Page Paths' : `View Discovered Paths (${sampleUrls.length})`}</span>
                      {showDiscoveredUrls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Collapsible Discovered URL Paths Preview */}
                {showDiscoveredUrls && sampleUrls.length > 0 && (
                  <div className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-2 animate-in fade-in duration-200">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center justify-between">
                      <span>Sample internal page paths detected on {inspection.domain}:</span>
                      <span className="font-mono text-cyan-400">{sampleUrls.length} paths listed</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {sampleUrls.map((path, idx) => (
                        <span 
                          key={idx} 
                          className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="truncate max-w-xs">{path}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Page Count Selector */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#00e5ff]" />
                      <span>Select Scrape Volume (Number of Pages to Audit):</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min={1}
                          max={maxAllowedCrawl}
                          value={selectedMaxPages}
                          onChange={(e) => {
                            const val = Math.min(maxAllowedCrawl, Math.max(1, parseInt(e.target.value, 10) || 1));
                            setSelectedMaxPages(val);
                            if (val <= 5) setSelectedDepth('quick');
                            else if (val <= 25) setSelectedDepth('standard');
                            else setSelectedDepth('deep');
                          }}
                          className="w-20 px-3 py-1.5 bg-[#002157] border border-cyan-400/40 rounded-xl text-cyan-300 font-mono text-sm font-black focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]"
                        />
                        <span className="ml-2 text-xs font-black text-white/40 uppercase tracking-widest">Pages</span>
                      </div>
                      <span className="text-[11px] font-bold text-white/40">
                        (of {availablePages} available)
                      </span>
                    </div>
                  </div>

                  {/* Preset Scrape Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { 
                        id: 'preset-5', 
                        pages: Math.min(5, availablePages), 
                        depth: 'quick' as const, 
                        label: '5 Pages', 
                        sub: 'Quick Health Check' 
                      },
                      { 
                        id: 'preset-15', 
                        pages: Math.min(15, availablePages), 
                        depth: 'standard' as const, 
                        label: `${Math.min(15, availablePages)} Pages`, 
                        sub: 'Standard Sample' 
                      },
                      { 
                        id: 'preset-25', 
                        pages: Math.min(25, availablePages), 
                        depth: 'standard' as const, 
                        label: `${Math.min(25, availablePages)} Pages`, 
                        sub: 'Deep Sweep' 
                      },
                      { 
                        id: 'preset-all', 
                        pages: Math.min(availablePages, 100), 
                        depth: availablePages > 25 ? 'deep' as const : 'standard' as const, 
                        label: `All (${Math.min(availablePages, 100)})`, 
                        sub: 'Complete Crawl' 
                      }
                    ].map((opt) => {
                      const isSelected = selectedMaxPages === opt.pages;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handlePresetSelect(opt.pages, opt.depth)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#002157] border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-[#00e5ff]' : 'text-white'}`}>
                              {opt.label}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
                          </div>
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                            {opt.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Range Slider for granular control */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
                      <span>1 Page</span>
                      <span className="text-[#00e5ff] font-mono font-bold">
                        Scraping budget: {selectedMaxPages} page{selectedMaxPages > 1 ? 's' : ''} ({Math.min(100, Math.round((selectedMaxPages / Math.max(availablePages, 1)) * 100))}% coverage)
                      </span>
                      <span>Max {maxAllowedCrawl} Pages</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={maxAllowedCrawl}
                      value={selectedMaxPages}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSelectedMaxPages(val);
                        if (val <= 5) setSelectedDepth('quick');
                        else if (val <= 25) setSelectedDepth('standard');
                        else setSelectedDepth('deep');
                      }}
                      className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                    />
                  </div>
                </div>
              </div>

              {/* Cart and Checkout Journey Option (Phase 4c) */}
              <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-[32px] space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowCartJourney}
                        onChange={(e) => {
                          setAllowCartJourney(e.target.checked);
                          if (!e.target.checked) setCartJourneyConfirmed(false);
                        }}
                        className="w-5 h-5 rounded border-amber-500/40 text-amber-600 focus:ring-amber-500 bg-black/40"
                      />
                      <span className="text-sm font-black text-white uppercase tracking-wider">
                        Run cart and checkout journey (creates and clears a cart on the prospect's live store)
                      </span>
                    </label>
                    <p className="text-xs font-bold text-amber-300/80 uppercase tracking-tight">
                      Warning: The journey fires the prospect's analytics and ad tags.
                    </p>
                  </div>
                </div>

                {allowCartJourney && (
                  <div className="pl-12 pt-2 border-t border-amber-500/20">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cartJourneyConfirmed}
                        onChange={(e) => setCartJourneyConfirmed(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500/40 text-amber-600 focus:ring-amber-500 bg-black/40"
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        I explicitly confirm authorization to execute the test cart journey on this target storefront.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Browser Mockup */}
              <div className="border border-white/10 rounded-[36px] overflow-hidden shadow-2xl bg-black">
                <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/50" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <span className="text-[11px] font-black text-white/60 ml-4 truncate uppercase tracking-widest">
                      {inspection.pageTitle || inspection.domain}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUseFallbackScreenshot(prev => !prev);
                      setScreenshotError(false);
                    }}
                    className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload Snapshot</span>
                  </button>
                </div>

                <div className="relative w-full h-[260px] bg-slate-900 overflow-hidden">
                  {!screenshotError && currentScreenshotSrc ? (
                    <img
                      src={currentScreenshotSrc}
                      alt="Storefront Capture"
                      className="w-full h-full object-cover object-top transition duration-1000"
                      onError={() => setScreenshotError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#00143a] to-[#002157] text-white p-12 text-center">
                      <Globe className="w-16 h-16 text-[#00e5ff]/20 mb-6" />
                      <h4 className="text-xl font-black uppercase tracking-widest">{inspection.pageTitle}</h4>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mt-2 max-w-lg">
                        {inspection.metaDescription || "Target storefront validated. snapshot service ready."}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-black/20 px-8 py-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-2xl border border-white/10 text-xs font-black text-white/60 uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
          >
            Cancel Audit
          </button>

          <button
            type="button"
            disabled={isLoading || Boolean(inspection?.error) || (allowCartJourney && !cartJourneyConfirmed)}
            onClick={() => onConfirm(selectedDepth, allowCartJourney, cartJourneyConfirmed, selectedMaxPages)}
            className={`px-12 py-5 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl transition-all ${
              isLoading || Boolean(inspection?.error) || (allowCartJourney && !cartJourneyConfirmed)
                ? 'bg-white/10 text-white/20 cursor-not-allowed'
                : 'bg-[#00e5ff] text-[#002157] hover:bg-white hover:shadow-cyan-500/40 active:scale-[0.98]'
            }`}
          >
            <span>Launch {selectedMaxPages}-Page Audit ({selectedDepth.toUpperCase()})</span>
            <ArrowRight className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
