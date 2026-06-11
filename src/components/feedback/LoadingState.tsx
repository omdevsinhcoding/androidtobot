import React from 'react';
import { motion } from 'framer-motion';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full">
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          className="glass-panel-light rounded-[28px] p-6 border-white/5 h-[140px] shadow-none flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-32 bg-white/10 rounded-full" />
            <div className="h-5 w-16 bg-white/10 rounded-full" />
          </div>
          <div className="h-12 w-full bg-white/10 rounded-xl mb-3" />
          <div className="h-3 w-1/3 bg-white/10 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
};
