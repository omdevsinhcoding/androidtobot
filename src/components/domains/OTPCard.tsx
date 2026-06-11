import React, { useState } from 'react';
import { Copy, Check, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

interface OTPCardProps {
  sms: {
    from: string;
    text: string;
    receivedAt?: string;
    receivedStamp?: number;
  };
  highlight?: boolean;
}

export const OTPCard: React.FC<OTPCardProps> = ({ sms, highlight }) => {
  const [copied, setCopied] = useState(false);

  const extractCode = (text: string) => {
    const match = text.match(/\b\d{4,8}\b/);
    return match ? match[0] : null;
  };

  const code = extractCode(sms.text);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeString = sms.receivedStamp 
    ? new Date(sms.receivedStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : sms.receivedAt || 'Just now';

  return (
    <GlassCard variant={highlight ? 'active' : 'light'} className="mb-4 overflow-hidden relative group">
      {highlight && (
        <div className="absolute top-0 left-0 w-1 h-full bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
      )}
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
            {code ? <ShieldCheck size={16} className="text-emerald-400" /> : <MessageSquare size={16} className="text-white/60" />}
          </div>
          <span className="font-bold text-white/90 text-sm tracking-wide">{sms.from}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-medium bg-black/20 px-2 py-1 rounded-lg border border-white/5">
          <Clock size={10} />
          {timeString}
        </div>
      </div>

      <p className="text-white/70 text-[13px] leading-relaxed mb-4">{sms.text}</p>

      {code && (
        <div className="flex items-center justify-between bg-black/40 p-1.5 pl-4 rounded-2xl border border-white/5 relative overflow-hidden group-hover:border-sky-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-2xl pointer-events-none" />
          <span className="font-mono text-2xl tracking-[0.2em] font-black text-white text-glow z-10">{code}</span>
          <button
            onClick={() => handleCopy(code)}
            className={`flex items-center justify-center w-12 h-10 rounded-xl transition-all z-10 ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-white/10 text-white/80 hover:bg-sky-500/20 hover:text-sky-400 border border-transparent hover:border-sky-500/30 active:scale-95'
            }`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      )}
    </GlassCard>
  );
};
