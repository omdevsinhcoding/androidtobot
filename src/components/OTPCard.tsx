import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Simple parser to extract potential OTP codes
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

  const timeString = sms.receivedAt 
    ? new Date(sms.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : sms.receivedStamp 
      ? new Date(sms.receivedStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now';

  // Premium Holographic Black Card (Latest OTP)
  if (highlight) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
        whileTap={{ scale: 0.98 }}
        className="holographic-card rounded-[28px] p-7 relative cursor-default"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2 text-sky-400 font-bold bg-sky-400/10 border border-sky-400/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <ShieldCheck size={14} />
            <span>Secure Token</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-semibold tracking-wider uppercase">
            <Clock size={12} />
            {timeString}
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">{sms.from}</h2>
          {code ? (
            <div className="flex flex-col items-start gap-2">
              <div className="text-6xl font-black tracking-[0.2em] glow-text text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {code}
              </div>
              <p className="text-white/60 text-sm leading-relaxed mt-2 font-medium">{sms.text}</p>
            </div>
          ) : (
            <p className="text-white/90 text-xl font-medium leading-relaxed tracking-wide">{sms.text}</p>
          )}
        </div>

        <button 
          onClick={() => handleCopy(code || sms.text)}
          className="w-full relative z-10 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_rgba(14,165,233,0.6)] hover:shadow-[0_10px_40px_-5px_rgba(14,165,233,0.8)] border border-white/20"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="checked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Check size={20} strokeWidth={3} />
                <span>Copied to Clipboard</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Copy size={20} strokeWidth={2.5} />
                <span>Copy Secure Code</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    );
  }

  // Standard List Mode
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 active:bg-white/5 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center text-[var(--tg-theme-button-color)]">
            <MessageSquare size={14} />
          </div>
          <span className="font-semibold text-white/90">{sms.from}</span>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Clock size={12} />
          {timeString}
        </div>
      </div>
      
      <p className="text-white/70 text-sm leading-relaxed">{sms.text}</p>
      
      <button 
        onClick={() => handleCopy(code || sms.text)}
        className="self-end px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium flex items-center gap-2 transition-colors border border-white/5"
      >
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        {copied ? 'Copied' : code ? 'Copy Code' : 'Copy Text'}
      </button>
    </div>
  );
};
