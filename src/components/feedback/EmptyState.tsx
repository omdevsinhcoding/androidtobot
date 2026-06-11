import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center h-full"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-2xl" />
        <div className="glass-panel-light w-24 h-24 rounded-[32px] flex items-center justify-center relative border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <Icon size={40} className="text-white/60" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-white/40 text-[15px] max-w-[260px] leading-relaxed">{description}</p>
    </motion.div>
  );
};
