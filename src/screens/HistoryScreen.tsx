import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Inbox } from 'lucide-react';
import { OTPCard } from '../components/domains/OTPCard';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';

export const HistoryScreen: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ['sms', 'history'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      if (!Array.isArray(res.data)) throw new Error('Invalid format');
      return res.data;
    },
    refetchInterval: 10000,
    retry: 2,
  });

  if (isError) {
    return <ErrorState message="Could not connect to the secure vault to fetch history." onRetry={refetch} />;
  }

  if (isLoading && !messages) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 shrink-0">
          <div className="h-12 w-full bg-white/5 rounded-2xl" />
        </div>
        <LoadingState />
      </div>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];
  const filteredMessages = safeMessages.filter((m: any) => 
    (m.from || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.text || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Premium Search Bar */}
      <div className="px-4 py-2 shrink-0 sticky top-0 z-10 bg-[#030509]/80 backdrop-blur-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-sky-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search vault history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 glass-panel-light rounded-2xl text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.12] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-4 pb-32">
        {filteredMessages.length === 0 ? (
           <EmptyState 
             icon={Inbox} 
             title="No Records Found" 
             description={search ? "No messages match your search." : "Your history is currently empty."} 
           />
        ) : (
          <AnimatePresence>
            {filteredMessages.map((msg: any, index: number) => (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
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
