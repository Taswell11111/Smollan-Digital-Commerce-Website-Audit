import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Zap,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Search,
  ShoppingCart,
  Building2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { UrlInspectionResult } from '../types';

interface NewAuditFormProps {
  onStartAudit: (params: {
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    primaryKeyword: string;
    depth: 'quick' | 'standard' | 'deep';
    siteType: 'ecommerce' | 'service';
    allowCartJourney: boolean;
    cartJourneyConfirmed: boolean;
  }) => void;
  isLoading: boolean;
}

export const NewAuditForm: React.FC<NewAuditFormProps> = ({ onStartAudit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [siteType, setSiteType] = useState<'ecommerce' | 'service'>('ecommerce');
  const [businessCategory, setBusinessCategory] = useState('Fashion & Retail');
  const [targetMarket, setTargetMarket] = useState('South Africa');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [allowCartJourney, setAllowCartJourney] = useState(false);
  const [cartJourneyConfirmed, setCartJourneyConfirmed] = useState(false);

  const [inlineInspection, setInlineInspection] = useState<UrlInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const [primaryKeyword, setPrimaryKeyword] = useState('');

  const inspectStorefront = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.includes('.')) return;
    setIsInspecting(true);
    try {
      const res = await fetch('/api/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        setInlineInspection(data);
        if (!businessName && data.pageTitle) {
          // Extract brand or clean page title
          const titleParts = data.pageTitle.split(/[|:-]/);
          const titleClean = titleParts[0].trim();
          setBusinessName(titleClean || data.domain);
          
          // Attempt to derive a practical product/service keyword if empty
          if (!primaryKeyword) {
            const desc = (data.metaDescription || '').toLowerCase();
            const title = (data.pageTitle || '').toLowerCase();
            
            // Extract common commerce keywords that aren't the brand
            const candidates = ['shoes', 'clothing', 'furniture', 'electronics', 'consulting', 'logistics', 'software', 'apparel', 'beauty'];
            const found = candidates.find(c => desc.includes(c) || title.includes(c));
            if (found) {
              setPrimaryKeyword(found);
            } else if (titleParts.length > 1) {
              const secondary = titleParts[1].trim().toLowerCase();
              if (secondary.length > 3 && !secondary.includes(titleClean.toLowerCase())) {
                setPrimaryKeyword(secondary);
              }
            }
          }
        }
        const lowerUrl = targetUrl.toLowerCase();
        const lowerTitle = (data.pageTitle || '').toLowerCase();
        if (
          lowerUrl.includes('ecomplete') ||
          lowerUrl.includes('agency') ||
          lowerUrl.includes('consulting') ||
          lowerTitle.includes('strategy') ||
          lowerTitle.includes('consulting') ||
          lowerTitle.includes('services') ||
          lowerTitle.includes('solutions')
        ) {
          setSiteType('service');
          setBusinessCategory('B2B eCommerce & Professional Services');
        }
      }
    } catch {
      // Non-fatal, inspection will also happen on submit
    } finally {
      setIsInspecting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (url.trim().length >= 8) {
        inspectStorefront(url.trim());
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    if (siteType === 'ecommerce' && allowCartJourney && !cartJourneyConfirmed) {
      alert('Please confirm explicit authorization to simulate a cart and checkout journey on the live storefront.');
      return;
    }
    onStartAudit({
      url: inlineInspection?.resolvedUrl || url,
      businessName: businessName || inlineInspection?.pageTitle || '',
      businessCategory,
      targetMarket,
      primaryObjective: 'sales',
      primaryKeyword: primaryKeyword.trim(),
      depth,
      siteType,
      allowCartJourney: siteType === 'service' ? false : allowCartJourney,
      cartJourneyConfirmed: siteType === 'service' ? false : cartJourneyConfirmed
    });
  };

  return (
    <div className="w-full bg-[#f8fafc] text-[#091b42]">
      {/* Smollan Hero Header Section */}
      <section className="bg-[#091b42] text-white border-b border-[#0f2866] pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle geometric grid background pattern reflecting enterprise architecture */}
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(to right, #00e5ff 1px, #091b42 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          {/* Smollan Identity Tagline */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-semibold tracking-wider text-cyan-300">
            <span className="font-bold text-white uppercase tracking-widest text-[11px]">Smollan</span>
            <span className="text-white/40">·</span>
            <span>Digital Commerce Intelligence & Growth Audit</span>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Website Intelligence & Opportunity Audit Gateway
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed text-balance">
              Evaluate prospect storefront conversion velocity, Core Web Vitals, checkout friction, and catalog SEO. Generate executive diagnostic decks and tailored client pitch strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Main Audit Configuration Form Container */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Step 1: Website Model & Archetype */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Website Model & Business Archetype
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option A: E-Commerce Storefront */}
                <button
                  type="button"
                  onClick={() => setSiteType('ecommerce')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                    siteType === 'ecommerce'
                      ? 'border-[#0f2866] bg-[#091b42]/5 ring-2 ring-[#0f2866]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${siteType === 'ecommerce' ? 'bg-[#0f2866] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-slate-900">E-Commerce Storefront</span>
                      {siteType === 'ecommerce' && <CheckCircle2 className="w-4 h-4 text-[#0f2866] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Physical products, SKU catalogs, cart & checkout journeys, and inventory conversion.
                    </p>
                  </div>
                </button>

                {/* Option B: Service-Based / B2B Website */}
                <button
                  type="button"
                  onClick={() => {
                    setSiteType('service');
                    setAllowCartJourney(false);
                    setCartJourneyConfirmed(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                    siteType === 'service'
                      ? 'border-[#0f2866] bg-[#091b42]/5 ring-2 ring-[#0f2866]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${siteType === 'service' ? 'bg-[#0f2866] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-slate-900">Service-Based / B2B Website</span>
                      {siteType === 'service' && <CheckCircle2 className="w-4 h-4 text-[#0f2866] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Agencies, consulting, SaaS, professional services, and lead generation. Bypasses product SKU evaluations.
                    </p>
                  </div>
                </button>

              </div>
            </div>

            {/* Step 2: Target Storefront URL Input */}
            <div className="space-y-2">
              <label htmlFor="storefront-url" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Target URL
              </label>
              <div className="relative rounded-xl border-2 border-slate-300 focus-within:border-[#0f2866] focus-within:ring-2 focus-within:ring-[#0f2866]/20 transition-all bg-white flex items-center overflow-hidden">
                <div className="pl-4 pr-2 text-slate-400 shrink-0">
                  <Globe className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  id="storefront-url"
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={siteType === 'service' ? "https://www.agencyservices.com" : "https://www.prospectstore.com"}
                  className="w-full py-3.5 pr-4 text-base sm:text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                {isInspecting && (
                  <div className="pr-4 shrink-0 text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    <span>Validating...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Inline Verification Result Pill (If Verified) */}
            {inlineInspection && inlineInspection.success && (
              <div className="bg-[#f0f9ff] border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3.5 min-w-0">
                  {inlineInspection.screenshotUrl ? (
                    <div className="w-16 h-11 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-sm">
                      <img
                        src={inlineInspection.screenshotUrl}
                        alt="Storefront preview"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          if (inlineInspection.fallbackScreenshotUrl) {
                            (e.target as HTMLImageElement).src = inlineInspection.fallbackScreenshotUrl;
                          }
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{inlineInspection.pageTitle || inlineInspection.domain}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5">
                      <span>Platform: <strong className="text-slate-800">{inlineInspection.platform || 'Custom'}</strong></span>
                      <span>·</span>
                      <span>TTFB: <strong className="text-slate-800">{inlineInspection.responseTimeMs}ms</strong></span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium">SSL Secure</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                  Target Verified
                </div>
              </div>
            )}

            {/* Step 3: Context & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Brand Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={siteType === 'service' ? "e.g. Apex Digital" : "e.g. Reebok SA"}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0f2866] focus:ring-1 focus:ring-[#0f2866]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  {siteType === 'service' ? 'Primary Service Keyword' : 'Product / SKU Keyword'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={primaryKeyword}
                    onChange={(e) => setPrimaryKeyword(e.target.value)}
                    placeholder={siteType === 'service' ? "e.g. cloud consulting" : "e.g. running shoes"}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0f2866] focus:ring-1 focus:ring-[#0f2866]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Industry
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0f2866] focus:ring-1 focus:ring-[#0f2866] bg-white"
                >
                  <option value="B2B eCommerce & Professional Services">B2B eCommerce & Professional Services</option>
                  <option value="Digital Agency & Technology Consulting">Digital Agency & Technology Consulting</option>
                  <option value="Fashion & Retail">Fashion & Apparel</option>
                  <option value="FMCG & Grocery">FMCG & Grocery</option>
                  <option value="Outdoor & Sporting">Outdoor & Sporting Goods</option>
                  <option value="Technology & Electronics">Technology & Consumer Electronics</option>
                  <option value="Home & Living">Home, Furniture & Living</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="Omnichannel Department Store">Omnichannel Department Store</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Target Market
                </label>
                <select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0f2866] focus:ring-1 focus:ring-[#0f2866] bg-white"
                >
                  <option value="South Africa">South Africa (ZAR)</option>
                  <option value="Sub-Saharan Africa">Sub-Saharan Africa</option>
                  <option value="United Kingdom & Europe">United Kingdom & Europe</option>
                  <option value="Global / Multi-Region">Global / Multi-Region</option>
                </select>
              </div>
            </div>

            {/* Step 4: Audit Depth Selection */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                3. Audit Depth & Analysis Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Quick Snapshot */}
                <button
                  type="button"
                  onClick={() => setDepth('quick')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    depth === 'quick'
                      ? 'border-[#0f2866] bg-[#091b42]/5 ring-1 ring-[#0f2866]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Quick Snapshot</span>
                    <span className="text-[11px] font-mono text-slate-500">~15 sec</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Storefront TTFB, Core Web Vitals, mobile viewport check, and baseline SSL.
                  </p>
                </button>

                {/* 12-Factor Executive Audit (Recommended) */}
                <button
                  type="button"
                  onClick={() => setDepth('standard')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    depth === 'standard'
                      ? 'border-[#0f2866] bg-[#091b42]/5 ring-2 ring-[#0f2866]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#091b42] flex items-center gap-1.5">
                      <span>12-Factor Executive</span>
                      <span className="text-[10px] font-bold text-[#00b4d8] bg-[#00b4d8]/10 px-1.5 py-0.2 rounded">Recommended</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">~45 sec</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Full conversion evaluation, lead/cart friction, Core Web Vitals, and sales opportunity deck.
                  </p>
                </button>

                {/* Deep Diagnostic */}
                <button
                  type="button"
                  onClick={() => setDepth('deep')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    depth === 'deep'
                      ? 'border-[#0f2866] bg-[#091b42]/5 ring-1 ring-[#0f2866]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Deep Diagnostic</span>
                    <span className="text-[11px] font-mono text-slate-500">~90 sec</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Deep asset waterfall, third-party script bloat, competitive benchmark gap, and code-level findings.
                  </p>
                </button>

              </div>
            </div>

            {/* Step 5: Safe Crawling & Optional Cart Journey */}
            {siteType === 'service' ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 flex items-start gap-3 text-xs text-sky-900">
                <Building2 className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-sky-950">
                    Product Page & Cart Simulation Bypassed (Service-Based Site Mode Active)
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Product detail page (PDP) evaluations and add-to-cart simulations are automatically bypassed for service-based websites. The audit will focus on service detail pages (SDP), consultation lead forms, and brand credibility signals.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCartJourney}
                    onChange={(e) => setAllowCartJourney(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#0f2866] focus:ring-[#0f2866] border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900">
                      Include Cart & Checkout Step Simulation (Optional)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Simulates adding a test item to cart and checking checkout availability.
                    </p>
                  </div>
                </label>

                {allowCartJourney && (
                  <div className="pl-7 pt-1 space-y-2 border-t border-slate-200 mt-2">
                    <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Running live cart actions triggers the prospect store's analytics and retargeting pixels.</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cartJourneyConfirmed}
                        onChange={(e) => setCartJourneyConfirmed(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#0f2866] focus:ring-[#0f2866] border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">
                        I confirm explicit authorization to simulate a cart and checkout journey on this prospect store.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Launch Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Deterministic weighted scoring · SSRF-protected sandboxed crawler</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#091b42] hover:bg-[#0f2866] text-white font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Initiating Storefront Inspection...' : 'Verify and Launch Audit'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>
      </section>

      {/* Smollan Core Capabilities & 12-Factor Value Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#091b42]">
              What the Smollan Intelligence Engine Evaluates
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              This deterministic evaluation framework benchmarks prospect storefronts against tier-1 digital commerce standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Capability 1 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Conversion Rate Optimization (CRO)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Evaluates product page hierarchy, mobile tap target accessibility, sticky add-to-cart affordances, and friction in cart checkout.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Core Web Vitals & Speed
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Measures LCP, CLS, INP, TTFB, and uncompressed hero assets against Google Web Vitals and commerce speed benchmarks.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Catalog & Structured SEO
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspects JSON-LD schema markup, OpenGraph assets, canonical routing, meta title indexability, and organic product visibility.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Executive Sales Pitch Studio
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generates boardroom-ready executive summaries, revenue lift projections, and tailored outreach emails for sales directors.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & Enterprise Footprint Banner */}
      <section className="bg-slate-100 border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      </section>
    </div>
  );
};
