import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import { ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { AppShell } from './components/layout/AppShell';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { InboxScreen } from './screens/InboxScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const mockTgUser = {
  id: 123456,
  first_name: "Local",
  last_name: "Admin",
  username: "localadmin",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    WebApp.expand();
    WebApp.setHeaderColor('#030509');
    WebApp.setBackgroundColor('#030509');
    WebApp.ready();

    // @ts-ignore
    const user = WebApp.initDataUnsafe?.user || (import.meta.env?.DEV ? mockTgUser : null);
    setTgUser(user);

    if (user) {
      axios.defaults.headers.common['x-telegram-id'] = user.id.toString();
    }
  }, []);

  const { data: userData, isLoading: userLoading, isError } = useQuery({
    queryKey: ['user', tgUser?.id],
    queryFn: async () => {
      const res = await axios.get('/api/user/me');
      return res.data;
    },
    enabled: !!tgUser,
  });

  if (!tgUser) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div className="glass-panel-light p-8 rounded-[32px] flex flex-col items-center max-w-[300px]">
             <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
                <ShieldAlert size={32} />
             </div>
             <p className="text-white/60 font-medium">Please open this app inside Telegram.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div className="glass-panel-light p-8 rounded-[32px] flex flex-col items-center max-w-[300px] border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)] relative">
            <div className="absolute inset-0 bg-red-500/10 rounded-[32px] blur-xl pointer-events-none" />
            <ShieldAlert size={48} className="text-red-500 mb-6 relative z-10" />
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight relative z-10">Access Denied</h2>
            <p className="text-white/50 text-[15px] leading-relaxed relative z-10">
              Your account does not have access to the secure OTP vault. Please register through the Telegram bot first.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (userLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="relative flex h-12 w-12">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-20"></span>
            <span className="relative inline-flex rounded-full h-12 w-12 border-2 border-sky-400/50"></span>
          </div>
        </div>
      </AppShell>
    );
  }

  const isPending = !userData || userData.status === 'pending';
  const isRejected = userData?.status === 'rejected';
  const isBanned = userData?.status === 'banned';

  if (isPending || isRejected || isBanned) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div className={`glass-panel-light p-8 rounded-[32px] flex flex-col items-center max-w-[300px] relative ${isPending ? 'border-amber-500/20' : 'border-red-500/20'}`}>
             <div className={`absolute inset-0 rounded-[32px] blur-xl pointer-events-none ${isPending ? 'bg-amber-500/10' : 'bg-red-500/10'}`} />
             <ShieldAlert size={48} className={`${isPending ? 'text-amber-500' : 'text-red-500'} mb-6 relative z-10`} />
             <h2 className="text-2xl font-black text-white mb-3 tracking-tight relative z-10">
               {isPending ? 'Request Pending' : isRejected ? 'Access Denied' : 'Account Banned'}
             </h2>
             <p className="text-white/50 text-[15px] leading-relaxed relative z-10">
               {isPending 
                 ? 'Your registration is under review by an administrator. You will be notified once approved.' 
                 : 'Your account does not have access to the secure OTP vault.'}
             </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopHeader />
      
      {/* Content Area with custom scrollbar hidden */}
      <div className="flex-1 app-scroll overflow-y-auto relative z-10 w-full pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {activeTab === 'inbox' && <InboxScreen />}
            {activeTab === 'history' && <HistoryScreen />}
            {activeTab === 'profile' && <ProfileScreen user={userData} tgUser={tgUser} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </AppShell>
  );
}
