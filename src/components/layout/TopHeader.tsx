import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TopHeader: React.FC = () => {
  return (
    <div className="w-full pt-[max(16px,var(--safe-top))] pb-3 px-5 flex items-center justify-between z-20 relative shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-white/90 leading-tight">OTP Vault</h1>
          <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase opacity-90">Secure Inbox</span>
        </div>
      </div>
      <div className="glass-panel-light px-3 py-1.5 rounded-full flex items-center gap-2 border-sky-400/20">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Sync</span>
      </div>
    </div>
  );
};
