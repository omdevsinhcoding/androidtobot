import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, UserCheck, UserX, Users, UserCog } from 'lucide-react';

export interface UserType {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  full_name: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  requested_services: string;
  assigned_services: string | null;
  registered_at: string;
}

export const AdminTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSegment, setActiveSegment] = useState<'pending' | 'active'>('pending');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users');
      return res.data as UserType[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ telegramId, status }: { telegramId: string; status: string }) => {
      await axios.post(`/api/admin/users/${telegramId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });

  const pendingUsers = users?.filter(u => u.status === 'pending') || [];
  const activeUsers = users?.filter(u => u.status === 'approved') || [];

  const displayUsers = activeSegment === 'pending' ? pendingUsers : activeUsers;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#000000]/90 backdrop-blur-md z-40 py-2 -mx-4 px-4">
        <h2 className="text-xl font-black text-white tracking-tight">Admin</h2>
        
        {/* Segmented Control */}
        <div className="bg-white/10 rounded-xl flex p-1 border border-white/5">
          <button 
            onClick={() => setActiveSegment('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'pending' 
                ? 'bg-[var(--tg-theme-button-color)] text-white shadow-sm' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Pending
            {pendingUsers.length > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">{pendingUsers.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveSegment('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSegment === 'active' 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Active
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[var(--tg-theme-button-color)]" size={32} />
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <Users size={32} className="text-white/20" />
          </div>
          <span className="text-sm font-bold text-white/40">No users found.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-4">
          {displayUsers.map(user => (
            <div key={user.telegram_id} className="card-panel p-4 rounded-3xl flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <UserCog size={18} className="text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user.full_name}</h3>
                    <p className="text-xs text-white/40 font-mono mt-0.5">{user.whatsapp}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                  user.status === 'pending' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  {user.status}
                </span>
              </div>
              
              {user.status === 'pending' && (
                <div className="flex gap-2 mt-2 z-10">
                  <button 
                    onClick={() => mutation.mutate({ telegramId: user.telegram_id, status: 'approved' })}
                    disabled={mutation.isPending}
                    className="tap-target flex-1 flex items-center justify-center gap-2 bg-[var(--tg-theme-button-color)] hover:bg-[var(--tg-theme-button-color)]/80 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                    Approve
                  </button>
                  <button 
                    onClick={() => mutation.mutate({ telegramId: user.telegram_id, status: 'rejected' })}
                    disabled={mutation.isPending}
                    className="tap-target flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-sm transition-all"
                  >
                    <UserX size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
