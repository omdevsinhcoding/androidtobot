import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Inbox } from 'lucide-react';
import { OTPCard } from '../OTPCard';

export const HistoryTab: React.FC = () => {
  const { data: smsList, isLoading, isError } = useQuery({
    queryKey: ['sms'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      return res.data || [];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-black text-white tracking-tight">History</h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-white/40" size={24} />
        </div>
      ) : isError ? (
        <div className="p-4 glass-panel rounded-2xl text-center text-red-400 text-sm">
          Failed to load history.
        </div>
      ) : !smsList || smsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
          <Inbox size={32} className="text-white/40" />
          <span className="text-sm font-medium text-white/40">History is empty.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {smsList.map((sms: any, idx: number) => (
            <OTPCard key={sms.receivedAt || idx} sms={sms} />
          ))}
        </div>
      )}
    </div>
  );
};
