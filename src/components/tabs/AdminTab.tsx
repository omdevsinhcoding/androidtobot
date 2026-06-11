import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, UserCheck, UserX, Users } from 'lucide-react';

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight">Admin</h2>
        <div className="bg-white/10 rounded-full flex p-1">
          <button 
            onClick={() => setActiveSegment('pending')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeSegment === 'pending' ? 'bg-[var(--tg-theme-button-color)] text-white' : 'text-white/40'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveSegment('active')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeSegment === 'active' ? 'bg-[var(--tg-theme-button-color)] text-white' : 'text-white/40'}`}
          >
            Active
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-white/40" size={24} />
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
          <Users size={32} className="text-white/40" />
          <span className="text-sm font-medium text-white/40">No users found in this segment.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayUsers.map(user => (
            <div key={user.telegram_id} className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white">{user.full_name}</h3>
                  <p className="text-xs text-white/40 font-mono">{user.whatsapp}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--tg-theme-button-color)]">
                  {user.status}
                </span>
              </div>
              
              {user.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => mutation.mutate({ telegramId: user.telegram_id, status: 'approved' })}
                    disabled={mutation.isPending}
                    className="tap-target flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    <UserCheck size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => mutation.mutate({ telegramId: user.telegram_id, status: 'rejected' })}
                    disabled={mutation.isPending}
                    className="tap-target flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-sm active:scale-95 transition-transform"
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
