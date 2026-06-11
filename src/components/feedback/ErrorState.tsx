import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
        <div className="glass-panel-light border-red-500/20 w-24 h-24 rounded-[32px] flex items-center justify-center relative shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <ShieldAlert size={40} className="text-red-400" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Connection Lost</h3>
      <p className="text-white/40 text-[15px] max-w-[260px] leading-relaxed mb-8">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-8 py-4 glass-panel-light hover:bg-white/10 active:bg-white/5 transition-colors border-white/20 rounded-[20px] text-white/90 font-medium tap-target shadow-lg"
        >
          <RefreshCw size={18} className="text-sky-400" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
