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

  // Extract common OTP patterns (4-8 digits)
  const otpMatch = text.match(/\b\d{4,8}\b/);
  const otpObject = otpMatch ? otpMatch[0] : null;

  const tryFormatTime = (ts: string) => {
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
    if (s.includes('AMAZON')) return { text: 'text-orange-400', accent: 'bg-orange-500' };
    if (s.includes('SONY')) return { text: 'text-blue-400', accent: 'bg-blue-500' };
    if (s.includes('HOTSTAR')) return { text: 'text-purple-400', accent: 'bg-purple-500' };
    if (s.includes('NETFLIX')) return { text: 'text-red-400', accent: 'bg-red-500' };
    if (s.includes('GOOGLE')) return { text: 'text-blue-300', accent: 'bg-blue-400' };
    return { text: 'text-indigo-400', accent: 'bg-indigo-500' };
  };

  const palette = getBrandPalette(from);

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
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold underline hover:opacity-80 transition-opacity break-all" onClick={e => e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl relative overflow-hidden group shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer"
      >
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl -z-10" />

        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${palette.accent}/10 flex items-center justify-center ${palette.text} border border-white/5 bg-black`}>
              <ShieldCheck size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90 leading-none mb-0.5">{from}</h3>
              <p className="text-xs text-white/50">{tryFormatTime(timestamp)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {otpObject && (
               <div className="px-2 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-lg">
                  <span className="text-sm font-mono font-medium text-indigo-400">{otpObject}</span>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 md:px-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-[300px] bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${palette.accent}/10 flex items-center justify-center ${palette.text} border border-white/5 bg-black`}>
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{from}</h3>
                    <p className="text-xs text-white/50">{tryFormatTime(timestamp)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white/60 text-xs leading-relaxed font-medium">
                  {renderText(text)}
                </p>
              </div>

              {otpObject && (
                <div className="relative">
                  <div className="flex items-center justify-between bg-black rounded-xl p-1.5 pl-5 border border-white/10">
                    <span className="text-xl font-black font-mono tracking-[0.2em] text-white">{otpObject}</span>
                    <button 
                      onClick={handleCopy}
                      className={`flex items-center justify-center w-10 h-10 rounded-[10px] transition-all duration-300 ${
                        copied ? 'bg-indigo-600 text-white' : 'bg-white text-black active:scale-95'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Check size={16} strokeWidth={4} />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Copy size={16} strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="text-xs font-medium text-white/20">Secured Storage</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
