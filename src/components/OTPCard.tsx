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

  // Hero Card Mode (Latest OTP)
  if (highlight) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-panel glow-border rounded-3xl p-6 relative overflow-hidden"
      >
        {/* Abstract background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--tg-theme-button-color)]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2 text-[var(--tg-theme-button-color)] font-semibold bg-[var(--tg-theme-button-color)]/10 px-3 py-1.5 rounded-full text-sm">
            <ShieldCheck size={16} />
            <span>Secure OTP</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
            <Clock size={12} />
            {timeString}
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <h2 className="text-white/70 text-sm mb-1 font-medium">{sms.from}</h2>
          {code ? (
            <div className="flex flex-col items-start gap-4">
              <div className="text-5xl font-black tracking-widest glow-text bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {code}
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{sms.text}</p>
            </div>
          ) : (
            <p className="text-white/90 text-lg font-medium leading-relaxed">{sms.text}</p>
          )}
        </div>

        <button 
          onClick={() => handleCopy(code || sms.text)}
          className="w-full relative z-10 overflow-hidden rounded-2xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-semibold py-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(42,171,238,0.3)] hover:shadow-[0_0_30px_rgba(42,171,238,0.5)]"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="checked"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2"
              >
                <Check size={20} />
                <span>Copied Securely</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-2"
              >
                <Copy size={20} />
                <span>Copy to Clipboard</span>
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
