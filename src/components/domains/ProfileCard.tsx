import React, { useState } from 'react';
import { Settings, Shield, KeyRound, Copy, Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ProfileCardProps {
  user: any;
  tgUser: any;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, tgUser }) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (tgUser?.id) {
      navigator.clipboard.writeText(tgUser.id.toString());
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h3 className="text-sky-400 text-[11px] font-bold uppercase tracking-[0.2em] px-2 mb-[-8px]">Account Security</h3>
      
      <GlassCard variant="light" className="p-0 overflow-hidden flex flex-col">
        
        {/* Row 1: User ID */}
        <button 
          onClick={handleCopyId}
          className="flex items-center justify-between p-5 border-b border-white/[0.08] hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors tap-target text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/5">
              <Settings size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white/90 text-[15px]">Telegram ID</span>
              <span className="text-white/40 text-xs">Tap to copy</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-white/80 font-mono text-sm">{tgUser?.id}</span>
            {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/40" />}
          </div>
        </button>

        {/* Row 2: Active Services */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/5">
              <KeyRound size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white/90 text-[15px]">Service Limits</span>
              <span className="text-white/40 text-xs">Active integrations</span>
            </div>
          </div>
          <div className="text-white/90 font-bold text-sm bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-xl border border-sky-500/20">
            {user?.activeServices || 0} Apps
          </div>
        </div>

        {/* Row 3: Status */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/5">
              <Shield size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white/90 text-[15px]">Access Status</span>
              <span className="text-white/40 text-xs">Vault permission</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
              {user?.status || 'Active'}
            </span>
          </div>
        </div>

      </GlassCard>
    </div>
  );
};
