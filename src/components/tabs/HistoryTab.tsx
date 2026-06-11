import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Inbox, Search } from 'lucide-react';
import { OTPCard } from '../OTPCard';

export const HistoryTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: smsList, isLoading, isError } = useQuery({
    queryKey: ['sms'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      return res.data || [];
    },
    refetchInterval: 10000,
  });

  const filteredList = (smsList || []).filter((sms: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const fromMatch = sms.from?.toLowerCase().includes(q);
    const textMatch = sms.text?.toLowerCase().includes(q);
    return fromMatch || textMatch;
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Area */}
      <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-[#000000]/90 backdrop-blur-md z-40 py-2 -mx-4 px-4">
        <h2 className="text-xl font-black text-white tracking-tight">History</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-white/30" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-[var(--tg-theme-button-color)] transition-colors text-sm"
            placeholder="Search by sender or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-white/20" size={32} />
        </div>
      ) : isError ? (
        <div className="card-panel p-4 rounded-2xl text-center text-red-400 text-sm font-medium">
          Failed to load history.
        </div>
      ) : !smsList || smsList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Inbox size={32} className="text-white/20" />
          </div>
          <span className="text-sm font-medium text-white/40">History is empty.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-sm">
              No matching OTPs found.
            </div>
          ) : (
            filteredList.map((sms: any, idx: number) => (
              <OTPCard key={sms.receivedAt || idx} sms={sms} highlight={false} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
