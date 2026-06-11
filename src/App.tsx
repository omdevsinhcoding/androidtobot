import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import { ShieldAlert, Loader2 } from 'lucide-react';

import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/tabs/HomeTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { AdminTab } from './components/tabs/AdminTab';

// Mock user for local dev if WebApp.initDataUnsafe is empty
const mockTgUser = {
  id: 123456,
  first_name: "Local",
  last_name: "Admin",
  username: "localadmin",
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    // 1. Fully expand the WebApp to break out of small bottom sheet
    WebApp.expand();
    
    // 2. Set Header Color to match dark theme
    WebApp.setHeaderColor('#0a0a0a');
    WebApp.setBackgroundColor('#000000');
    
    // Lock scrolling on iOS inside Telegram Mini App
    WebApp.ready();

    // 3. Initialize user
    // @ts-ignore
    const user = WebApp.initDataUnsafe?.user || (import.meta.env?.DEV ? mockTgUser : null);
    setTgUser(user);

    if (user) {
      axios.defaults.headers.common['x-telegram-id'] = user.id.toString();
    }
  }, []);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', tgUser?.id],
    queryFn: async () => {
      const res = await axios.get('/api/user/me');
      return res.data;
    },
    enabled: !!tgUser,
  });

  if (!tgUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center app-content-scroll">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-white/40">Please open this app directly from Telegram.</p>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 app-content-scroll">
        <Loader2 className="animate-spin text-[var(--tg-theme-button-color)]" size={32} />
        <p className="text-white/40 font-medium tracking-wide">Authenticating...</p>
      </div>
    );
  }

  const isPending = !userData || userData.status === 'pending';
  const isRejected = userData?.status === 'rejected';
  const isBanned = userData?.status === 'banned';

  if (isPending || isRejected || isBanned) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0a0a0a] app-content-scroll">
        <ShieldAlert size={64} className="text-[var(--tg-theme-button-color)] mb-6" />
        <h2 className="text-2xl font-black text-white mb-3">
          {isPending ? 'Request Pending' : isRejected ? 'Access Denied' : 'Account Banned'}
        </h2>
        <p className="text-white/60 leading-relaxed max-w-xs">
          {isPending 
            ? 'Your registration is currently under review by an administrator. You will be notified once approved.' 
            : 'Your account does not have access to the secure OTP vault.'}
        </p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'history': return <HistoryTab />;
      case 'profile': return <ProfileTab user={userData} tgUser={tgUser} />;
      case 'admin': return <AdminTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <>
      <main className="app-content-scroll bg-[#000000]">
        {renderTab()}
      </main>
      
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={!!userData?.isAdmin} 
      />
    </>
  );
}
