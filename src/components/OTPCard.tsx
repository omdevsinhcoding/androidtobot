import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';

interface OTPCardProps {
  sms: {
    from: string;
    text: string;
    receivedAt?: string;
    receivedStamp?: number;
  };
}

export const OTPCard: React.FC<OTPCardProps> = ({ sms }) => {
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
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return ts;
    }
  };

  const getBrandPalette = (sender: string) => {
    const s = sender.toUpperCase();
    if (s.includes('AMAZON')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (s.includes('SONY')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (s.includes('HOTSTAR')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    if (s.includes('NETFLIX')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (s.includes('GOOGLE')) return 'text-blue-300 bg-blue-400/10 border-blue-400/20';
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
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

  return (
    <div className="glass-panel p-3 rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${palette}`}>
          <ShieldCheck size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate">{from}</h3>
            <span className="shrink-0 text-[10px] font-medium text-white/40">{tryFormatTime(timestamp)}</span>
          </div>
          <p className="text-xs text-white/60 truncate mt-0.5">{text}</p>
        </div>
      </div>

      {otpObject && (
        <button 
          onClick={handleCopy}
          className="shrink-0 tap-target flex items-center justify-center bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-xl transition-colors ml-2"
          aria-label="Copy OTP"
        >
          {copied ? (
            <div className="flex items-center gap-1.5 px-3 text-green-400">
              <Check size={16} strokeWidth={3} />
              <span className="text-sm font-bold font-mono">{otpObject}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 text-white">
              <Copy size={14} className="text-white/40" />
              <span className="text-sm font-bold font-mono tracking-wider">{otpObject}</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
};
