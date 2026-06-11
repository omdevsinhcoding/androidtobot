import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Clock } from 'lucide-react';

interface OTPCardProps {
  sms: {
    from: string;
    text: string;
    receivedAt?: string;
    receivedStamp?: number;
  };
  highlight?: boolean;
}

export const OTPCard: React.FC<OTPCardProps> = ({ sms, highlight = false }) => {
  const [copied, setCopied] = useState(false);
  const { from, text, receivedAt, receivedStamp } = sms;
  
  const timestamp = receivedAt || (receivedStamp ? new Date(receivedStamp).toLocaleString() : '');

  const textStr = text || '';
  const fromStr = from || 'Unknown';
  
  const otpMatch = textStr.match(/\b\d{4,8}\b/);
  const otpObject = otpMatch ? otpMatch[0] : null;

  const tryFormatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      if (diffDays === 0) return timeStr;
      if (diffDays === 1) return `Yesterday ${timeStr}`;
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
    } catch {
      return ts;
    }
  };

  const getBrandPalette = (sender: string) => {
    const s = sender.toUpperCase();
    if (s.includes('AMAZON')) return { icon: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (s.includes('SONY')) return { icon: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (s.includes('HOTSTAR')) return { icon: 'text-purple-400', bg: 'bg-purple-500/10' };
    if (s.includes('NETFLIX')) return { icon: 'text-red-400', bg: 'bg-red-500/10' };
    if (s.includes('GOOGLE')) return { icon: 'text-blue-300', bg: 'bg-blue-400/10' };
    if (s.includes('WHATSAPP')) return { icon: 'text-green-400', bg: 'bg-green-500/10' };
    if (s.includes('TELEGRAM')) return { icon: 'text-sky-400', bg: 'bg-sky-500/10' };
    return { icon: 'text-indigo-400', bg: 'bg-indigo-500/10' };
  };

  const palette = getBrandPalette(fromStr);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (otpObject) {
      navigator.clipboard.writeText(otpObject);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // The latest highlight card will look slightly different (larger, stronger border)
  const baseClasses = highlight 
    ? "glass-panel p-4 rounded-3xl border-[var(--tg-theme-button-color)]/30 border-2" 
    : "card-panel p-3.5 rounded-2xl";

  return (
    <div className={`${baseClasses} flex flex-col gap-3 relative overflow-hidden`}>
      {highlight && (
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ShieldCheck size={120} />
        </div>
      )}
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 ${highlight ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl'} flex items-center justify-center ${palette.bg}`}>
            <ShieldCheck size={highlight ? 24 : 18} className={palette.icon} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`${highlight ? 'text-lg' : 'text-sm'} font-black text-white truncate`}>{from}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={12} className="text-white/30" />
              <span className="text-xs font-medium text-white/40 truncate">{tryFormatTime(timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pl-[3.25rem]">
        <p className={`${highlight ? 'text-sm' : 'text-xs'} text-white/70 leading-relaxed mb-3`}>{text}</p>
        
        {otpObject && (
          <button 
            onClick={handleCopy}
            className="tap-target h-12 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-xl px-4 transition-all"
            aria-label="Copy OTP"
          >
            <span className={`font-mono font-black tracking-[0.2em] ${highlight ? 'text-2xl text-[var(--tg-theme-button-color)]' : 'text-xl text-white'}`}>
              {otpObject}
            </span>
            {copied ? (
              <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-md">
                <Check size={16} strokeWidth={3} />
                <span className="text-xs font-bold uppercase tracking-wider">Copied</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-white/40">
                <Copy size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Copy</span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
