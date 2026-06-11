import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  
  // Use receivedAt or receivedStamp for time
  const timestamp = receivedAt || (receivedStamp ? new Date(receivedStamp).toLocaleString() : '');

  // Extract common OTP patterns (4-8 digits) safely
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
    if (s.includes('AMAZON')) return { text: 'text-orange-400', accent: 'bg-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' };
    if (s.includes('SONY')) return { text: 'text-blue-400', accent: 'bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' };
    if (s.includes('HOTSTAR')) return { text: 'text-purple-400', accent: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' };
    if (s.includes('NETFLIX')) return { text: 'text-red-400', accent: 'bg-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
    if (s.includes('GOOGLE')) return { text: 'text-blue-300', accent: 'bg-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.3)]' };
    return { text: 'text-indigo-400', accent: 'bg-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' };
  };

  const palette = getBrandPalette(fromStr);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (otpObject) {
      navigator.clipboard.writeText(otpObject);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render text with clickable links
  const renderText = (txt: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return txt.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline hover:opacity-80 transition-opacity break-all" onClick={e => e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="p-4 bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-3xl relative overflow-hidden group shadow-lg transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 cursor-pointer"
      >
        {/* Animated Background Glow */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 ${palette.accent}/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className="flex justify-between items-center gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${palette.accent}/10 flex items-center justify-center ${palette.text} border border-white/10 bg-[#0a0a0a] ${palette.glow}`}>
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-black text-white/90 leading-none mb-1 tracking-tight">{from}</h3>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{tryFormatTime(timestamp)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {otpObject && (
               <div className={`px-3 py-1.5 ${palette.accent}/10 border border-white/10 rounded-xl ${palette.glow}`}>
                  <span className={`text-base font-mono font-black ${palette.text} tracking-wider`}>{otpObject}</span>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 md:px-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-[320px] bg-[#0c0c0c] border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Modal Background Glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] ${palette.accent}/10 blur-[80px] rounded-full pointer-events-none -z-10`} />

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${palette.accent}/10 flex items-center justify-center ${palette.text} border border-white/10 bg-[#0a0a0a] ${palette.glow}`}>
                    <ShieldCheck size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{from}</h3>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{tryFormatTime(timestamp)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-6 p-5 bg-white/5 border border-white/5 rounded-2xl">
                <p className="text-white/70 text-sm leading-relaxed font-medium">
                  {renderText(text)}
                </p>
              </div>

              {otpObject && (
                <div className="relative">
                  <div className="flex items-center justify-between bg-[#050505] rounded-2xl p-2 pl-6 border border-white/10 shadow-inner">
                    <span className="text-2xl font-black font-mono tracking-[0.2em] text-white">{otpObject}</span>
                    <button 
                      onClick={handleCopy}
                      className={`flex items-center justify-center w-12 h-12 rounded-[14px] transition-all duration-300 shadow-lg ${
                        copied ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : `bg-white text-black active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]`
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                            <Check size={20} strokeWidth={4} />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                            <Copy size={20} strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex items-center justify-center gap-2">
                 <ShieldCheck size={14} className="text-white/20" />
                 <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Secured by Protocol</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
