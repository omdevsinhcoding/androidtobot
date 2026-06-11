import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, RefreshCw, Inbox, ShieldCheck } from 'lucide-react';
import { OTPCard } from '../OTPCard';
import { motion, AnimatePresence } from 'framer-motion';

export const HomeTab: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'otp' | 'bank' | 'other'>('all');

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['sms', 'recent'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 5000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'otp') return messages.filter((m: any) => m.text.toLowerCase().includes('otp') || m.text.toLowerCase().includes('code'));
    if (filter === 'bank') return messages.filter((m: any) => m.text.toLowerCase().includes('bank') || m.text.toLowerCase().includes('rs') || m.text.toLowerCase().includes('inr'));
    return messages;
  };

  const filteredMessages = getFilteredMessages();
  const latestMessage = messages.length > 0 ? messages[0] : null;

  return (
    <div className="flex flex-col h-full w-full px-2 pb-10">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8 px-2 pt-2">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Secure Vault
          </h1>
          <p className="text-white/40 text-xs mt-1">Live synchronized</p>
        </div>
        <button 
          onClick={handleRefresh}
          className={`w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10 ${isRefreshing ? 'animate-spin text-[var(--tg-theme-button-color)]' : ''}`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Categories / Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2 mb-8 pb-1">
        {(['all', 'otp', 'bank'] as const).map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="filterPill"
                  className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full border border-sky-400/30 shadow-[0_4px_20px_rgba(14,165,233,0.4)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-6">
            <Loader2 className="animate-spin text-sky-400" size={40} />
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-400/60">Decrypting vault...</p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 w-24 h-24 rounded-[32px] glass-panel border border-white/10 flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                <Inbox size={48} className="text-white/20" strokeWidth={1} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vault is Empty</h3>
            <p className="text-white/40 text-sm max-w-[200px] leading-relaxed">Incoming secure messages will appear here instantly.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filter === 'all' && latestMessage && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4"
              >
                <OTPCard sms={latestMessage} highlight />
              </motion.div>
            )}

            <div className="flex items-center gap-2 px-2 mt-2 mb-2">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-white/30 text-xs font-medium uppercase tracking-wider">Older Messages</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
            </div>

            {filteredMessages.slice(filter === 'all' ? 1 : 0).map((msg: any, index: number) => (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OTPCard sms={msg} />
              </motion.div>
            ))}
            
            {filteredMessages.length === 0 && (
              <div className="text-center py-10 text-white/30 text-sm">
                No messages match this filter.
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
