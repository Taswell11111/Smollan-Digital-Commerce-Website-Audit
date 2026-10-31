import React, { useState, useEffect, useRef } from 'react';
import { Globe, ShieldAlert, Sparkles, CheckCircle2, ExternalLink, ShieldCheck, Lock, LogIn, ChevronRight, Layout, BarChart3, Database, Plus } from 'lucide-react';
import { UrlInspectionResult } from '../types';

interface NewAuditFormProps {
  onStartAudit: (params: {
    url: string;
    businessName: string;
    businessCategory: string;
    targetMarket: string;
    primaryObjective: string;
    depth: 'quick' | 'standard' | 'deep';
  }) => void;
  isLoading: boolean;
}

// Particle background component simulating travelling in a spaceship through deep space with gentle turning warp and intense sparkle flares when close to screen
const SparklingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Star {
      x: number;
      y: number;
      z: number;
      prevZ: number;
      size: number;
      color: string;
      speed: number;
      twinklePhase: number;
      twinkleSpeed: number;
    }

    const colors = ['#00e5ff', '#38bdf8', '#ffffff', '#7dd3fc', '#a5f3fc', '#00f0ff'];
    let stars: Star[] = [];

    const initStars = () => {
      const starCount = Math.min(280, Math.max(140, Math.floor((width * height) / 5000)));
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2,
          y: (Math.random() - 0.5) * height * 2,
          z: Math.random() * 1000 + 1,
          prevZ: 1000,
          size: Math.random() * 1.8 + 0.6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 1.2 + 0.4, // Slower travel speed for smoother glide
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.08 + 0.03
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    initStars();

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth, gentle ship turning oscillation
      angle += 0.0035;
      const turnOffsetX = Math.sin(angle) * (width * 0.08);
      const turnOffsetY = Math.cos(angle * 0.5) * (height * 0.04);
      const centerX = width / 2 + turnOffsetX;
      const centerY = height / 2 + turnOffsetY;
      const fov = 380;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.prevZ = star.z;
        star.z -= star.speed * 1.1; // Reduced forward speed

        star.twinklePhase += star.twinkleSpeed;

        // Reset star when it flies past the camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
          star.prevZ = 1000;
        }

        // Current projected position
        const k = fov / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        // Previous projected position (for smooth subtle trail)
        const prevK = fov / star.prevZ;
        const prevPx = star.x * prevK + centerX;
        const prevPy = star.y * prevK + centerY;

        if (px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50) {
          const depthRatio = Math.max(0, 1 - star.z / 1000);
          
          // Twinkle pulse effect
          const pulse = (Math.sin(star.twinklePhase) + 1) * 0.5; // 0..1
          const alpha = Math.min(1, Math.max(0.12, depthRatio * 1.2 + pulse * 0.2));
          const starRadius = Math.max(0.6, depthRatio * star.size * 2.4);

          // Subtle velocity streak behind star
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.45;
          ctx.lineWidth = starRadius * 0.8;
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Star nucleus
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(px, py, starRadius, 0, Math.PI * 2);
          ctx.fill();

          // Extra Sparkling Flare Effect for stars closer to screen (z < 380)
          if (star.z < 380) {
            const sparkleIntensity = Math.min(1, (380 - star.z) / 380) * (0.6 + pulse * 0.4);
            const flareLen = starRadius * (3.5 + pulse * 2.5);

            ctx.globalAlpha = alpha * sparkleIntensity * 0.85;

            // Radial sparkle halo
            const grad = ctx.createRadialGradient(px, py, 0, px, py, flareLen * 1.5);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, star.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, flareLen * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Cross sparkle flare beams (4-point star sparkle)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(0.7, starRadius * 0.5);

            // Horizontal beam
            ctx.beginPath();
            ctx.moveTo(px - flareLen, py);
            ctx.lineTo(px + flareLen, py);
            ctx.stroke();

            // Vertical beam
            ctx.beginPath();
            ctx.moveTo(px, py - flareLen);
            ctx.lineTo(px, py + flareLen);
            ctx.stroke();

            // Diagonal mini beams for intense close sparkles
            if (star.z < 200) {
              const diagLen = flareLen * 0.55;
              ctx.lineWidth = Math.max(0.5, starRadius * 0.35);
              ctx.beginPath();
              ctx.moveTo(px - diagLen, py - diagLen);
              ctx.lineTo(px + diagLen, py + diagLen);
              ctx.moveTo(px + diagLen, py - diagLen);
              ctx.lineTo(px - diagLen, py + diagLen);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-70 z-0" />;
};

export const NewAuditForm: React.FC<NewAuditFormProps> = ({ onStartAudit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');

  // Inline live verification preview state
  const [inlineInspection, setInlineInspection] = useState<UrlInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

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
      }
    } catch {
      // ignore
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
    onStartAudit({
      url: inlineInspection?.resolvedUrl || url,
      businessName: inlineInspection?.pageTitle || '',
      businessCategory: 'Retail / Ecommerce',
      targetMarket: 'South Africa',
      primaryObjective: 'sales',
      depth
    });
  };

  return (
    <div className="min-h-screen h-screen bg-[#00143a] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Dynamic Spaceship Particle & Warp Background */}
      <SparklingBackground />
      
      {/* Background Ambient Glow (Royal Blue) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-video bg-blue-600/[0.08] blur-[220px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/30 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-cyan-900/15 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Centered Column Container */}
      <div className="w-full max-w-5xl flex flex-col items-center justify-center relative z-10 space-y-6 sm:space-y-8 my-auto text-center">
        
        {/* 1. Page Title & Brand Identity - Centered Typography */}
        <div className="text-center space-y-4 max-w-3xl mx-auto flex flex-col items-center">
           <div className="flex items-center justify-center gap-4 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl ring-1 ring-white/5 w-fit shadow-2xl">
              <div className="bg-[#002157] text-[#00e5ff] px-4 py-1 rounded-md text-[12px] font-black uppercase tracking-tighter shadow-lg shadow-blue-900/60">
                SMOLLAN
              </div>
              <div className="w-px h-4 bg-white/20" />
              <span className="text-[12px] font-extrabold text-white/80 uppercase tracking-[0.4em]">Digital Commerce Intelligence</span>
           </div>
           
           <div className="space-y-4 py-2 text-center">
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-black text-white tracking-tighter uppercase leading-[1.08] drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] text-center">
                 Website Audit <br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00e5ff] to-blue-400">Gateway</span>
              </h1>
              <p className="text-lg sm:text-xl font-serif italic text-white/50 tracking-widest pt-1 text-center">
                 Initiate Website Intelligence Audit
              </p>
           </div>
        </div>

        {/* 2. Main Gateway Container - Horizontally Centered Ribbon */}
        <div className="w-full space-y-5">
          
          {/* Horizontal Input Row */}
          <div className="bg-[#0f172a]/85 backdrop-blur-[100px] rounded-[48px] border border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.6)] p-2 ring-1 ring-white/10 flex items-center gap-3 sm:gap-4 group transition-all hover:bg-[#0f172a]/95 hover:shadow-cyan-500/15">
             
             {/* Left Label: + NEW AUDIT Initiation */}
             <div className="flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 bg-[#00e5ff] text-[#002157] rounded-[36px] font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-cyan-500/40 shrink-0 select-none group-hover:scale-[1.02] transition-transform">
                <Plus className="w-5 h-5 stroke-[4px]" />
                <span>New Audit</span>
             </div>

             {/* Central Input Field */}
             <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-4 sm:gap-6 px-4 min-w-0">
                <div className="relative flex-1 group/input">
                   <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                      <Globe className="w-6 h-6 text-[#00e5ff]/40 group-focus-within/input:text-[#00e5ff] transition-colors duration-500" />
                   </div>
                   <input
                     type="text"
                     required
                     value={url}
                     onChange={(e) => setUrl(e.target.value)}
                     placeholder="Enter URL for Audit"
                     className="w-full pl-10 pr-3 py-2.5 bg-transparent text-xl sm:text-2xl font-black text-white placeholder:text-white/25 focus:outline-none focus:ring-0 truncate tracking-tight text-left"
                   />
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#002157] text-[#00e5ff] hover:bg-[#002c6b] px-6 sm:px-10 py-3 rounded-[32px] font-black text-xs sm:text-sm uppercase tracking-[0.22em] shadow-2xl shadow-blue-900/80 border border-blue-500/30 transition-all flex items-center gap-3 sm:gap-4 group/btn shrink-0"
                >
                  <span>{isLoading ? 'Crawling...' : 'Verify and Launch Audit'}</span>
                  <ChevronRight className="w-5 h-5 stroke-[4px] group-hover/btn:translate-x-1.5 transition-transform" />
                </button>
             </form>
          </div>

          {/* Verification & Status Preview (Horizontal) */}
          {inlineInspection && !isInspecting && (
            <div className="bg-[#002157]/40 backdrop-blur-[120px] rounded-[36px] border border-blue-500/30 p-5 flex items-center justify-between gap-6 animate-in slide-in-from-bottom-8 duration-700 ring-1 ring-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-6 min-w-0 text-left">
                  <div className="w-24 h-14 rounded-2xl overflow-hidden border border-white/20 bg-black shrink-0 relative shadow-2xl ring-1 ring-white/10">
                     <img
                       src={inlineInspection.screenshotUrl}
                       alt={inlineInspection.pageTitle}
                       className="w-full h-full object-cover object-top opacity-90 transition-transform duration-1000 hover:scale-125"
                       onError={(e) => {
                         if (inlineInspection.fallbackScreenshotUrl) {
                           (e.target as HTMLImageElement).src = inlineInspection.fallbackScreenshotUrl;
                         }
                       }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="space-y-1 min-w-0">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.22em] flex items-center gap-1.5 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {inlineInspection.platform} Verified
                        </span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.25em]">● {inlineInspection.responseTimeMs}ms TTFB</span>
                     </div>
                     <h4 className="text-[14px] font-black text-white truncate leading-tight uppercase tracking-wider">
                       {inlineInspection.pageTitle}
                     </h4>
                     <div className="text-[10px] text-white/35 font-mono truncate opacity-80 uppercase tracking-tight">{inlineInspection.resolvedUrl}</div>
                  </div>
               </div>
               <div className="hidden lg:flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 shadow-2xl shadow-emerald-900/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Target Validated</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Branding - Crisp Horizontally Centered Typography */}
      <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex items-center justify-center gap-6 sm:gap-10 opacity-35 z-10 px-8 text-center pointer-events-none">
         <p className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.8em] sm:tracking-[1em] whitespace-nowrap">
           Smollan Digital Commerce
         </p>
         <div className="w-12 sm:w-16 h-px bg-white/20" />
         <p className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-[0.4em] sm:tracking-[0.5em] whitespace-nowrap">
           Intelligence Hub · v2.1
         </p>
      </div>

    </div>
  );
};
