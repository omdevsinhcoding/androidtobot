import React from 'react';
import { User as UserType } from '../../db';
import { Settings, Shield, KeyRound, Copy } from 'lucide-react';

interface ProfileTabProps {
  user: UserType | null;
  tgUser: any;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, tgUser }) => {
  const profilePicUrl = tgUser?.photo_url;
  const fullName = user?.full_name || tgUser?.first_name || 'Anonymous';
  const role = (user as any)?.isAdmin ? 'Administrator' : 'User';
  const displayId = user?.telegram_id || tgUser?.id;

  const copyId = () => {
    if (displayId) {
      navigator.clipboard.writeText(displayId.toString());
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-6 sticky top-0 bg-[#000000]/90 backdrop-blur-md z-40 py-2 -mx-4 px-4">
        <h2 className="text-xl font-black text-white tracking-tight">Profile</h2>
      </div>

      {/* Compact Profile Card */}
      <div className="card-panel p-4 rounded-3xl flex items-center gap-4 mb-8">
        <div className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/40 text-xl font-black">
              {fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">{fullName}</h3>
          <p className="text-xs font-bold text-[var(--tg-theme-button-color)] uppercase tracking-wider">{role}</p>
        </div>
      </div>

      {/* Settings Grid/List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 mb-1">Account details</h3>
        
        <div className="card-panel p-1 rounded-3xl flex flex-col">
          <div className="p-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
                <Settings size={18} />
              </div>
              <span className="text-sm font-bold text-white">User ID</span>
            </div>
            <button onClick={copyId} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg active:bg-white/10 transition-colors">
              <span className="text-xs font-mono text-white/60">{displayId}</span>
              <Copy size={12} className="text-white/40" />
            </button>
          </div>

          <div className="p-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-[var(--tg-theme-button-color)]">
                <KeyRound size={18} />
              </div>
              <span className="text-sm font-bold text-white">Active Services</span>
            </div>
            <span className="text-sm font-bold text-white/80 bg-white/5 px-3 py-1 rounded-lg">
              {user?.assigned_services ? user.assigned_services.split(',').length : 0}
            </span>
          </div>

          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <Shield size={18} />
              </div>
              <span className="text-sm font-bold text-white">Status</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-bold text-green-400 capitalize">{user?.status || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
