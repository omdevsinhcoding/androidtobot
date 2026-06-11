import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, RefreshCw, Inbox, ShieldCheck } from 'lucide-react';
import { OTPCard } from '../OTPCard';

export const HomeTab: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const { data: smsList, isLoading, isError, refetch } = useQuery({
    queryKey: ['sms'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      return res.data || [];
    },
    refetchInterval: 5000,
  });

  const handleRefetch = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback delay
  };

  const uniqueServices = Array.from(new Set((smsList || []).map((sms: any) => {
    // Extract base brand name simply
    const from = sms.from?.toLowerCase() || '';
    if (from.includes('amazon')) return 'Amazon';
    if (from.includes('google')) return 'Google';
    if (from.includes('netflix')) return 'Netflix';
    if (from.includes('whatsapp')) return 'WhatsApp';
    if (from.includes('telegram')) return 'Telegram';
    return sms.from;
  }))).filter(Boolean).slice(0, 5) as string[];

  const filters = ['All', ...uniqueServices];

  const filteredList = (smsList || []).filter((sms: any) => {
    if (filter === 'All') return true;
    const from = sms.from?.toLowerCase() || '';
    return from.includes(filter.toLowerCase());
  });

  const latestOTP = filteredList[0];
  const recentOTPs = filteredList.slice(1, 4);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#000000]/90 backdrop-blur-md z-40 py-2 -mx-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-[var(--tg-theme-button-color)]" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Vault</h2>
        </div>
        <button 
          onClick={handleRefetch} 
          className="tap-target bg-white/5 border border-white/10 rounded-full w-10 h-10 flex items-center justify-center active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={`text-white/80 ${isRefreshing ? 'animate-spin text-[var(--tg-theme-button-color)]' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[var(--tg-theme-button-color)]" size={40} />
          <span className="text-sm font-medium text-white/40 tracking-widest uppercase">Syncing</span>
        </div>
      ) : isError ? (
        <div className="card-panel p-4 rounded-2xl text-center flex flex-col items-center gap-2">
          <ShieldCheck size={32} className="text-red-500/50" />
          <span className="text-red-400 font-bold text-sm">Connection Lost</span>
          <p className="text-white/40 text-xs">Failed to connect to the secure vault.</p>
        </div>
      ) : !smsList || smsList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 opacity-50">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Inbox size={40} className="text-white/40" />
          </div>
          <span className="text-base font-bold text-white/60">Vault is empty</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          
          {/* Hero Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[var(--tg-theme-button-color)] uppercase tracking-[0.2em] ml-1">Latest Code</h3>
            </div>
            {latestOTP ? (
              <OTPCard sms={latestOTP} highlight={true} />
            ) : (
              <div className="card-panel p-6 rounded-2xl text-center text-white/40 text-sm font-medium">
                No codes match this filter.
              </div>
            )}
          </div>

          {/* Filters */}
          {filters.length > 1 && (
            <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-4 px-4 py-1">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 tap-target h-9 px-4 rounded-full text-xs font-bold transition-all ${
                    filter === f 
                      ? 'bg-[var(--tg-theme-button-color)] text-white' 
                      : 'bg-white/5 text-white/60 active:bg-white/10 border border-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Recent Section */}
          {recentOTPs.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Recent Codes</h3>
              <div className="flex flex-col gap-3">
                {recentOTPs.map((sms: any, idx: number) => (
                  <OTPCard key={sms.receivedAt || idx} sms={sms} highlight={false} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
