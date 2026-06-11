import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, RefreshCw, Inbox } from 'lucide-react';
import { OTPCard } from '../OTPCard';

export const HomeTab: React.FC = () => {
  const { data: smsList, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['sms'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      return res.data || [];
    },
    refetchInterval: 5000,
  });

  const latestOTP = smsList?.[0];
  const recentOTPs = smsList?.slice(1, 4) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight">Inbox</h2>
        <button 
          onClick={() => refetch()} 
          className="tap-target bg-white/5 border border-white/10 rounded-full w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className={`text-white/60 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[var(--tg-theme-button-color)]" size={32} />
          <span className="text-sm font-medium text-white/40">Syncing secure vault...</span>
        </div>
      ) : isError ? (
        <div className="p-4 glass-panel rounded-2xl text-center text-red-400 text-sm">
          Failed to load OTPs. Please check your connection.
        </div>
      ) : !smsList || smsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Inbox size={32} className="text-white/40" />
          </div>
          <span className="text-sm font-medium text-white/40">No secure messages found.</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[var(--tg-theme-button-color)] uppercase tracking-wider ml-1">Latest Code</h3>
            {latestOTP && <OTPCard sms={latestOTP} />}
          </div>

          {recentOTPs.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1 mt-4">Recent</h3>
              <div className="flex flex-col gap-3">
                {recentOTPs.map((sms: any, idx: number) => (
                  <OTPCard key={sms.receivedAt || idx} sms={sms} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
