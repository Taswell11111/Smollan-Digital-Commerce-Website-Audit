import React, { useRef, useEffect } from 'react';
import { Terminal, Loader2 } from 'lucide-react';

interface AuditConsoleProps {
  logs: string[];
  url: string;
}

export const AuditConsole: React.FC<AuditConsoleProps> = ({ logs, url }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-[100px] rounded-[40px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] p-8 sm:p-10 space-y-6 max-w-3xl w-full relative z-10 ring-1 ring-white/10">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#002157] flex items-center justify-center border border-cyan-500/30">
            <Terminal className="w-5 h-5 text-[#00e5ff]" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Live Audit Console Output</h3>
            <p className="text-[10px] text-white/40 font-mono">{url}</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          Executing
        </span>
      </div>

      <div className="bg-black/80 rounded-2xl border border-white/10 p-4 h-48 overflow-y-auto font-mono text-[11px] text-cyan-300 space-y-1.5 shadow-inner">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 animate-in fade-in duration-300">
            <span className="text-white/30 shrink-0">&gt;</span>
            <span className="break-all">{log}</span>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>

      <div className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] text-center">
        Deterministic scoring calculation engine · Smollan Digital Commerce
      </div>
    </div>
  );
};
