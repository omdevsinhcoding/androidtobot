import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, UserCheck, UserX, Users, UserCog, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UserType {
  id: number;
  tgId: string;
  status: 'pending' | 'approved' | 'rejected';
  activeServices: number;
  isAdmin: boolean;
}

export const AdminTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users');
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ tgId, status }: { tgId: string; status: string }) => {
      await axios.post(`/api/admin/users/${tgId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const updateServices = useMutation({
    mutationFn: async ({ tgId, activeServices }: { tgId: string; activeServices: number }) => {
      await axios.post(`/api/admin/users/${tgId}/services`, { activeServices });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const filteredUsers = users.filter((u: UserType) => {
    if (filter === 'all') return true;
    return u.status === filter;
  });

  return (
    <div className="flex flex-col h-full w-full px-2 pb-10">
      
      {/* Premium Header */}
      <div className="mb-6 px-2 pt-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={20} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-white/50 text-sm">Manage users and access permissions</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl mb-6 mx-2 border border-white/5">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl capitalize transition-all ${
              filter === f 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-white/30" size={32} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4">
              <Users size={28} className="opacity-50" />
            </div>
            <p>No users found in this category.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((u: UserType, index: number) => (
              <motion.div 
                key={u.tgId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel rounded-2xl p-4 border border-white/5 relative overflow-hidden"
              >
                {/* Status indicator line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  u.status === 'approved' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 
                  u.status === 'rejected' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                  'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                }`} />

                <div className="pl-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                        <UserCog size={16} />
                      </div>
                      <span className="font-mono text-sm text-white/90">{u.tgId}</span>
                    </div>
                    
                    {u.isAdmin && (
                      <span className="px-2 py-0.5 rounded border border-[var(--tg-theme-button-color)]/30 text-[var(--tg-theme-button-color)] text-xs font-bold uppercase tracking-wider bg-[var(--tg-theme-button-color)]/10">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 bg-black/40 rounded-xl p-3 border border-white/5">
                    <span className="text-xs text-white/50 font-medium">Services Limit:</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateServices.mutate({ tgId: u.tgId, activeServices: Math.max(0, u.activeServices - 1) })}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                        disabled={updateServices.isPending}
                      >
                        -
                      </button>
                      <span className="font-mono font-bold w-4 text-center text-white">{u.activeServices}</span>
                      <button 
                        onClick={() => updateServices.mutate({ tgId: u.tgId, activeServices: u.activeServices + 1 })}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                        disabled={updateServices.isPending}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {u.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStatus.mutate({ tgId: u.tgId, status: 'approved' })}
                        className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 font-semibold flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        disabled={updateStatus.isPending}
                      >
                        <UserCheck size={18} /> Approve
                      </button>
                      <button 
                        onClick={() => updateStatus.mutate({ tgId: u.tgId, status: 'rejected' })}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors border border-red-500/30"
                        disabled={updateStatus.isPending}
                      >
                        <UserX size={18} /> Reject
                      </button>
                    </div>
                  )}

                  {u.status !== 'pending' && !u.isAdmin && (
                    <button 
                      onClick={() => updateStatus.mutate({ tgId: u.tgId, status: u.status === 'approved' ? 'rejected' : 'approved' })}
                      className="w-full py-2.5 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors border border-white/5"
                      disabled={updateStatus.isPending}
                    >
                      {u.status === 'approved' ? 'Revoke Access' : 'Restore Access'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
