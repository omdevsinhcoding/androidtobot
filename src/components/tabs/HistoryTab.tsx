import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Inbox, Search } from 'lucide-react';
import { OTPCard } from '../OTPCard';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['sms', 'history'],
    queryFn: async () => {
      const res = await axios.get('/api/sms/history');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const filteredMessages = messages.filter((m: any) => 
    m.from.toLowerCase().includes(search.toLowerCase()) || 
    m.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full px-2 pb-10">
      <div className="mb-6 px-2 pt-2">
        <h1 className="text-2xl font-bold text-white mb-4">Message History</h1>
        
        {/* Premium Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--tg-theme-button-color)] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by sender or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-[var(--tg-theme-button-color)]/50 focus:ring-1 focus:ring-[var(--tg-theme-button-color)]/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/30" size={32} />
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-white/30"
          >
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4">
              <Inbox size={28} className="opacity-50" />
            </div>
            <p>History is empty.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredMessages.map((msg: any, index: number) => (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                <OTPCard sms={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
