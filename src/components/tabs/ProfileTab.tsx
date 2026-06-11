import React from 'react';
import { User as UserType } from '../../../db';
import { Settings, Shield, KeyRound, Copy, Check, Activity } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ProfileTabProps {
  user: UserType | null;
  tgUser: any;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, tgUser }) => {
  const [copiedId, setCopiedId] = useState(false);

  // Fallback profile pic if user has none
  const profilePicUrl = tgUser?.photo_url || `https://ui-avatars.com/api/?name=${tgUser?.first_name || 'U'}&background=2AABEE&color=fff&size=128`;

  const handleCopyId = () => {
    if (tgUser?.id) {
      navigator.clipboard.writeText(tgUser.id.toString());
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-4 pb-10">
      
      {/* Premium Profile Header Card */}
      <div className="glass-panel rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden mb-8 mt-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/5">
        {/* Abstract background glows */}
        <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-sky-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-20%] w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Animated Radar Pulse Avatar */}
        <div className="relative z-10 mb-6 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-sky-400/30"
          />
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute inset-0 rounded-full border border-sky-400/20"
          />
          
          <div className="relative rounded-full p-1.5 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-md border border-white/10 shadow-2xl">
            <div className="rounded-full overflow-hidden bg-[#0a0a0a] w-[90px] h-[90px] relative z-20">
              <img 
                src={profilePicUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online Indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 border-[3px] border-[#0a0a0a] rounded-full shadow-[0_0_15px_rgba(74,222,128,0.6)] z-30" />
          </div>
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
            {tgUser?.first_name} {tgUser?.last_name}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(14,165,233,0.15)]">
            <Shield size={14} />
            <span>Secure Vault Protected</span>
          </div>
        </div>
      </div>

      <h3 className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3 px-2">Account Details</h3>
      
      {/* Settings List */}
      <div className="glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/5">
        
        {/* Row 1: User ID */}
        <button 
          onClick={handleCopyId}
          className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors active:bg-white/10 tap-target text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
              <Settings size={20} />
            </div>
            <span className="font-medium text-white/90">User ID</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-white/60 font-mono text-sm">{tgUser?.id}</span>
            {copiedId ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/40" />}
          </div>
        </button>

        {/* Row 2: Active Services */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 tap-target">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
              <KeyRound size={20} />
            </div>
            <span className="font-medium text-white/90">Active Services</span>
          </div>
          <div className="text-white/60 font-medium bg-white/5 px-3 py-1 rounded-lg">
            {user?.activeServices || 0} Apps
          </div>
        </div>

        {/* Row 3: Status */}
        <div className="flex items-center justify-between p-4 tap-target">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
              <Shield size={20} />
            </div>
            <span className="font-medium text-white/90">Account Status</span>
          </div>
          <div className={`px-3 py-1 rounded-xl text-sm font-semibold capitalize ${
            user?.status === 'approved' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {user?.status || 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
};
