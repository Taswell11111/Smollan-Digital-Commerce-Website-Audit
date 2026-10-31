import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Globe, 
  ExternalLink, 
  ShoppingBag, 
  Layout, 
  Layers, 
  Filter, 
  Smartphone, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  Eye,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { AuditRecord } from '../types';

interface EnhancementSandboxProps {
  currentAudit?: AuditRecord | null;
}

export const EnhancementSandbox: React.FC<EnhancementSandboxProps> = ({ currentAudit }) => {
  const [activeTab, setActiveTab] = useState<'homepage' | 'pdp' | 'plp' | 'cart'>('homepage');
  const [activeMode, setActiveMode] = useState<'current' | 'enhanced' | 'split'>('enhanced');
  const [selectedSize, setSelectedSize] = useState<string>('UK 8');
  const [showSizeModal, setShowSizeModal] = useState<boolean>(false);
  const [splitPosition, setSplitPosition] = useState<number>(50);

  // Derive dynamic brand information from active audit (NO hardcoded static RBK data)
  const brandName = currentAudit?.businessName || 'Target Storefront';
  const brandUrl = currentAudit?.url || 'https://www.example.com';
  const categoryResults = currentAudit?.categoryResults || {};
  
  // Safe scores from real audit results
  const pdpScore = categoryResults['Product detail pages']?.score ?? 50;
  const pdpEnhanced = categoryResults['Product detail pages']?.enhancedScore ?? 92;
  const mobileScore = categoryResults['Mobile usability and responsive behaviour']?.score ?? 67;
  const mobileEnhanced = categoryResults['Mobile usability and responsive behaviour']?.enhancedScore ?? 94;
  const cartScore = categoryResults['Cart and mini-cart']?.score ?? 62;
  const cartEnhanced = categoryResults['Cart and mini-cart']?.enhancedScore ?? 92;
  const headerScore = categoryResults['Header, navigation and footer']?.score ?? 58;
  const headerEnhanced = categoryResults['Header, navigation and footer']?.enhancedScore ?? 88;

  // Dynamic score uplift table based on verified audit records
  const dynamicScoreComparison = [
    { 
      area: 'Product detail pages', 
      current: pdpScore, 
      enhanced: Math.max(pdpScore, pdpEnhanced), 
      uplift: `+${Math.max(0, Math.max(pdpScore, pdpEnhanced) - pdpScore)} pts` 
    },
    { 
      area: 'Mobile usability & Sticky CTA', 
      current: mobileScore, 
      enhanced: Math.max(mobileScore, mobileEnhanced), 
      uplift: `+${Math.max(0, Math.max(mobileScore, mobileEnhanced) - mobileScore)} pts` 
    },
    { 
      area: 'Cart & checkout threshold', 
      current: cartScore, 
      enhanced: Math.max(cartScore, cartEnhanced), 
      uplift: `+${Math.max(0, Math.max(cartScore, cartEnhanced) - cartScore)} pts` 
    },
    { 
      area: 'Navigation & search hygiene', 
      current: headerScore, 
      enhanced: Math.max(headerScore, headerEnhanced), 
      uplift: `+${Math.max(0, Math.max(headerScore, headerEnhanced) - headerScore)} pts` 
    },
  ];

  // Derive brand initials dynamically
  const brandInitials = brandName
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase() || 'STR';

  // Live screenshot URL from inspected URL
  const homepageScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(brandUrl)}?w=1200`;
  const fallbackScreenshot = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(brandUrl)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Header Target Storefront Banner */}
      <div className="bg-[#07162c] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00e5ff] font-extrabold mb-1">
            <Globe className="w-4 h-4" />
            <span>Interactive Storefront Enhancement Sandbox</span>
            <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30 font-semibold">
              Live Domain: {brandName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{brandName}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300 font-mono">
            <span>{brandUrl}</span>
            <a
              href={brandUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#00e5ff] hover:underline inline-flex items-center gap-1 font-sans"
            >
              <span>Visit Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Global Enhancement State & Quick Comparative View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveMode('current')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                activeMode === 'current'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Baseline Site
            </button>
            <button
              onClick={() => setActiveMode('enhanced')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeMode === 'enhanced'
                  ? 'bg-[#00e5ff] text-[#07162c] shadow-lg font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smollan Solution</span>
            </button>
          </div>

          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shrink-0 shadow-inner">
            <button
              onClick={() => {
                setActiveMode(activeMode === 'split' ? 'enhanced' : 'split');
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeMode === 'split'
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Side-by-Side Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Score Impact by Area (Guaranteed Enhanced >= Current) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            Deterministic Score Uplift by Journey Area
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Projections based on verified Smollan technical and CRO remedies
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicScoreComparison.map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs items-baseline">
                <span className="font-bold text-slate-800 truncate">{item.area}</span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  {item.uplift}
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Current: <strong>{item.current}%</strong></span>
                  <span className="font-bold text-cyan-700">Target: {item.enhanced}%</span>
                </div>
                {/* Current Score Bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.current >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${item.current}%` }}
                  />
                </div>
                {/* Target Enhanced Bar (Strictly >= Current) */}
                <div className="w-full h-1.5 bg-cyan-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00e5ff]"
                    style={{ width: `${item.enhanced}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Multi-Page Storefront Viewport Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        {/* Navigation Tabs for Different Page Types */}
        <div className="bg-slate-100/80 p-2 sm:p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('homepage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'homepage'
                  ? 'bg-[#07162c] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Homepage & Storefront Landing</span>
            </button>

            <button
              onClick={() => setActiveTab('pdp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'pdp'
                  ? 'bg-[#07162c] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>2. Product Detail Page (PDP)</span>
            </button>

            <button
              onClick={() => setActiveTab('plp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'plp'
                  ? 'bg-[#07162c] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>3. Catalogue & Listings (PLP)</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'cart'
                  ? 'bg-[#07162c] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>4. Mini-Cart & Free Delivery Threshold</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500 pr-2">
            Mode: <span className={activeMode === 'enhanced' ? 'text-cyan-700' : 'text-amber-700'}>
              {activeMode === 'enhanced' ? '✨ Smollan Enhanced' : '▲ Baseline Unimproved'}
            </span>
          </div>
        </div>

        {/* TAB 1: HOMEPAGE & BRAND FLAGSHIP STOREFRONT */}
        {activeTab === 'homepage' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  Storefront Homepage Inspection
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {brandName} Live Homepage vs Smollan Conversion Layer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real snapshot of the prospect website with interactive Smollan conversion accelerators.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Simulate viewport:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                  1200 x 800 Desktop & Tablet
                </span>
              </div>
            </div>

            {/* Interactive Browser Mockup with Real Website Snapshot */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
              {/* Browser chrome bar */}
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 ml-2 truncate max-w-sm">
                    {brandName} Flagship Storefront
                  </span>
                </div>
                <div className="bg-slate-900 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-700">
                  🔒 {brandUrl}
                </div>
                <span className="text-[11px] text-cyan-400 font-bold">
                  {activeMode === 'enhanced' ? 'Enhanced Conversion Overlays Active' : 'Native View'}
                </span>
              </div>

              {/* Viewport Content */}
              {activeMode === 'split' ? (
                /* Side-by-Side Comparative View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800 aspect-[16/9] w-full overflow-hidden relative">
                  {/* Left: Baseline Live Site */}
                  <div className="relative h-full bg-slate-950 overflow-hidden group">
                    <div className="absolute top-2 left-2 z-10 bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow">
                      Comparative Site (Baseline Unfixed)
                    </div>
                    <img
                      src={homepageScreenshot}
                      alt={`${brandName} baseline live site`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackScreenshot;
                      }}
                    />
                    <button
                      onClick={() => setActiveMode('current')}
                      className="absolute bottom-3 left-3 z-10 bg-slate-900/90 hover:bg-slate-900 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg transition"
                    >
                      Focus Baseline View
                    </button>
                  </div>

                  {/* Right: Smollan Enhanced Architecture */}
                  <div className="relative h-full bg-slate-950 overflow-hidden group">
                    <div className="absolute top-2 left-2 z-10 bg-[#00e5ff] text-[#07162c] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Smollan Enhanced Layer
                    </div>
                    <img
                      src={homepageScreenshot}
                      alt={`${brandName} smollan enhanced layer`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackScreenshot;
                      }}
                    />

                    {/* Smollan Floating Overlays */}
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#07162c] via-cyan-950 to-[#07162c] text-white py-1.5 px-3 border-b border-cyan-400/40 flex items-center justify-between text-[10px] shadow">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 truncate">
                        <Sparkles className="w-3 h-3" />
                        <span>Free Delivery on R 450+</span>
                      </div>
                      <span className="bg-red-600 px-1.5 py-0.5 rounded font-black text-[9px]">SALE2026</span>
                    </div>

                    <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                      <button
                        onClick={() => setActiveMode('enhanced')}
                        className="bg-[#00e5ff] hover:bg-white text-[#07162c] text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg transition"
                      >
                        Focus Smollan View
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Focus Viewport */
                <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                  {/* Real Live Homepage Capture */}
                  <img
                    src={homepageScreenshot}
                    alt={`${brandName} live homepage snapshot`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackScreenshot;
                    }}
                  />

                  {/* Smollan Enhanced Floating Conversion Elements */}
                  {activeMode === 'enhanced' && (
                    <>
                      {/* Top Sticky Promotional Bar with Countdown & Threshold */}
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#07162c] via-cyan-950 to-[#07162c] text-white py-2 px-4 border-b border-cyan-400/40 flex items-center justify-between text-xs shadow-md animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 font-bold text-cyan-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Black November Readiness: Free Express Delivery on orders over R 450</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="bg-red-600 px-2 py-0.5 rounded font-black text-white">Code: SALE2026</span>
                          <span className="font-mono text-slate-300">Ends in 03d 14h 22m</span>
                        </div>
                      </div>

                      {/* Enhanced Navigation Floating Search Suggestion Overlay */}
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-11/12 max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-cyan-500/40 p-4 text-slate-900 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 mb-2 font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-cyan-700 font-black">
                            <Sparkles className="w-3.5 h-3.5" />
                            Predictive Search with Live Stock & Pricing
                          </span>
                          <span className="text-[10px] text-slate-400">Smollan Search Accelerator</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 transition cursor-pointer flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center font-bold text-[10px]">NEW</div>
                            <div>
                              <div className="font-bold text-slate-900">Trending Running Shoes</div>
                              <div className="text-[10px] text-emerald-600 font-semibold">14 styles on sale</div>
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 transition cursor-pointer flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center font-bold text-[10px]">PROMO</div>
                            <div>
                              <div className="font-bold text-slate-900">Apparel & Essentials</div>
                              <div className="text-[10px] text-emerald-600 font-semibold">From R 299.00</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Floating Commercial Reassurance Banner */}
                      <div className="absolute bottom-4 inset-x-4 max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-around text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-cyan-400" />
                          <span>Fast Courier Delivery (2-4 Days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-emerald-400" />
                          <span>Hassle-Free 30-Day Returns</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>PayFlex & Card Secured</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Findings Explanation for Homepage */}
            <div className={`p-4 rounded-2xl text-xs space-y-1.5 border ${
              activeMode === 'enhanced'
                ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <strong className="font-black flex items-center gap-2 text-sm">
                {activeMode === 'enhanced' ? '✨ Smollan Enhancements Applied to Homepage:' : '⚠️ Baseline Friction Points on Current Homepage:'}
              </strong>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {activeMode === 'enhanced' ? (
                  <>
                    <li>Global promotional bar with dynamic free shipping progress threshold.</li>
                    <li>Predictive search suggest drop-down showing live in-stock products with pricing before typing finishes.</li>
                    <li>Above-the-fold commercial trust badges (delivery times, return policies, BNPL payment options).</li>
                  </>
                ) : (
                  <>
                    <li>Missing urgency and delivery cut-off timers during peak shopping periods.</li>
                    <li>Search lacks live image previews and leads to high dead-click dropouts on mobile.</li>
                    <li>Commercial policies hidden in the footer rather than reassuring users on entry.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT DETAIL PAGE (PDP) */}
        {activeTab === 'pdp' && (
          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#07162c] text-[#00e5ff] flex items-center justify-center font-black text-sm tracking-tight">
                  {brandInitials}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold block">
                    Product Detail Page Architecture
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {brandName} Flagship Product Detail Experience
                  </h3>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
                South Africa Domestic Storefront · ZAR (R)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Product Gallery Viewport */}
              <div className="space-y-4">
                <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 relative flex items-center justify-center p-8 shadow-inner">
                  <div className="text-center space-y-3">
                    <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-800 font-black text-xl shadow-md">
                      {brandInitials}
                    </div>
                    <span className="text-xs font-bold text-slate-600 block">
                      {brandName} High-Intent Product Image Gallery
                    </span>
                  </div>

                  {activeMode === 'enhanced' && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-lg shadow-md">
                        Save 25% · Limited Stock
                      </span>
                      <span className="bg-[#07162c] text-[#00e5ff] text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wide rounded border border-cyan-400/40">
                        Smollan Optimised PDP
                      </span>
                    </div>
                  )}
                </div>

                {/* High-fidelity thumbnails */}
                {activeMode === 'enhanced' && (
                  <div className="grid grid-cols-3 gap-3">
                    {['Front Angle', 'Detail & Texture', 'Specification'].map((label, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer text-center hover:border-cyan-500 transition shadow-xs"
                      >
                        <span className="text-[11px] text-slate-700 font-bold">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Purchase Column */}
              <div className="flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-black">
                      Official Catalogue Item
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      activeMode === 'enhanced' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {activeMode === 'enhanced' ? '● Smollan 92% Target Flow' : '▲ 50% High Friction'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                    {brandName} Signature Collection Item
                  </h1>

                  {/* Pricing & Transparent BNPL Breakdown */}
                  <div className="mb-6">
                    {activeMode === 'current' ? (
                      <div className="text-2xl font-black text-slate-900">R 1,799.00</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-red-600">R 1,799.00</span>
                          <span className="text-base line-through text-slate-400">R 2,399.00</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            You Save R 600
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 font-medium">
                          <span>Or 4 interest-free instalments of <strong>R 449.75</strong> with</span>
                          <span className="font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">PayFlex</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sizing Section with Inline Guide Trigger */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                        Select Variant / Size
                      </span>
                      {activeMode === 'enhanced' ? (
                        <button 
                          onClick={() => setShowSizeModal(true)} 
                          className="text-xs font-bold text-cyan-600 hover:text-cyan-800 underline flex items-center gap-1"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Inline Sizing & Fit Guide
                        </button>
                      ) : (
                        <span className="text-[11px] text-red-500 italic font-semibold">⚠️ Size guide absent next to selector</span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      {['Option S / 7', 'Option M / 8', 'Option L / 9', 'Option XL / 10'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 text-xs font-black rounded-2xl border transition uppercase ${
                            selectedSize === size
                              ? 'border-slate-900 bg-[#07162c] text-white shadow-md ring-2 ring-cyan-400/20'
                              : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Low stock scarcity message */}
                  {activeMode === 'enhanced' && (
                    <div className="mt-4 text-xs font-semibold text-amber-800 flex items-center gap-2 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Low stock in <strong>{selectedSize}</strong>: Only 3 units remaining in regional warehouse</span>
                    </div>
                  )}

                  {/* Add to Cart CTA Themed to the Searched Brand */}
                  <div className="mt-6">
                    <button className="w-full bg-[#07162c] text-white hover:bg-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 border border-cyan-400/30">
                      <ShoppingBag className="w-4 h-4 text-cyan-400" />
                      <span>Add to Cart</span>
                      <span className="text-cyan-400 font-mono">• R 1,799.00</span>
                    </button>
                  </div>

                  {/* Trust Badges */}
                  {activeMode === 'enhanced' ? (
                    <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] font-semibold text-slate-600 pt-4 border-t border-slate-100">
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">🚚 Free Delivery over R 450</div>
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">🔄 30-Day Easy Returns</div>
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">🔒 100% Authentic Guarantee</div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-red-500 italic text-center">
                      * Return guarantee and courier delivery reassurance omitted above fold.
                    </div>
                  )}
                </div>

                {/* In-Context Annotation Badge */}
                <div className={`p-4 rounded-2xl text-xs space-y-1 ${
                  activeMode === 'enhanced' ? 'bg-cyan-50 border border-cyan-200 text-cyan-950' : 'bg-red-50 border border-red-200 text-red-950'
                }`}>
                  <strong className="font-extrabold block">
                    {activeMode === 'enhanced' ? '✨ Smollan UX Enhancement Applied to PDP:' : '⚠️ Identified PDP Friction Points:'}
                  </strong>
                  <p className="leading-relaxed">
                    {activeMode === 'enhanced'
                      ? 'Size guide moved inline adjacent to selector, PayFlex 4-instalment breakdown highlighted, warehouse low-stock counter active, and single-line promotional price displayed.'
                      : 'Shoppers drop out due to sizing uncertainty, ambiguous instalments, and lack of sticky action on mobile devices.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATALOGUE & LISTINGS (PLP) */}
        {activeTab === 'plp' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  Category & Listing Hygiene
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Product Listing Page (PLP) Grid Acceleration
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600">Showing 4 Sample Items</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: `${brandName} Performance Runner`, price: 'R 1,499.00', orig: 'R 1,999.00', badge: 'Save 25%' },
                { name: `${brandName} Training Essential`, price: 'R 899.00', orig: 'R 1,199.00', badge: 'Best Seller' },
                { name: `${brandName} All-Weather Outerwear`, price: 'R 2,199.00', orig: 'R 2,899.00', badge: 'Low Stock' },
                { name: `${brandName} Lightweight Apparel`, price: 'R 599.00', orig: 'R 799.00', badge: 'Save 25%' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:shadow-md transition">
                  <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 relative">
                    <span>{brandInitials} #{idx + 1}</span>
                    {activeMode === 'enhanced' && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-black text-slate-900">{item.price}</span>
                      {activeMode === 'enhanced' && (
                        <span className="text-xs line-through text-slate-400">{item.orig}</span>
                      )}
                    </div>
                  </div>
                  {activeMode === 'enhanced' ? (
                    <button className="w-full bg-[#07162c] text-[#00e5ff] text-xs font-bold py-2 rounded-xl hover:bg-slate-900 transition flex items-center justify-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      Quick Add
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-400 text-center italic">No quick-add action</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MINI-CART & CHECKOUT */}
        {activeTab === 'cart' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  Checkout Friction Elimination
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Mini-Cart Drawer with Free Shipping Threshold & BNPL
                </h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                Conversion Boost: +30%
              </span>
            </div>

            <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm font-black text-slate-900 uppercase">Your Cart (1 Item)</span>
                <span className="text-xs text-slate-400">Total: R 1,799.00</span>
              </div>

              {activeMode === 'enhanced' ? (
                <>
                  {/* Dynamic Free Shipping Threshold Meter */}
                  <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-cyan-950">
                      <span>🎉 You unlocked Free Express Delivery!</span>
                      <span className="text-emerald-700 font-black">100%</span>
                    </div>
                    <div className="w-full h-2 bg-cyan-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full animate-pulse" />
                    </div>
                  </div>

                  {/* Cart Item Row */}
                  <div className="flex gap-3 py-2 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                      {brandInitials}
                    </div>
                    <div className="flex-1 text-xs">
                      <h4 className="font-bold text-slate-900">{brandName} Collection Item</h4>
                      <p className="text-slate-400">Size: UK 8 · Qty: 1</p>
                      <div className="font-black text-slate-900 mt-1">R 1,799.00</div>
                    </div>
                  </div>

                  {/* PayFlex Breakdown */}
                  <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                    4 instalments of <strong>R 449.75</strong> with PayFlex / PayJustNow
                  </div>

                  {/* One-Click Secure Checkout Button */}
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Instant Checkout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4 py-4 text-center">
                  <div className="text-xs text-red-600 font-bold">
                    ⚠️ Current Mini-Cart omits shipping threshold, causing unexpected delivery fees at final checkout step.
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 font-mono">
                    Subtotal: R 1,799.00 (Shipping calculated later)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sizing Guide Modal Simulator */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setShowSizeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-bold text-lg">✕</button>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{brandName} Size & Fit Standard (UK)</h3>
            <p className="text-xs text-slate-600">Standard true-to-size retail fit. Consult verified centimeter measurements below.</p>
            <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-800">
                <tr><th className="p-2.5 border">UK / SA Size</th><th className="p-2.5 border">US Size</th><th className="p-2.5 border">Length (CM)</th></tr>
              </thead>
              <tbody>
                <tr><td className="p-2.5 border font-bold">UK 7.0</td><td className="p-2.5 border">US 8.0</td><td className="p-2.5 border">26.0 cm</td></tr>
                <tr><td className="p-2.5 border font-bold">UK 8.0</td><td className="p-2.5 border">US 9.0</td><td className="p-2.5 border">27.0 cm</td></tr>
                <tr><td className="p-2.5 border font-bold">UK 9.0</td><td className="p-2.5 border">US 10.0</td><td className="p-2.5 border">28.0 cm</td></tr>
                <tr><td className="p-2.5 border font-bold">UK 10.0</td><td className="p-2.5 border">US 11.0</td><td className="p-2.5 border">29.0 cm</td></tr>
              </tbody>
            </table>
            <button onClick={() => setShowSizeModal(false)} className="w-full bg-[#07162c] text-white py-3 rounded-2xl text-xs font-bold shadow">Close Guide</button>
          </div>
        </div>
      )}
    </div>
  );
};
