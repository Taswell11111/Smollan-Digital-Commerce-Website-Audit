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
  Sparkles
} from 'lucide-react';
import { UrlInspectionResult } from '../types';

interface UrlVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: UrlInspectionResult | null;
  isLoading: boolean;
  onConfirm: (selectedDepth: 'quick' | 'standard' | 'deep') => void;
  onReverify: (newUrl: string) => void;
  currentDepth: 'quick' | 'standard' | 'deep';
}

export const UrlVerificationModal: React.FC<UrlVerificationModalProps> = ({
  isOpen,
  onClose,
  inspection,
  isLoading,
  onConfirm,
  onReverify,
  currentDepth,
}) => {
  const [selectedDepth, setSelectedDepth] = useState<'quick' | 'standard' | 'deep'>(currentDepth);
  const [editedUrl, setEditedUrl] = useState(inspection?.resolvedUrl || inspection?.inputUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [useFallbackScreenshot, setUseFallbackScreenshot] = useState(false);

  // Sync editedUrl when inspection changes
  React.useEffect(() => {
    if (inspection) {
      setEditedUrl(inspection.resolvedUrl || inspection.inputUrl);
      setScreenshotError(false);
      setUseFallbackScreenshot(false);
    }
  }, [inspection]);

  if (!isOpen) return null;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedUrl.trim()) {
      onReverify(editedUrl.trim());
      setIsEditing(false);
    }
  };

  const currentScreenshotSrc = !useFallbackScreenshot
    ? inspection?.screenshotUrl
    : inspection?.fallbackScreenshotUrl || inspection?.ogImage;

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
                Storefront Identification
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-3 rounded-2xl hover:bg-white/5 transition-all"
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
                <p className="text-lg font-black text-white uppercase tracking-widest">Inspecting Storefront...</p>
                <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Resolving domain redirects & fetching live snapshot</p>
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
                    Inspection completed. confirm the snapshot corresponds to your target before initiating full audit.
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

              {/* Technical Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Platform', val: inspection.platform, icon: Server, color: 'text-cyan-400' },
                  { label: 'Latency', val: `${inspection.responseTimeMs}ms`, icon: Clock, color: 'text-emerald-400' },
                  { label: 'Sitemap', val: inspection.hasSitemap ? 'Detected' : 'Not Found', icon: ShieldCheck, color: inspection.hasSitemap ? 'text-blue-400' : 'text-amber-400' },
                  { label: 'Homepage Scope', val: `${inspection.internalLinksCount || 0} Unique Paths`, icon: Globe, color: 'text-[#00e5ff]' }
                ].map((stat, i) => (
                  <div key={i} className="p-5 bg-white/[0.03] rounded-[28px] border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span>{stat.label}</span>
                    </div>
                    <div className="text-sm font-black text-white uppercase tracking-widest truncate">{stat.val}</div>
                  </div>
                ))}
              </div>

              {/* Audit Depth Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Select Audit Intensity</h4>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded">Commercial Calibration Required</span>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'quick', title: 'Quick Scan', limit: '5 Pages', desc: 'Homepage & Key Paths' },
                    { id: 'standard', title: 'Standard', limit: '25 Pages', desc: 'Full Crawl & AI Insights' },
                    { id: 'deep', title: 'Deep Audit', limit: '100 Pages', desc: 'Commercial Opportunity' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDepth(item.id as any)}
                      className={`flex-1 p-4 rounded-[24px] border transition-all duration-300 text-left relative group ${
                        selectedDepth === item.id 
                          ? 'bg-[#002157] border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.15)] opacity-100' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-50 hover:opacity-75'
                      }`}
                    >
                      <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${selectedDepth === item.id ? 'text-[#00e5ff]' : 'text-white/40'}`}>
                        {item.title}
                      </div>
                      <div className="text-xs font-black text-white uppercase tracking-tight mb-1">{item.limit}</div>
                      <p className={`text-[8px] font-bold uppercase tracking-wider leading-tight ${selectedDepth === item.id ? 'text-white/60' : 'text-white/30'}`}>
                        {item.desc}
                      </p>
                      {selectedDepth === item.id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                    <span>Reload</span>
                  </button>
                </div>

                <div className="relative w-full h-[300px] bg-slate-900 overflow-hidden">
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
                        {inspection.metaDescription || "Target storefront validated. snapshot service initializing."}
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
            disabled={isLoading || Boolean(inspection?.error)}
            onClick={() => onConfirm(selectedDepth)}
            className={`px-12 py-5 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl transition-all ${
              isLoading || Boolean(inspection?.error)
                ? 'bg-white/10 text-white/20 cursor-not-allowed'
                : 'bg-[#00e5ff] text-[#002157] hover:bg-white hover:shadow-cyan-500/40 active:scale-[0.98]'
            }`}
          >
            <span>Launch 12-Factor {selectedDepth.toUpperCase()} Audit</span>
            <ArrowRight className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
