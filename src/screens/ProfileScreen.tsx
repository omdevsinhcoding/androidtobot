import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { ProfileCard } from '../components/domains/ProfileCard';
import { GlassCard } from '../components/ui/GlassCard';

interface ProfileScreenProps {
  user: any;
  tgUser: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, tgUser }) => {
  const profilePicUrl = tgUser?.photo_url || `https://ui-avatars.com/api/?name=${tgUser?.first_name || 'U'}&background=0ea5e9&color=fff&size=128`;

  return (
    <div className="flex flex-col h-full w-full px-4 pb-32">
      
      {/* Balanced Profile Header */}
      <GlassCard variant="light" className="flex flex-col items-center justify-center relative overflow-hidden mb-8 mt-2 p-8 border-sky-500/10">
        <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-sky-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Animated Radar Pulse Avatar (Balanced Size) */}
        <div className="relative z-10 mb-5 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-sky-400/30"
          />
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute inset-0 rounded-full border border-sky-400/20"
          />
          
          <div className="relative rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-md border border-white/10 shadow-2xl z-20">
            <div className="rounded-full overflow-hidden bg-[#0a0a0a] w-[80px] h-[80px]">
              <img 
                src={profilePicUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-[2px] border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
          </div>
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight drop-shadow-md">
            {tgUser?.first_name} {tgUser?.last_name}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(14,165,233,0.15)]">
            <Shield size={12} />
            <span>Vault Protected</span>
          </div>
        </div>
      </GlassCard>

      <ProfileCard user={user} tgUser={tgUser} />
    </div>
  );
};
