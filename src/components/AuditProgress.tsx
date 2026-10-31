import React, { useEffect, useState, useRef } from 'react';
import { Globe, Search, ShieldCheck, Cpu, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

interface AuditProgressProps {
  url: string;
  isLoading: boolean;
  onComplete: () => void;
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
          speed: Math.random() * 1.2 + 0.4,
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

      angle += 0.0035;
      const turnOffsetX = Math.sin(angle) * (width * 0.08);
      const turnOffsetY = Math.cos(angle * 0.5) * (height * 0.04);
      const centerX = width / 2 + turnOffsetX;
      const centerY = height / 2 + turnOffsetY;
      const fov = 380;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.prevZ = star.z;
        star.z -= star.speed * 1.1;
        star.twinklePhase += star.twinkleSpeed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
          star.prevZ = 1000;
        }

        const k = fov / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        const prevK = fov / star.prevZ;
        const prevPx = star.x * prevK + centerX;
        const prevPy = star.y * prevK + centerY;

        if (px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50) {
          const depthRatio = Math.max(0, 1 - star.z / 1000);
          const pulse = (Math.sin(star.twinklePhase) + 1) * 0.5;
          const alpha = Math.min(1, Math.max(0.12, depthRatio * 1.2 + pulse * 0.2));
          const starRadius = Math.max(0.6, depthRatio * star.size * 2.4);

          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.45;
          ctx.lineWidth = starRadius * 0.8;
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.stroke();

          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(px, py, starRadius, 0, Math.PI * 2);
          ctx.fill();

          if (star.z < 380) {
            const sparkleIntensity = Math.min(1, (380 - star.z) / 380) * (0.6 + pulse * 0.4);
            const flareLen = starRadius * (3.5 + pulse * 2.5);

            ctx.globalAlpha = alpha * sparkleIntensity * 0.85;

            const grad = ctx.createRadialGradient(px, py, 0, px, py, flareLen * 1.5);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, star.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, flareLen * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(0.7, starRadius * 0.5);

            ctx.beginPath();
            ctx.moveTo(px - flareLen, py);
            ctx.lineTo(px + flareLen, py);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px, py - flareLen);
            ctx.lineTo(px, py + flareLen);
            ctx.stroke();

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

export const AuditProgress: React.FC<AuditProgressProps> = ({ url, isLoading, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Validating URL & Security', desc: 'Checking target reachability and SSRF compliance.', icon: ShieldCheck },
    { title: 'Discovering Pages & Sitemap', desc: 'Reading robots.txt and discovering internal links.', icon: Globe },
    { title: 'Inspecting Page Content', desc: 'Extracting titles, headings, images, and buttons.', icon: Search },
    { title: 'Measuring Performance & SEO', desc: 'Recording HTTP headers, response times, and metadata.', icon: Cpu },
    { title: 'Synthesizing Findings via Gemini AI', desc: 'Matching observed evidence to Smollan execution services.', icon: Sparkles },
    { title: 'Compiling Deterministic Report & Enhancements', desc: 'Evaluating 12 weighted categories and calculating uplift.', icon: CheckCircle2 }
  ];

  const [hasStarted, setHasStarted] = useState(false);

  // Advance through initial crawler stages smoothly
  useEffect(() => {
    if (isLoading) {
      setHasStarted(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!hasStarted) return;
    
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [hasStarted, steps.length]);

  // When server API completes (isLoading becomes false)
  useEffect(() => {
    if (hasStarted && !isLoading) {
      setCurrentStep(steps.length - 1);
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 1200); // Increased slightly for better feel
      return () => clearTimeout(finishTimer);
    }
  }, [isLoading, onComplete, steps.length, hasStarted]);

  return (
    <div className="h-screen bg-[#00143a] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Sparkling Background */}
      <SparklingBackground />
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-video bg-blue-600/[0.1] blur-[180px] rounded-full pointer-events-none animate-pulse" />

      <div className="bg-[#0f172a]/80 backdrop-blur-[100px] rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] p-10 sm:p-12 space-y-10 max-w-3xl w-full relative z-10 ring-1 ring-white/10">
        
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#00e5ff] border-t-transparent animate-spin duration-[2s]"></div>
          <div className="w-20 h-20 rounded-full bg-[#002157] flex items-center justify-center shadow-2xl">
            <Globe className="w-10 h-10 text-[#00e5ff]" />
          </div>
        </div>

        <div className="text-center space-y-3">
          <span className="text-[11px] uppercase font-black tracking-[0.4em] text-[#00e5ff] flex items-center justify-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin" />
            Live Intelligence Engine Active
          </span>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none truncate max-w-2xl mx-auto break-all">{url}</h2>
          <p className="text-sm font-bold text-white/40 uppercase tracking-[0.2em]">
            Deconstructing DOM Architecture & Scoring Performance
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep || (!isLoading && idx === steps.length - 1);
            const isCurrent = idx === currentStep && isLoading;

            return (
              <div
                key={idx}
                className={`flex items-center gap-5 p-4 rounded-3xl transition-all duration-500 border ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]'
                    : isCompleted
                    ? 'bg-white/[0.03] border-white/5 opacity-50'
                    : 'opacity-10'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : isCurrent
                      ? 'bg-[#00e5ff]/20 border-[#00e5ff]/30 text-[#00e5ff] animate-pulse'
                      : 'bg-white/5 border-white/10 text-white/20'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-black">{idx + 1}</span>}
                </div>
                <div className="min-w-0">
                  <h4 className={`text-[12px] font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mt-0.5 truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-white/15 uppercase font-black tracking-[0.3em] text-center pt-4">
          Deterministic scoring calculation engine · 2026 smollan digital
        </div>
      </div>
    </div>
  );
};
