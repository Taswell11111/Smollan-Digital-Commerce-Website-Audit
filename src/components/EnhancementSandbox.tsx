import React, { useState, useEffect } from 'react';
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
  CreditCard, 
  Truck, 
  RotateCcw, 
  Eye, 
  SlidersHorizontal, 
  Check, 
  Building2, 
  Briefcase, 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  Award, 
  Zap, 
  Target, 
  ArrowUpRight,
  PhoneCall,
  CheckCircle,
  Star,
  FileDown,
  Download,
  Flame,
  ThumbsUp,
  Plus,
  Heart,
  Package,
  MessageSquare,
  X,
  Code2,
  Cpu,
  Send,
  Database
} from 'lucide-react';
import { AuditRecord } from '../types';
import { ProductReviews } from './ProductReviews';

interface EnhancementSandboxProps {
  currentAudit?: AuditRecord | null;
}

export type SiteArchetype = 'b2b_service' | 'b2c_retail';

export const EnhancementSandbox: React.FC<EnhancementSandboxProps> = ({ currentAudit }) => {
  // Detect website archetype dynamically based on Business Model & Industry
  const detectArchetype = (audit?: AuditRecord | null): SiteArchetype => {
    if (!audit) return 'b2b_service';
    
    const cat = (audit.businessCategory || '').toLowerCase();
    const name = (audit.businessName || '').toLowerCase();
    const url = (audit.url || '').toLowerCase();
    
    // 1. Explicit Category Mapping (Highest Priority)
    if (
      cat.includes('professional services') ||
      cat.includes('consulting') ||
      cat.includes('agency') ||
      cat.includes('b2b') ||
      cat.includes('saas') ||
      cat.includes('industrial') ||
      cat.includes('enterprise') ||
      cat.includes('logistics') ||
      cat.includes('corporate')
    ) {
      return 'b2b_service';
    }

    if (
      cat.includes('retail') ||
      cat.includes('fashion') ||
      cat.includes('fmcg') ||
      cat.includes('grocery') ||
      cat.includes('sporting') ||
      cat.includes('electronics') ||
      cat.includes('furniture') ||
      cat.includes('beauty') ||
      cat.includes('department store') ||
      cat.includes('e-commerce') ||
      cat.includes('consumer')
    ) {
      return 'b2c_retail';
    }

    // 2. Heuristic Fallbacks (URL/Name keywords)
    if (
      url.includes('agency') ||
      url.includes('consulting') ||
      url.includes('solutions') ||
      url.includes('services') ||
      name.includes('agency') ||
      name.includes('consulting') ||
      name.includes('solutions') ||
      name.includes('group') ||
      name.includes('holdings')
    ) {
      return 'b2b_service';
    }

    // 3. Page Type Discovery Fallback
    const pages = audit.pagesInspected || [];
    if (pages.length > 0) {
      const hasCommerceSignifiers = pages.some(
        p => p.pageType === 'product' || p.pageType === 'cart' || p.pageType === 'checkout' || p.hasPrice
      );
      if (hasCommerceSignifiers) {
        return 'b2c_retail';
      }
    }

    return 'b2b_service'; // Default to B2B for unknown
  };

  const [siteArchetype, setSiteArchetype] = useState<SiteArchetype>(() => detectArchetype(currentAudit));
  const [activeTab, setActiveTab] = useState<'homepage' | 'pdp' | 'plp' | 'cart'>('pdp');
  const [activeMode, setActiveMode] = useState<'current' | 'enhanced' | 'split'>('current');
  
  // B2C Retail State
  const [selectedSize, setSelectedSize] = useState<string>('UK 8');
  const [showSizeModal, setShowSizeModal] = useState<boolean>(false);
  const [unitsLeft, setUnitsLeft] = useState<number>(3);
  const [appDownloadNotice, setAppDownloadNotice] = useState<boolean>(false);

  // B2B Service State
  const [selectedScope, setSelectedScope] = useState<string>('Headless Storefront & Core Web Vitals Sprint (4 Weeks)');
  const [b2bSlotsLeft, setB2bSlotsLeft] = useState<number>(2);
  const [discoverySubmitted, setDiscoverySubmitted] = useState<boolean>(false);
  const [discoveryForm, setDiscoveryForm] = useState({
    name: '',
    email: '',
    company: '',
    currentPlatform: 'Shopify Plus',
    primaryGoal: 'Accelerate mobile conversion rate & solve Core Web Vitals lag'
  });

  // Shared state
  const [ppDownloadedToast, setPpDownloadedToast] = useState<boolean>(false);
  const [bundleAdded, setBundleAdded] = useState<boolean>(false);
  const [bundleItems, setBundleItems] = useState<{ [id: string]: boolean }>({
    'item-1': true,
    'item-2': true,
    'item-3': false,
  });

  const SIZES_STOCK: Record<string, number> = {
    'UK 6': 2,
    'UK 8': 3,
    'UK 10': 7,
    'UK 12': 0,
  };
  const currentSizeStock = SIZES_STOCK[selectedSize] ?? 3;

  useEffect(() => {
    setSiteArchetype(detectArchetype(currentAudit));
  }, [currentAudit]);

  // Derive dynamic brand information from active audit
  const brandName = currentAudit?.businessName || (siteArchetype === 'b2b_service' ? 'eComplete Commerce' : 'Heritage Storefront');
  const brandUrl = currentAudit?.url || 'https://www.ecompletecommerce.com';
  const categoryResults = currentAudit?.categoryResults || {};
  const catName = currentAudit?.businessCategory || (siteArchetype === 'b2b_service' ? 'Professional Services' : 'Retail');
  
  // Practical Keyword: Prioritize user keyword, then sanitized category, then generic
  const practicalKeyword = currentAudit?.primaryKeyword || 
    catName.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(s => s.length > 3)[0] || 
    'Solution';

  // Identify a real product page from the audit for B2C context
  const realProductPage = currentAudit?.pagesInspected?.find(p => p.pageType === 'product') || currentAudit?.pagesInspected?.[0];
  const productTitle = realProductPage?.title || `${brandName} Signature ${practicalKeyword}`;
  const productUrl = realProductPage?.url || brandUrl;
  const productScreenshot = realProductPage?.screenshotUrl || `https://s0.wp.com/mshots/v1/${encodeURIComponent(productUrl)}?w=1200`;
  const productFallbackScreenshot = realProductPage?.fallbackScreenshotUrl || `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(productUrl)}`;
  
  // Identify category and cart pages
  const realCategoryPage = currentAudit?.pagesInspected?.find(p => p.pageType === 'category');
  const realCartPage = currentAudit?.pagesInspected?.find(p => p.pageType === 'cart' || p.pageType === 'checkout');
  const categoryScreenshot = realCategoryPage?.screenshotUrl || `https://s0.wp.com/mshots/v1/${encodeURIComponent(realCategoryPage?.url || brandUrl)}?w=1200`;
  const cartScreenshot = realCartPage?.screenshotUrl || `https://s0.wp.com/mshots/v1/${encodeURIComponent(realCartPage?.url || brandUrl)}?w=1200`;
  const categoryFallbackScreenshot = realCategoryPage?.fallbackScreenshotUrl || `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(realCategoryPage?.url || brandUrl)}`;
  const cartFallbackScreenshot = realCartPage?.fallbackScreenshotUrl || `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(realCartPage?.url || brandUrl)}`;
  
  // Safe scores from real audit results
  const pdpScore = categoryResults['Product detail pages']?.score ?? 50;
  const pdpEnhanced = categoryResults['Product detail pages']?.enhancedScore ?? 92;
  const mobileScore = categoryResults['Mobile usability and responsive behaviour']?.score ?? 67;
  const mobileEnhanced = categoryResults['Mobile usability and responsive behaviour']?.enhancedScore ?? 94;
  const cartScore = categoryResults['Cart and mini-cart']?.score ?? 62;
  const cartEnhanced = categoryResults['Cart and mini-cart']?.enhancedScore ?? 92;
  const headerScore = categoryResults['Header, navigation and footer']?.score ?? 58;
  const headerEnhanced = categoryResults['Header, navigation and footer']?.enhancedScore ?? 88;

  // Context-specific score comparison
  const dynamicScoreComparison = siteArchetype === 'b2b_service' ? [
    { 
      area: 'Inbound Discovery & Capabilities Architecture', 
      current: pdpScore, 
      enhanced: Math.max(pdpScore, pdpEnhanced), 
      uplift: `+${Math.max(0, Math.max(pdpScore, pdpEnhanced) - pdpScore)} pts` 
    },
    { 
      area: 'Mobile Usability & Technical Responsiveness', 
      current: mobileScore, 
      enhanced: Math.max(mobileScore, mobileEnhanced), 
      uplift: `+${Math.max(0, Math.max(mobileScore, mobileEnhanced) - mobileScore)} pts` 
    },
    { 
      area: 'Enterprise Scope Transparency & SLA Clarity', 
      current: cartScore, 
      enhanced: Math.max(cartScore, cartEnhanced), 
      uplift: `+${Math.max(0, Math.max(cartScore, cartEnhanced) - cartScore)} pts` 
    },
    { 
      area: 'Enterprise Trust & Case Study Credibility', 
      current: headerScore, 
      enhanced: Math.max(headerScore, headerEnhanced), 
      uplift: `+${Math.max(0, Math.max(headerScore, headerEnhanced) - headerScore)} pts` 
    },
  ] : [
    { 
      area: 'Product detail pages (PDP & Scarcity)', 
      current: pdpScore, 
      enhanced: Math.max(pdpScore, pdpEnhanced), 
      uplift: `+${Math.max(0, Math.max(pdpScore, pdpEnhanced) - pdpScore)} pts` 
    },
    { 
      area: 'Reviews & Social Proof Density', 
      current: mobileScore, 
      enhanced: Math.max(mobileScore, mobileEnhanced), 
      uplift: `+${Math.max(0, Math.max(mobileScore, mobileEnhanced) - mobileScore)} pts` 
    },
    { 
      area: 'Cross-Sell (What Goes Well With)', 
      current: cartScore, 
      enhanced: Math.max(cartScore, cartEnhanced), 
      uplift: `+${Math.max(0, Math.max(cartScore, cartEnhanced) - cartScore)} pts` 
    },
    { 
      area: 'Product Profile (PP) & Trust Assets', 
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
    .toUpperCase() || 'ECC';

  // Live screenshot URL from inspected URL
  const homepageScreenshot = `https://s0.wp.com/mshots/v1/${encodeURIComponent(brandUrl)}?w=1200`;
  const fallbackScreenshot = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(brandUrl)}`;

  // Download Practice Profile / Product Profile (PP) Handler
  const handleDownloadPP = () => {
    const isB2B = siteArchetype === 'b2b_service';
    const docTitle = isB2B 
      ? `${brandName} — Enterprise eCommerce Growth Architecture & Practice Profile (PP)` 
      : `${brandName} Official Product Profile & Technical Specification Sheet (PP)`;
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #002157; background: #ffffff; line-height: 1.5; }
    .header { border-bottom: 3px solid #002157; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: #002157; color: #00e5ff; padding: 4px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
    h1 { margin: 10px 0 4px; font-size: 24px; font-weight: 900; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .meta-item strong { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .meta-item span { font-size: 14px; font-weight: 800; color: #002157; }
    .specs-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .specs-table th, .specs-table td { padding: 12px 14px; border: 1px solid #cbd5e1; text-align: left; font-size: 13px; }
    .specs-table th { background: #002157; color: #ffffff; font-weight: 800; }
    .specs-table tr:nth-child(even) { background: #f8fafc; }
    .bundle-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 10px; margin-bottom: 30px; }
    .bundle-box h4 { margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 800; }
    .footer { font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Smollan Connected Commerce · ${isB2B ? 'Practice Profile (PP)' : 'Product Profile (PP)'}</span>
      <h1>${brandName} — ${isB2B ? 'Enterprise eCommerce Growth & Storefront Architecture Sprints' : 'Signature SKU Specification'}</h1>
      <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Target Domain: ${brandUrl} · Specification Reference: PP-${Date.now().toString().slice(-6)}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 18px; font-weight: 900; color: #002157;">${isB2B ? 'Enterprise SLA' : 'R 899.00'}</div>
      <div style="font-size: 11px; color: #059669; font-weight: 800;">Verified Technical Specification</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>${isB2B ? 'Practice Identifier' : 'SKU Identifier'}</strong><span>${isB2B ? 'PRAC-ECC-ARCH-2026' : `SKU-${brandInitials}-2026`}</span></div>
    <div class="meta-item"><strong>${isB2B ? 'Squad Availability' : 'Units Left'}</strong><span>${isB2B ? `${b2bSlotsLeft} Squad Slots (Midrand & CT)` : `${unitsLeft} units (Midrand DC)`}</span></div>
    <div class="meta-item"><strong>${isB2B ? 'Enterprise NPS' : 'Customer Consensus'}</strong><span>${isB2B ? '4.9 / 5.0 (24 Engagements)' : '4.8 / 5.0 (128 reviews)'}</span></div>
    <div class="meta-item"><strong>${isB2B ? 'Delivery SLA' : 'Dispatch SLA'}</strong><span>${isB2B ? 'Sub-2.0s LCP Target & 99.99% Uptime' : '24h Courier Delivery'}</span></div>
  </div>

  <h3>Comprehensive Operational &amp; Technical Attributes</h3>
  <table class="specs-table">
    <tr><th style="width: 30%;">Attribute</th><th>Verified Specification Details</th></tr>
    <tr><td>Target Entity</td><td>${brandName} (${brandUrl})</td></tr>
    ${isB2B ? `
    <tr><td>Service Delivery Model</td><td>Dedicated Senior Engineering &amp; CRO Squads (Next.js, React 19, Shopify Plus)</td></tr>
    <tr><td>Core Web Vitals Guarantee</td><td>Contractual SLA targeting LCP &lt; 2.0s, CLS &lt; 0.05, and INP &lt; 150ms on mobile viewports</td></tr>
    <tr><td>Payment Orchestration</td><td>Multi-currency South African Gateway integration (Ozow, PayFlex, Peach Payments, PayFast)</td></tr>
    <tr><td>Inventory &amp; ERP Sync</td><td>Automated middleware for omnichannel warehouse routing and real-time inventory updates</td></tr>
    <tr><td>Security &amp; Regulatory Standard</td><td>POPIA Compliant, 3D Secure 2.2, zero third-party script leakage</td></tr>
    ` : `
    <tr><td>Scarcity Threshold Widget</td><td>Active · Real-time inventory deduction alert (${unitsLeft} units left)</td></tr>
    <tr><td>Product Profile (PP) Compliance</td><td>Standardized spec sheet, material composition &amp; care instructions</td></tr>
    <tr><td>Social Proof &amp; Verified Reviews</td><td>Structured Review Schema (JSON-LD), buyer verified ratings, 94% true-to-size</td></tr>
    <tr><td>Curated Cross-Sell (&quot;What Goes Well With&quot;)</td><td>Integrated 3-item dynamic bundle algorithm with multi-SKU checkout</td></tr>
    <tr><td>Core Web Vitals Readiness</td><td>Rendered image responsive srcset, LCP &lt; 2.0s target, zero layout shift</td></tr>
    `}
  </table>

  <div class="bundle-box">
    <h4>${isB2B ? 'Recommended Complementary Modules' : 'Curated Cross-Sell Pairings ("What Goes Well With")'}</h4>
    <p style="font-size: 12px; color: #166534; margin: 0;">
      ${isB2B 
        ? 'Frequently paired enterprise capabilities: (1) Core Web Vitals Velocity Acceleration Sprint, (2) Multi-Warehouse ERP & Logistics Middleware, and (3) Custom South African Payment Gateway Orchestration.'
        : 'Recommended bundle items verified for this SKU: Classic Denim Overshirt, 100% Organic Cotton Heavyweight Crewneck, and Full-Grain Leather Everyday Belt.'}
    </p>
  </div>

  <div class="footer">
    Generated via Smollan Digital Commerce Intelligence Platform · Verified against ${brandUrl}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    const safeName = (brandName || 'Entity').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadAnchor.setAttribute('download', `${safeName}_${isB2B ? 'Practice_Profile_PP' : 'Product_Profile_PP'}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setPpDownloadedToast(true);
    setTimeout(() => setPpDownloadedToast(false), 6000);
  };

  // Pricing & Bundle Calculations (Dual Context)
  const isB2B = siteArchetype === 'b2b_service';

  // B2C Retail Pricing
  const retailBasePrice = 899;
  const retailItem1Price = 549; // Overshirt
  const retailItem2Price = 299; // Heavyweight Tee
  const retailItem3Price = 399; // Leather Belt

  // B2B Service Pricing
  const b2bBasePrice = 45000; // Base Sprint Scope
  const b2bItem1Price = 18500; // Core Web Vitals Speed Sprint
  const b2bItem2Price = 24000; // Multi-Warehouse ERP Middleware
  const b2bItem3Price = 14500; // Payment Gateway Orchestration

  const activeBasePrice = isB2B ? b2bBasePrice : retailBasePrice;
  const activeItem1Price = isB2B ? b2bItem1Price : retailItem1Price;
  const activeItem2Price = isB2B ? b2bItem2Price : retailItem2Price;
  const activeItem3Price = isB2B ? b2bItem3Price : retailItem3Price;

  const bundleTotal = activeBasePrice +
    (bundleItems['item-1'] ? activeItem1Price : 0) +
    (bundleItems['item-2'] ? activeItem2Price : 0) +
    (bundleItems['item-3'] ? activeItem3Price : 0);

  const bundleSavings = Math.round(bundleTotal * 0.15); // 15% bundle discount
  const finalBundlePrice = bundleTotal - bundleSavings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notification for PP Download */}
      {ppDownloadedToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#002157] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#00e5ff] flex items-center gap-3 animate-in slide-in-from-top-4">
          <FileDown className="w-5 h-5 text-[#00e5ff]" />
          <div>
            <div className="font-bold text-xs">
              {isB2B ? 'Practice Profile (PP) Specification Downloaded!' : 'Product Profile (PP) Downloaded!'}
            </div>
            <div className="text-[11px] text-slate-300">
              {isB2B
                ? 'Technical SLA and enterprise scope specification saved to your device.'
                : 'Detailed SKU spec sheet saved to your device.'}
            </div>
          </div>
          <button onClick={() => setPpDownloadedToast(false)} className="text-slate-400 hover:text-white ml-2 text-xs">✕</button>
        </div>
      )}

      {/* 1. Header Target Storefront / Service Banner */}
      <div className="bg-[#002157] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-[#00e5ff] font-extrabold mb-1">
            <Globe className="w-4 h-4" />
            <span>
              {isB2B
                ? 'B2B Professional Services & Solutions Architecture Sandbox'
                : 'Interactive Storefront Enhancement Sandbox · Smollan Solution'}
            </span>
            <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40 font-bold">
              Illustrative concept — tailored to audited domain profile
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

        {/* Global Controls: Archetype Selector & Enhancement Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {/* Site Archetype Selector */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-cyan-500/30 shadow-inner">
            <button
              onClick={() => setSiteArchetype('b2b_service')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                siteArchetype === 'b2b_service'
                  ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Audit and enhance as a B2B Professional Services / Agency / Technology website"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>B2B Services</span>
            </button>
            <button
              onClick={() => setSiteArchetype('b2c_retail')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                siteArchetype === 'b2c_retail'
                  ? 'bg-[#00e5ff] text-[#002157] font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Audit and enhance as a B2C Retail Commerce Storefront"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>B2C Retail</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveMode('current')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeMode === 'current'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Baseline Site
            </button>
            <button
              onClick={() => setActiveMode('enhanced')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeMode === 'enhanced'
                  ? 'bg-[#00e5ff] text-[#002157] shadow-lg font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smollan Solution</span>
            </button>
            <button
              onClick={() => setActiveMode(activeMode === 'split' ? 'enhanced' : 'split')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                activeMode === 'split'
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Score Impact by Journey Area */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <span className="font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span>Deterministic Score Uplift ({isB2B ? 'B2B Inbound & Services' : 'B2C Commerce & CRO'})</span>
          </span>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-slate-400 rounded-full" />
              <span className="text-slate-500">Baseline Performance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-[#00e5ff] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
              <span className="text-cyan-600">Smollan Target Performance</span>
            </div>
          </div>
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
                {/* Target Enhanced Bar */}
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

      {/* 3. Multi-Page Architecture Viewport Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
        {/* Navigation Tabs */}
        <div className="bg-slate-100/80 p-2 sm:p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('homepage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'homepage'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>
                {isB2B
                  ? '1. Homepage & Inbound Conversion Flow'
                  : '1. Homepage & Storefront Landing'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pdp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'pdp'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isB2B ? (
                <Briefcase className="w-3.5 h-3.5" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
              <span>
                {isB2B
                  ? '2. Service / Practice Detail Page (SDP)'
                  : '2. Product Detail Page (PDP) · Smollan Suite'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('plp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'plp'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {isB2B
                  ? '3. Solutions & Case Studies Matrix'
                  : '3. Catalogue & Listings (PLP)'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'cart'
                  ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isB2B ? (
                <Calendar className="w-3.5 h-3.5" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              <span>
                {isB2B
                  ? '4. Discovery & RFP Qualification Funnel'
                  : '4. Mini-Cart & Delivery Threshold'}
              </span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500 pr-2">
            Mode: <span className={activeMode === 'enhanced' ? 'text-cyan-700' : 'text-amber-700'}>
              {activeMode === 'enhanced' ? '✨ Smollan Solution Active' : '▲ Baseline Site'}
            </span>
          </div>
        </div>

        {/* TAB 1: HOMEPAGE VIEWPORT */}
        {activeTab === 'homepage' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  {isB2B ? 'B2B Enterprise Inbound Architecture' : 'Storefront Homepage Inspection'}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {brandName} Live Homepage vs Smollan Conversion Layer
                </h3>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  Illustrative concept — not a snapshot of the prospect&apos;s site.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Simulate viewport:</span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                  1200 x 800 Desktop &amp; Tablet
                </span>
              </div>
            </div>

            {/* Interactive Browser Mockup with Real Website Snapshot */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 ml-2 truncate max-w-sm">
                    {brandName} {isB2B ? 'Enterprise Solutions Portal' : 'Flagship Storefront'}
                  </span>
                </div>
                <div className="bg-slate-900 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-700">
                  🔒 {brandUrl}
                </div>
                <span className="text-[11px] text-cyan-400 font-bold">
                  {activeMode === 'enhanced' ? 'Enhanced Overlays Active' : 'Native View'}
                </span>
              </div>

              {/* Viewport Content */}
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                <img
                  src={homepageScreenshot}
                  alt={`${brandName} live homepage snapshot`}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackScreenshot;
                  }}
                />

                {/* Adaptive Enhanced Overlays */}
                {activeMode === 'enhanced' && (
                  isB2B ? (
                    <>
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#002157] via-[#091b42] to-[#002157] text-white py-2 px-4 border-b border-cyan-400/40 flex items-center justify-between text-xs shadow-md animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 font-bold text-cyan-300">
                          <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
                          <span>Smollan &amp; eComplete Commerce Accelerator: Enterprise Digital Maturity Assessment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab('cart')}
                            className="bg-[#00e5ff] text-[#002157] px-3 py-1 rounded-lg font-black text-[11px] shadow hover:bg-white transition flex items-center gap-1"
                          >
                            <span>Book Discovery Session</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-11/12 max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-cyan-500/40 p-4 text-slate-900 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 mb-2 font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-cyan-800 font-black">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                            Predictive Practice Navigator · Smollan Commerce Accelerator
                          </span>
                          <span className="text-[10px] text-slate-400">Enterprise Solutions</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div
                            onClick={() => setActiveTab('pdp')}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 transition cursor-pointer flex items-center gap-2.5"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#002157] text-[#00e5ff] flex items-center justify-center font-black text-[10px] shrink-0">
                              B2B
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">Storefront Engineering</div>
                              <div className="text-[10px] text-emerald-700 font-semibold truncate">React, Next.js &amp; Shopify Plus</div>
                            </div>
                          </div>
                          <div
                            onClick={() => setActiveTab('pdp')}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 transition cursor-pointer flex items-center gap-2.5"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-900 text-emerald-300 flex items-center justify-center font-black text-[10px] shrink-0">
                              CRO
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">Conversion Optimization</div>
                              <div className="text-[10px] text-emerald-700 font-semibold truncate">Diagnostic Audits &amp; UX Sprints</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 inset-x-4 max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-around text-xs">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#00e5ff]" />
                          <span>Enterprise Commerce Track Record</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span>Dedicated Senior Technical Squads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#00e5ff]" />
                          <span>Smollan Connected Commerce Network</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#002157] via-cyan-950 to-[#002157] text-white py-2 px-4 border-b border-cyan-400/40 flex items-center justify-between text-xs shadow-md animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 font-bold text-cyan-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Free Express Delivery on orders over R 450</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="bg-red-600 px-2 py-0.5 rounded font-black text-white">Code: CONNECT2026</span>
                          <span className="font-mono text-slate-300">Active Campaign</span>
                        </div>
                      </div>

                      {/* Floating Scarcity Alert on Homepage */}
                      <div className="absolute top-12 right-4 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl shadow-lg border border-amber-300 flex items-center gap-1.5 text-xs font-black animate-pulse">
                        <Flame className="w-4 h-4" />
                        <span>High Demand: Only {unitsLeft} units left in regional warehouse</span>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE DETAIL PAGE (SDP) FOR B2B OR PRODUCT DETAIL PAGE (PDP) FOR B2C */}
        {activeTab === 'pdp' && (
          <div className="p-6 sm:p-8 space-y-10">
            {isB2B ? (
              /* =========================================================================
                 B2B PROFESSIONAL SERVICES / AGENCY DETAIL PAGE (SDP)
                 Tailored specifically for eComplete Commerce & enterprise services
                 ========================================================================= */
              <div className="space-y-10">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#002157] text-[#00e5ff] flex items-center justify-center font-black text-lg tracking-tight shadow">
                      {brandInitials}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold block">
                        Enterprise Practice SKU · Strategic Capabilities
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        {brandName} Strategic eCommerce Growth &amp; Storefront Architecture Sprints
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPP}
                      className="bg-[#002157] hover:bg-[#091b42] text-white border border-[#00e5ff]/40 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                      title="Download Enterprise Practice Profile (PP) &amp; Technical SLA Sheet"
                    >
                      <FileDown className="w-4 h-4 text-[#00e5ff]" />
                      <span>Download Practice Profile (PP)</span>
                    </button>
                  </div>
                </div>

                {/* Main SDP Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column: Technical Architecture & Credentials (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="aspect-square bg-gradient-to-br from-slate-900 via-[#002157] to-slate-950 rounded-3xl overflow-hidden border border-cyan-500/30 relative flex flex-col justify-between p-6 shadow-xl text-white">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/30">
                          Enterprise Architecture
                        </span>
                        
                        {/* Squad Availability Scarcity Badge */}
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow flex items-center gap-1 animate-pulse">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>Only {b2bSlotsLeft} Squad Slots Left!</span>
                        </span>
                      </div>

                      <div className="text-center space-y-4 my-auto">
                        <div className="w-24 h-24 mx-auto rounded-3xl bg-cyan-500/10 border-2 border-[#00e5ff]/40 flex items-center justify-center shadow-2xl">
                          <Cpu className="w-12 h-12 text-[#00e5ff]" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-white">eCommerce Growth Stack</h4>
                          <p className="text-xs text-cyan-200/80 mt-1 max-w-xs mx-auto">
                            Headless frontends, high-concurrency checkout, and real-time inventory synchronization.
                          </p>
                        </div>
                      </div>

                      {/* Tech Stack Chips */}
                      <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                        {['Next.js', 'React 19', 'Shopify Plus', 'Commercelayer', 'Ozow / PayFlex', 'Algolia'].map((tech) => (
                          <span key={tech} className="text-[9px] font-mono bg-slate-800/90 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Enterprise Practice Profile (PP) Highlights Card */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-slate-900 font-black">
                          <FileText className="w-4 h-4 text-cyan-600" />
                          <span>Practice Profile (PP) Specifications</span>
                        </span>
                        <button onClick={handleDownloadPP} className="text-cyan-700 hover:underline font-bold text-[11px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>Full SLA Spec (HTML)</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 pt-1">
                        <div>Delivery Model: <strong className="text-slate-900 block font-bold">Senior Dedicated Squads</strong></div>
                        <div>Core SLA: <strong className="text-emerald-700 block font-bold">Sub-2.0s Mobile LCP</strong></div>
                        <div>Compliance: <strong className="text-slate-900 block font-bold">POPIA &amp; 3D Secure 2.2</strong></div>
                        <div>Availability: <strong className="text-slate-900 block font-bold">Midrand &amp; Cape Town Hubs</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scope Selection, Capacity Scarcity & Paired Capabilities (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-black">
                          Verified Enterprise Service Offering
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full font-bold border border-emerald-200">
                          ● Active Smollan Solution
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {brandName} Commerce Growth &amp; Technical Storefront Modernization
                      </h1>

                      {/* Reviews Star Summary & Consensus */}
                      <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="font-extrabold text-slate-900">4.9</span>
                        <span className="text-slate-400">·</span>
                        <button
                          onClick={() => {
                            const el = document.getElementById('customer-reviews-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-cyan-700 hover:underline font-bold"
                        >
                          24 Enterprise Engagements
                        </button>
                        <span className="text-slate-400">·</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          100% Contractual SLA Adherence
                        </span>
                      </div>

                      {/* Commercial Sprint Investment */}
                      <div className="space-y-2 mb-5">
                        <div className="flex items-baseline gap-3 text-sm font-mono text-slate-900 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <span className="text-2xl font-black text-[#002157]">R 45,000</span>
                          <span className="text-slate-500 text-xs font-sans">/ 2-Week Accelerated Sprint</span>
                          <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-0.5 rounded ml-auto">
                            TYPICAL ROI: +30% CONVERSION LIFT
                          </span>
                        </div>
                      </div>

                      {/* FEATURE 1: SQUAD CAPACITY & SCARCITY INDICATOR */}
                      {activeMode === 'enhanced' && (
                        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-amber-900 flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-amber-600 fill-current" />
                              <span>Quarterly Squad Capacity: Only {b2bSlotsLeft} Onboarding Slots Open!</span>
                            </span>
                            <span className="text-[11px] font-bold text-amber-800">
                              Midrand &amp; Cape Town Engineering Squads
                            </span>
                          </div>
                          
                          {/* Scarcity Progress Bar */}
                          <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500 animate-pulse"
                              style={{ width: `${(b2bSlotsLeft / 6) * 100}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium">
                            Lock in your technical discovery sprint to guarantee onboarding before next quarterly release freeze.
                          </p>
                        </div>
                      )}

                      {/* Scope Selection Section */}
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                            Select Engagement Scope / Sprint
                          </span>
                          <button 
                            onClick={handleDownloadPP} 
                            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Full SLA &amp; Deliverables
                          </button>
                        </div>

                        <div className="space-y-2">
                          {[
                            { name: 'Diagnostic CRO Audit & UX Sprint (2 Weeks)', desc: 'Full-funnel heatmap audit, Core Web Vitals telemetry & drop-in code fixes' },
                            { name: 'Headless Storefront & Core Web Vitals Sprint (4 Weeks)', desc: 'Next.js storefront migration, sub-2.0s mobile LCP & cart drawer overhaul' },
                            { name: 'Full Omnichannel Architecture Transformation (Quarterly)', desc: 'Multi-warehouse ERP sync, custom payment routing & automated checkout flows' }
                          ].map((scope) => (
                            <button
                              key={scope.name}
                              onClick={() => setSelectedScope(scope.name)}
                              className={`w-full p-3.5 text-left rounded-2xl border transition ${
                                selectedScope === scope.name
                                  ? 'border-[#002157] bg-[#002157] text-white shadow-md ring-2 ring-cyan-400/20'
                                  : 'border-slate-200 text-slate-800 hover:border-slate-400 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs">{scope.name}</span>
                                {selectedScope === scope.name && (
                                  <span className="text-[10px] font-black text-[#00e5ff] uppercase">Selected</span>
                                )}
                              </div>
                              <p className={`text-[11px] mt-0.5 ${selectedScope === scope.name ? 'text-slate-300' : 'text-slate-500'}`}>
                                {scope.desc}
                              </p>
                            </button>
                          ))}
                        </div>

                        {/* Dynamic Squad Availability Box */}
                        <div className="mt-3.5 p-3.5 bg-neutral-900 text-white flex items-center justify-between border-l-4 border-[#00e5ff] rounded-r-2xl transition-all shadow-md">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-400 animate-pulse" />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider block text-white">
                                Senior Squad Ready
                              </span>
                              <span className="text-[11px] text-neutral-300 block">
                                Lead Architect &amp; CRO Specialist available for immediate discovery
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded bg-emerald-600 text-white">
                              {b2bSlotsLeft} Slots Available
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary CTA */}
                      <div className="pt-4 space-y-3">
                        <button 
                          onClick={() => setActiveTab('cart')}
                          className="w-full bg-[#002157] hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 border border-cyan-400/30"
                        >
                          <Send className="w-4 h-4 text-[#00e5ff]" />
                          <span>Request Scope Review &amp; Schedule Technical Discovery</span>
                        </button>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                            Direct Senior Partner Consultation
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Mutual NDA &amp; POPIA Protected
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* FEATURE 2: FREQUENTLY PAIRED CAPABILITIES (COMPLETE THE ENGAGEMENT) */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                        Enterprise Capabilities Recommendation Engine
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        Frequently Paired Technical Modules (Complete The Solution)
                      </h3>
                      <p className="text-xs text-slate-600">
                        High-leverage modules frequently bundled by {brandName} enterprise clients. Bundle and save 15% on the overall sprint fee.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-cyan-100 text-cyan-900 font-bold px-3 py-1 rounded-full border border-cyan-300">
                        Dynamic Scope Discount
                      </span>
                    </div>
                  </div>

                  {/* Paired Module Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'item-1',
                        name: 'Core Web Vitals Velocity Acceleration Sprint',
                        category: 'Speed & Architecture',
                        price: b2bItem1Price,
                        tag: 'High Impact'
                      },
                      {
                        id: 'item-2',
                        name: 'Multi-Warehouse ERP & Logistics Middleware',
                        category: 'Operations & Sync',
                        price: b2bItem2Price,
                        tag: 'Omnichannel'
                      },
                      {
                        id: 'item-3',
                        name: 'Custom South African Payment Gateway Orchestration',
                        category: 'Checkout & POPIA',
                        price: b2bItem3Price,
                        tag: 'Payments'
                      }
                    ].map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setBundleItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                          bundleItems[item.id]
                            ? 'border-cyan-500 bg-white shadow-md ring-2 ring-cyan-500/20'
                            : 'border-slate-200 bg-slate-50/60 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!bundleItems[item.id]}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-[10px] font-black uppercase text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                              {item.tag}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-black text-slate-900">
                            R {item.price.toLocaleString()}
                          </span>
                        </div>

                        <div className="aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-500 font-bold p-3 text-center">
                          <Code2 className="w-6 h-6 text-cyan-700 mb-1" />
                          <span className="text-[11px]">{item.category}</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">SLA Guaranteed · Production Ready</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bundle Total & Add Action */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">
                        Estimated sprint fee (Base Scope + selected paired modules):
                      </div>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span className="text-2xl font-black text-[#002157]">R {finalBundlePrice.toLocaleString()}</span>
                        <span className="line-through text-slate-400 text-sm font-mono">R {bundleTotal.toLocaleString()}</span>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          You Save R {bundleSavings.toLocaleString()} (15% OFF)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setActiveTab('cart');
                        }}
                        className="w-full sm:w-auto bg-[#002157] hover:bg-slate-900 text-[#00e5ff] px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 border border-cyan-400/40"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Proceed with Configured Scope</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* FEATURE 3: VERIFIED ENTERPRISE CLIENT ENDORSEMENTS */}
                <div id="customer-reviews-section">
                  <ProductReviews
                    brandName={brandName}
                    category={catName}
                    itemTitle={`${practicalKeyword} Growth & Architecture Sprint`}
                    archetype="b2b_service"
                  />
                </div>
              </div>
            ) : (
              /* =========================================================================
                 B2C RETAIL PRODUCT DETAIL PAGE (PDP) - SCREENSHOT BASED
                 ========================================================================= */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                      Product Detail Page (PDP) Hygiene
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {productTitle} · Smollan Engagement Suite
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualising conversion-rate recovery overlays on the real product journey.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadPP}
                      className="bg-[#002157] text-[#00e5ff] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download Product Profile (PP)</span>
                    </button>
                    <a
                      href={productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                    >
                      <span>View Live Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 relative">
                  <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 ml-2 truncate max-w-sm">
                        {productTitle}
                      </span>
                    </div>
                    <div className="bg-slate-900 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-700">
                      🔒 {productUrl}
                    </div>
                  </div>

                  <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden group">
                    <img
                      src={productScreenshot}
                      alt={`${brandName} product page snapshot`}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = productFallbackScreenshot;
                      }}
                    />

                    {/* Smollan Enhancement Overlays */}
                    {activeMode === 'enhanced' && (
                      <div className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] animate-in fade-in duration-500">
                        
                        {/* 1. Sizing Guide Modal Trigger (Adjacent to sizing area) */}
                        <div className="absolute top-[40%] right-[15%] animate-in slide-in-from-right-4">
                          <button 
                            onClick={() => setShowSizeModal(true)}
                            className="bg-white text-[#002157] px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-[#00e5ff] flex items-center gap-2 hover:bg-cyan-50 transition transform hover:scale-105"
                          >
                            <Layout className="w-4 h-4 text-[#00e5ff]" />
                            <div className="text-left">
                              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-700 leading-none mb-0.5">Smollan Accelerator</div>
                              <div className="text-xs font-black">View Interactive Size Guide</div>
                            </div>
                          </button>
                        </div>

                        {/* 2. Stock Scarcity Alert (Top Right) */}
                        <div className="absolute top-6 right-6 animate-in slide-in-from-right-4">
                          <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-400/50 flex items-center justify-center animate-pulse">
                              <Flame className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">High Demand Alert</div>
                              <div className="text-sm font-black">Only {unitsLeft} units left in stock</div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Review Consensus Floating Badge */}
                        <div className="absolute bottom-24 left-10 animate-in slide-in-from-left-4">
                          <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center text-center gap-2 max-w-[180px]">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                            </div>
                            <div className="text-xs font-black text-slate-900">4.8 / 5.0 Consensus</div>
                            <div className="text-[10px] text-slate-500 font-medium">From 128 verified buyers</div>
                            <button 
                              onClick={() => {
                                const el = document.getElementById('customer-reviews-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-[10px] font-bold text-cyan-700 hover:underline mt-1"
                            >
                              Read Verified Reviews ↓
                            </button>
                          </div>
                        </div>

                        {/* 4. Cross-Sell "What Goes Well With" Drawer Preview */}
                        <div className="absolute bottom-6 right-6 animate-in slide-in-from-bottom-4">
                          <div className="bg-[#002157] text-white p-4 rounded-3xl shadow-2xl border border-[#00e5ff]/30 flex flex-col gap-3 min-w-[280px]">
                            <div className="flex items-center gap-2 text-[#00e5ff]">
                              <Zap className="w-4 h-4 fill-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Complete the Look & Save 15%</span>
                            </div>
                            <div className="flex gap-2">
                              {[1, 2].map(i => (
                                <div key={i} className="w-10 h-10 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-slate-500" />
                                </div>
                              ))}
                              <div className="flex-1 flex flex-col justify-center">
                                <div className="text-[10px] font-bold">+2 Curated Items</div>
                                <div className="text-[10px] text-cyan-300 font-black">R {finalBundlePrice}.00 (Bundle)</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setBundleAdded(true);
                                setTimeout(() => setBundleAdded(false), 3000);
                              }}
                              className="w-full bg-[#00e5ff] text-[#002157] py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white transition"
                            >
                              {bundleAdded ? '✓ Added to Cart' : 'Add Bundle to Cart'}
                            </button>
                          </div>
                        </div>

                        {/* 5. Floating Value Proposition Chips */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border border-emerald-400">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Verified 24h Courier Dispatch</span>
                          </div>
                          <div className="bg-cyan-600 text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border border-cyan-500">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Smollan Authenticated Merchant</span>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Baseline View Label */}
                    {activeMode === 'current' && (
                      <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-2 text-xs font-bold shadow-2xl">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Baseline Product Experience (Unmodified)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div id="customer-reviews-section" className="pt-8">
                  <ProductReviews
                    brandName={brandName}
                    category={catName}
                    itemTitle={productTitle}
                    archetype="b2c_retail"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SOLUTIONS MATRIX (B2B) OR CATALOGUE / PLP (B2C) */}
        {activeTab === 'plp' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  {isB2B ? 'Enterprise Practice Directory' : 'Category & Listing Hygiene'}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {isB2B
                    ? `${brandName} Strategic Solutions & Engineering Practices`
                    : 'Product Listing Page (PLP) Grid Acceleration'}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {isB2B ? '4 Core Enterprise Practice Lines' : 'Showing 4 Sample Items'}
              </span>
            </div>

            {isB2B ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Conversion Rate Optimization (CRO) & User Experience Architecture',
                    scope: '2-Week Diagnostic Sprint',
                    deliverables: ['Full-Funnel Funnel Drop-off Diagnostic', 'Mobile Checkout Friction Remediation', 'A/B Test Hypothesis Roadmap'],
                    impact: '+25% to +35% Mobile CRO Lift',
                    tech: ['Hotjar', 'GA4', 'VWO', 'Shopify Plus']
                  },
                  {
                    title: 'Headless Storefront Engineering & Core Web Vitals Acceleration',
                    scope: '4-Week Implementation Sprint',
                    deliverables: ['Sub-2.0s Mobile LCP Guarantee', 'React 19 / Next.js Storefront', 'Edge Middleware Caching'],
                    impact: '< 1.8s Page Load Nationwide',
                    tech: ['Next.js', 'Vercel', 'Tailwind', 'Cloudflare']
                  },
                  {
                    title: 'Omnichannel Logistics, Inventory & ERP Synchronization',
                    scope: '6-Week Integration Sprint',
                    deliverables: ['Multi-DC Real-time Inventory Feeds', 'Automated Courier SLA Routing', 'POPIA-Compliant Customer Portals'],
                    impact: '99.9% Stock Accuracy',
                    tech: ['Syspro', 'SAP', 'ShipLogic', 'REST APIs']
                  },
                  {
                    title: 'Payment Gateway Orchestration & Fraud Prevention',
                    scope: '2-Week Integration Sprint',
                    deliverables: ['Ozow, PayFlex, Peach Payments Setup', 'Automated Fallback Gateway Routing', '3D Secure 2.2 Frictionless Flow'],
                    impact: '-18% Checkout Abandonment',
                    tech: ['PayFlex', 'Ozow', 'Peach Payments', 'PayFast']
                  }
                ].map((practice, idx) => (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black uppercase text-[#002157] bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-300">
                          {practice.scope}
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {practice.impact}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 leading-snug">{practice.title}</h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {practice.deliverables.map((del, dIdx) => (
                          <li key={dIdx} className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1">
                        {practice.tech.map(t => (
                          <span key={t} className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedScope(practice.title);
                          setActiveTab('pdp');
                        }}
                        className="bg-[#002157] hover:bg-slate-900 text-[#00e5ff] text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 shrink-0"
                      >
                        <span>View Practice</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((itemNum) => (
                  <div key={itemNum} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:shadow-md transition">
                    <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative shadow-inner">
                      <img 
                        src={productScreenshot} 
                        alt={`Real listing item ${itemNum}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://image.thum.io/get/width/400/crop/400/${encodeURIComponent(brandUrl)}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                      <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        Only {itemNum + 2} left
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{productTitle} - Variant {itemNum}</h4>
                      <div className="text-xs font-mono text-slate-600">
                        <span>R {(itemNum * 250) + 299}.00</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pdp')}
                      className="w-full bg-[#002157] text-[#00e5ff] text-xs font-bold py-2 rounded-xl hover:bg-slate-900 transition flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>View Product &amp; PP</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DISCOVERY FUNNEL (B2B) OR CART (B2C) */}
        {activeTab === 'cart' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-800 tracking-wider">
                  {isB2B ? 'High-Intent Inbound Funnel' : 'Checkout Friction Elimination & Threshold Meter'}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {isB2B
                    ? 'Enterprise Discovery Consultation & Scope Confirmation'
                    : 'Mini-Cart Drawer with Free Shipping Threshold & BNPL'}
                </h3>
              </div>
              <span className="text-xs bg-cyan-100 text-cyan-800 font-bold px-3 py-1 rounded-full">
                Interactive Architecture
              </span>
            </div>

            {isB2B ? (
              <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
                {discoverySubmitted ? (
                  <div className="text-center py-8 space-y-4 animate-in fade-in">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-900">Technical Discovery Scheduled!</h4>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">
                        Your sprint scope request has been routed to our Lead Architecture Partner. We will confirm your session within 4 business hours.
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reserved Sprint Scope:</span>
                        <strong className="text-slate-900">{selectedScope}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estimated Sprint Investment:</span>
                        <strong className="text-[#002157] font-mono">R {finalBundlePrice.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacity Reservation:</span>
                        <span className="text-emerald-700 font-bold">1 of {b2bSlotsLeft} Q2 Slots Held</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDiscoverySubmitted(false)}
                      className="text-xs font-bold text-cyan-700 hover:underline"
                    >
                      ← Submit another inquiry or modify details
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDiscoverySubmitted(true);
                      setB2bSlotsLeft(Math.max(1, b2bSlotsLeft - 1));
                    }}
                    className="space-y-4"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="text-base font-black text-slate-900">Schedule Strategic Discovery</h4>
                      <p className="text-xs text-slate-500">
                        Select your platform and primary commercial growth objective to reserve a sprint slot.
                      </p>
                    </div>

                    <div className="bg-cyan-50/70 p-3.5 rounded-2xl border border-cyan-200/80 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-[#002157]">
                        <span>Selected Sprint Scope:</span>
                        <span className="text-cyan-900">{selectedScope}</span>
                      </div>
                      <div className="flex justify-between font-mono text-slate-600 text-[11px]">
                        <span>Configured Investment (with 15% Bundle Discount):</span>
                        <strong className="text-[#002157] font-bold">R {finalBundlePrice.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                          Full Name &amp; Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Johan van der Merwe"
                          value={discoveryForm.name}
                          onChange={(e) => setDiscoveryForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                          Work Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. johan@retailbrand.co.za"
                          value={discoveryForm.email}
                          onChange={(e) => setDiscoveryForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                          Company / Storefront Domain
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. www.retailbrand.co.za"
                          value={discoveryForm.company}
                          onChange={(e) => setDiscoveryForm(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                          Current Platform
                        </label>
                        <select
                          value={discoveryForm.currentPlatform}
                          onChange={(e) => setDiscoveryForm(prev => ({ ...prev, currentPlatform: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                        >
                          <option value="Shopify Plus">Shopify Plus</option>
                          <option value="Magento 2 / Adobe Commerce">Magento 2 / Adobe Commerce</option>
                          <option value="WooCommerce">WooCommerce</option>
                          <option value="Salesforce Commerce Cloud">Salesforce Commerce Cloud</option>
                          <option value="Custom / Headless Stack">Custom / Headless Stack</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Primary Technical &amp; CRO Objective
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={discoveryForm.primaryGoal}
                        onChange={(e) => setDiscoveryForm(prev => ({ ...prev, primaryGoal: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#002157] hover:bg-slate-900 text-[#00e5ff] py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2 border border-cyan-400/40"
                    >
                      <Send className="w-4 h-4" />
                      <span>Confirm Discovery Consultation &amp; Reserve Slot</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm font-black text-slate-900 uppercase">Cart Drawer (Item Selected)</span>
                  <span className="text-xs text-slate-400 font-mono">Subtotal: R 899.00</span>
                </div>

                <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-cyan-950">
                    <span>🎉 Free Express Delivery Threshold Unlocked!</span>
                  </div>
                  <div className="w-full h-2 bg-cyan-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full animate-pulse" />
                  </div>
                </div>

                <div className="flex gap-3 py-2 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img 
                      src={productScreenshot} 
                      alt="Cart item" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-slate-900">{brandName} Signature Piece</h4>
                    <p className="text-slate-400">Size: {selectedSize} · Qty: 1</p>
                    <div className="font-mono text-slate-700 mt-1">R 899.00</div>
                  </div>
                </div>

                <button className="w-full bg-[#002157] hover:bg-slate-900 text-[#00e5ff] py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 border border-cyan-400/40">
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* SIZING MODAL (FOR B2C RETAIL) */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Inline Sizing &amp; Fit Guide</h3>
              <button onClick={() => setShowSizeModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2 border">Size</th>
                  <th className="p-2 border">Chest / Waist (cm)</th>
                  <th className="p-2 border">Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-2 border font-bold">UK 6</td><td className="p-2 border">78 - 82 cm</td><td className="p-2 border">68 cm</td></tr>
                <tr><td className="p-2 border font-bold">UK 8</td><td className="p-2 border">83 - 88 cm</td><td className="p-2 border">70 cm</td></tr>
                <tr><td className="p-2 border font-bold">UK 10</td><td className="p-2 border">89 - 94 cm</td><td className="p-2 border">72 cm</td></tr>
                <tr><td className="p-2 border font-bold">UK 12</td><td className="p-2 border">95 - 100 cm</td><td className="p-2 border">74 cm</td></tr>
              </tbody>
            </table>
            <button 
              onClick={() => setShowSizeModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
