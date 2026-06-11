import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0a0a0a] app-content-scroll">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-white mb-3">Access Denied</h2>
        <p className="text-white/60 leading-relaxed max-w-xs">
          Your account does not have access to the secure OTP vault. Please register through the Telegram bot first.
        </p>
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
    <div className="mesh-bg text-white h-[100dvh] w-full flex flex-col font-sans antialiased overflow-hidden relative">
      <div className="noise-overlay"></div>
      
      {/* Advanced Animated Background Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          x: [0, 50, 0],
          opacity: [0.2, 0.4, 0.2] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" 
      />

      {/* Main scrolling content area */}
      <main className="app-content-scroll z-10 relative">
        <div className="max-w-xl mx-auto">
          {renderTab()}
        </div>
      </main>
      
      {/* Floating Bottom Navigation */}
      <div className="z-50 max-w-xl mx-auto w-full absolute bottom-6 left-1/2 -translate-x-1/2 px-4">
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={!!userData?.isAdmin} 
        />
      </div>
    </div>
  );
}
