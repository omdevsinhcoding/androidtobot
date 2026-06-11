import React from 'react';
import { Settings, Shield, KeyRound, LogOut } from 'lucide-react';

export interface UserType {
  id: number;
  telegram_id: string;
  full_name: string;
  is_admin?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  assigned_services: string | null;
}

interface ProfileTabProps {
  user: UserType | null;
  tgUser: any;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, tgUser }) => {
  const profilePicUrl = tgUser?.photo_url;
  const fullName = user?.full_name || tgUser?.first_name || 'Anonymous';
  const role = user?.is_admin ? 'Administrator' : 'User';

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-black text-white tracking-tight">Profile</h2>

      {/* Profile Card */}
      <div className="glass-panel p-5 rounded-3xl flex items-center gap-4">
        <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--tg-theme-button-color)] bg-[#1a1a1a]">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-2xl font-black">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{fullName}</h3>
          <p className="text-sm font-medium text-[var(--tg-theme-button-color)]">{role}</p>
          <p className="text-xs text-white/40 mt-1 truncate">ID: {user?.telegram_id || tgUser?.id}</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1 mt-2">Settings</h3>
        
        <button className="tap-target glass-panel p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <KeyRound size={18} />
            </div>
            <span className="text-sm font-medium text-white">Active Services</span>
          </div>
          <span className="text-xs text-white/40">{user?.assigned_services?.length || 0} Apps</span>
        </button>

        <button className="tap-target glass-panel p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <span className="text-sm font-medium text-white">Account Status</span>
          </div>
          <span className="text-xs text-green-400 capitalize">{user?.status || 'Unknown'}</span>
        </button>
      </div>
    </div>
  );
};
