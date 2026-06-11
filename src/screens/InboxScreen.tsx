import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { OTPCard } from '../components/domains/OTPCard';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';

export const InboxScreen: React.FC = () => {
  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ['sms', 'recent'],
    queryFn: async () => {
      const res = await axios.get('/api/sms');
      if (!Array.isArray(res.data)) throw new Error('Invalid format');
      return res.data;
    },
    refetchInterval: 5000,
    retry: 2,
  });

  if (isError) {
    return <ErrorState message="Could not connect to the secure vault to fetch messages." onRetry={refetch} />;
  }

  if (isLoading && !messages) {
    return <LoadingState />;
  }

  if (!messages || messages.length === 0) {
    return (
      <EmptyState 
        icon={ShieldCheck} 
        title="Vault is Empty" 
        description="Incoming secure messages will appear here instantly." 
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 pb-32">
      <AnimatePresence>
        {messages.map((msg: any, index: number) => (
          <motion.div
            key={msg.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3) }}
          >
            <OTPCard sms={msg} highlight={index === 0} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
