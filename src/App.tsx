import React, { useState, useMemo, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useUser, useLatestSMS, useAllSMS, useAdminUsers, useUpdateUserStatus } from './hooks/useSMS';
import { OTPCard } from './components/OTPCard';
import { 
  Home, 
  History as HistoryIcon, 
  ShoppingBag,
  User as UserIcon, 
  RefreshCw, 
  Headphones, 
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'history' | 'admin'>('feed');
  const [filter, setFilter] = useState('Latest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    try {
      if (WebApp.disableVerticalSwipes) {
        WebApp.disableVerticalSwipes();
      }
    } catch(e) {}
  }, []);

  const { data: user, isLoading: userLoading, isError: userError } = useUser();
  const { data: latestSms, isLoading: latestLoading, refetch: refetchLatest } = useLatestSMS();
  const { data: allSms, isLoading: allLoading, refetch: refetchAll } = useAllSMS();

  const assignedServices = useMemo(() => {
    try {
      if (!user?.assigned_services) return [];
      const parsed = typeof user.assigned_services === 'string' ? JSON.parse(user.assigned_services) : user.assigned_services;
      return Array.isArray(parsed) ? parsed.map((s: string) => s.trim()) : [];
    } catch {
      return [];
    }
  }, [user?.assigned_services]);

  const hasAllAccess = useMemo(() => {
    if (!assignedServices) return false;
    return assignedServices.some((s: string) => {
      const l = s.toLowerCase();
      return l.includes('all') || l === '*' || l.includes('all sms');
    });
  }, [assignedServices]);

  const tabs = useMemo(() => {
    const t: string[] = [];
    if (hasAllAccess) t.push('All');
    t.push('Latest');
    
    assignedServices.forEach((s: string) => {
      const clean = s.replace(/\s*OTP\s*$/i, '').trim();
      const l = clean.toLowerCase();
      if (l !== 'all' && l !== 'all sms' && l !== '*' && !t.map(x => x.toLowerCase()).includes(l)) {
        if (clean) t.push(clean);
      }
    });
    return t;
  }, [hasAllAccess, assignedServices]);

  useEffect(() => {
    if (!userLoading && tabs.length > 0 && !tabs.includes(filter)) {
      setFilter('Latest');
    }
  }, [userLoading, tabs, filter]);

  const currentPool = useMemo(() => Array.isArray(allSms) ? allSms : [], [allSms]);

  const displaySms = useMemo(() => {
    if (filter === 'Latest') {
      if (latestSms && latestSms.text) return [latestSms];
      return currentPool.length > 0 ? [currentPool[0]] : [];
    }
    if (filter === 'All') return currentPool;
    
    const fStr = filter.toLowerCase();
    return currentPool.filter((s: any) => {
      const bodyText = (s.text || '').toLowerCase();
      const fromStr = (s.from || '').toLowerCase();
      return bodyText.includes(fStr) || fromStr.includes(fStr);
    });
  }, [filter, latestSms, currentPool]);

  const refetchData = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchLatest(), refetchAll()]);
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback
  };

  const isDataLoading = latestLoading || allLoading || isRefreshing;

  // Render Restricted Access
  if (!WebApp.initDataUnsafe?.user) {
     return (
       <div className="app-shell font-sans text-center justify-center items-center p-6 bg-black z-[9999]">
          <ShieldCheck size={64} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h1 className="text-2xl font-black tracking-tight text-white mb-2">Restricted Access</h1>
          <p className="text-sm text-white/60 max-w-xs leading-relaxed">
             This secure protocol must be accessed exclusively through the designated Telegram interface.
          </p>
       </div>
     );
  }

  // Render Initial Loading
  if (userLoading) {
    return (
      <div className="app-shell font-sans bg-[#0c0c0c]">
        <main className="app-main items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-6" />
            <div className="absolute inset-0 flex items-center justify-center blur-xl bg-indigo-500/20 rounded-full" />
          </div>
          <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">CONNECTING TO SECURE RELAY...</p>
        </main>
      </div>
    );
  }

  // Render Pending Approval
  if (userError || (!user && !userLoading)) {
    return (
       <div className="app-shell font-sans text-center justify-center items-center p-6 bg-[#0c0c0c] z-[9999]">
          <div className="relative mb-8">
            <ShieldCheck size={64} className="text-yellow-500" />
            <div className="absolute inset-0 flex items-center justify-center blur-2xl bg-yellow-500/30 rounded-full" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-3">Awaiting Approval</h1>
          <p className="text-sm text-white/60 max-w-xs leading-relaxed mb-8">
             Your access request is currently pending administrator review. Please wait for authorization.
          </p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 rounded-full bg-gradient-to-r from-white to-white/80 text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all">
            Refresh Status
          </button>
       </div>
    );
  }

  const pageTransition = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
    transition: { duration: 0.25, ease: 'easeOut' }
  } as const;

  return (
    <div className="app-shell font-sans relative">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-indigo-500/10 blur-[100px] rounded-[100%] pointer-events-none -z-10" />

      {/* Header */}
      <header className="app-header flex items-center justify-between px-5">
        <div className="flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">OTP Inbox</h1>
            <div className="flex relative">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-green-500 absolute inset-0 blur-sm" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 h-full">
          <button 
            onClick={refetchData}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDataLoading ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/20'} border shadow-lg`}
          >
            <RefreshCw size={18} className={`${isDataLoading ? "animate-spin text-indigo-400" : "text-white"} transition-colors`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main w-full pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div 
              key="feed" 
              {...pageTransition}
              className="px-4 pb-4 w-full max-w-lg mx-auto mt-2"
            >
              {/* Premium Top Tabs */}
              <div className="top-tabs-wrapper shadow-none bg-transparent border-none px-0 mb-6 mx-0">
                <div className="flex gap-2 overflow-x-auto hidden-scrollbar py-1">
                   {tabs.map(f => {
                     const isActive = filter === f;
                     return (
                       <button
                         key={f}
                         onClick={() => setFilter(f)}
                         className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border shrink-0 ${
                           isActive 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-[0_4px_20px_rgba(99,102,241,0.4)]' 
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                         }`}
                       >
                         {f}
                       </button>
                     );
                   })}
                </div>
              </div>

              <div className="space-y-4">
                 {displaySms.length === 0 ? (
                    <div className="py-24 text-center px-4">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all duration-500 ${isDataLoading ? 'bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-[#111] border border-white/10'}`}>
                        <RefreshCw size={32} className={`${isDataLoading ? "animate-spin text-indigo-400" : "text-white/30"}`} />
                      </div>
                      <p className="text-xl font-bold text-white mb-2">{isDataLoading ? 'Syncing Inbox...' : 'No OTPs Found'}</p>
                      <p className="text-sm text-white/50 mb-8">{isDataLoading ? 'Securely fetching the latest messages from the relay.' : 'Your inbox is completely empty right now.'}</p>
                      {!isDataLoading && (
                        <button 
                          onClick={refetchData}
                          className="px-8 py-4 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                           Tap to Refresh
                        </button>
                      )}
                    </div>
                 ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      {displaySms.map((sms: any, idx: number) => (
                        <motion.div 
                          key={sms.receivedAt || idx}
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        >
                          <OTPCard sms={sms} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile" 
              {...pageTransition}
              className="px-4 pt-6 pb-6 space-y-6 w-full max-w-lg mx-auto"
            >
              {/* Premium Profile Card */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/30 blur-3xl rounded-full" />
                 
                 {/* Explicitly fixing Profile Picture Size with strict inline styles */}
                 <div 
                   style={{ width: '88px', height: '88px', minWidth: '88px', minHeight: '88px' }}
                   className="rounded-full bg-[#111] border-2 border-indigo-500/50 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0 z-10 p-1"
                 >
                    {WebApp.initDataUnsafe?.user?.photo_url ? (
                      <img 
                        src={WebApp.initDataUnsafe.user.photo_url} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                       <UserIcon size={32} className="text-white/40" />
                    )}
                 </div>

                 <div className="flex flex-col justify-center z-10">
                    <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
                       {user?.full_name || WebApp.initDataUnsafe?.user?.first_name || 'Protocol User'}
                    </h2>
                    <div className="px-3 py-1 rounded-full bg-white/10 border border-white/5 inline-flex items-center self-center">
                       <p className="text-xs font-bold text-white/70 font-mono">
                          @{user?.telegram_username || WebApp.initDataUnsafe?.user?.username || 'unknown'}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Control Terminal Interface */}
              <div className="space-y-4">
                 <div className="flex flex-col gap-3">
                    {user?.isAdmin && (
                      <button 
                        onClick={() => setActiveTab('admin')}
                        className="w-full bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/30 rounded-2xl p-5 flex items-center justify-between group hover:border-red-500/60 transition-all shadow-lg"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                               <ShieldCheck size={20} className="text-red-400" />
                            </div>
                            <div className="text-left">
                               <span className="block text-base font-bold text-red-100">Admin Dashboard</span>
                               <span className="block text-xs font-medium text-red-400/70">Manage user access & roles</span>
                            </div>
                         </div>
                         <ChevronRight size={20} className="text-red-500/50 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    )}

                    <button className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                             <Headphones size={20} className="text-white/60" />
                          </div>
                          <div className="text-left">
                             <span className="block text-base font-bold text-white">Support Center</span>
                             <span className="block text-xs font-medium text-white/40">Get help with the protocol</span>
                          </div>
                       </div>
                    </button>

                    <button className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                             <SettingsIcon size={20} className="text-white/60" />
                          </div>
                          <div className="text-left">
                             <span className="block text-base font-bold text-white">Configuration</span>
                             <span className="block text-xs font-medium text-white/40">System preferences</span>
                          </div>
                       </div>
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div 
              key="admin" 
              {...pageTransition}
              className="px-4 pt-6 pb-6 space-y-4 w-full max-w-lg mx-auto"
            >
               <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('profile')} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <h2 className="text-2xl font-black text-white">Admin Hub</h2>
               </div>
               
               <AdminView />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" {...pageTransition} className="px-4 pt-6 pb-6 w-full max-w-lg mx-auto">
               <div className="mb-6 px-2">
                  <h2 className="text-2xl font-black text-white">History</h2>
                  <p className="text-sm font-medium text-white/50 mt-1">Your complete OTP timeline</p>
               </div>
               <div className="space-y-4">
                 {isDataLoading && currentPool.length === 0 ? (
                    <div className="py-24 text-center px-4">
                       <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                         <RefreshCw size={32} className="text-indigo-400 animate-spin" />
                       </div>
                       <p className="text-xl font-bold text-white">Loading History...</p>
                    </div>
                 ) : currentPool.length === 0 ? (
                    <div className="py-24 text-center px-4">
                       <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-[#111] border border-white/10">
                         <HistoryIcon size={32} className="text-white/20" />
                       </div>
                       <p className="text-xl font-bold text-white mb-2">No Records Found</p>
                       <p className="text-sm text-white/50 mb-8">Your historical data is completely empty.</p>
                       <button 
                          onClick={refetchData}
                          className="px-8 py-4 bg-white/10 text-white border border-white/10 rounded-full text-sm font-bold hover:bg-white/20 active:scale-95 transition-all"
                        >
                           Tap to Refresh
                        </button>
                    </div>
                 ) : (
                    currentPool.map((sms: any, idx: number) => (
                       <div key={sms.receivedAt || idx} className="opacity-90 hover:opacity-100 transition-opacity duration-200">
                          <OTPCard sms={sms} />
                       </div>
                    ))
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav for Eye-Catchy Modern Look */}
      <div className="fixed bottom-0 left-0 w-full z-[100] px-4 pb-4">
         <footer className="app-footer max-w-sm mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-full backdrop-blur-xl border border-white/10 bg-black/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-50" />
            <div className="w-full h-[70px] flex items-center justify-between px-2 relative z-10">
               <NavItem 
                  icon={<Home size={22} />} 
                  label="Inbox" 
                  active={activeTab === 'feed'} 
                  onClick={() => setActiveTab('feed')} 
               />
               <NavItem 
                  icon={<HistoryIcon size={22} />} 
                  label="History" 
                  active={activeTab === 'history'} 
                  onClick={() => setActiveTab('history')} 
               />
               <NavItem 
                  icon={<UserIcon size={22} />} 
                  label="System" 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
               />
            </div>
         </footer>
      </div>

      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #000000; }
        .drop-shadow-glow { filter: drop-shadow(0 0 10px rgba(79,70,229,0.5)); }
        .shadow-glass { box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center h-full w-[80px] rounded-[1.2rem] transition-all duration-300 cursor-pointer ${active ? 'text-white' : 'text-white/40 hover:text-white/80'} relative`}
    >
       {active && (
         <motion.div 
           layoutId="nav-pill"
           className="absolute inset-2 bg-white/10 rounded-[1rem] -z-10"
           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
         />
       )}
       <div className={`mb-1 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'scale-100'}`}>
          {icon}
       </div>
       <span className={`text-[10px] font-bold tracking-wide transition-all ${active ? 'opacity-100' : 'opacity-0 translate-y-1'}`}>{label}</span>
    </button>
  );
}

function AdminView() {
  const { data: users, isLoading } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <div className="text-indigo-400 text-xs font-bold tabular-nums text-center p-8 bg-indigo-500/10 rounded-2xl animate-pulse border border-indigo-500/20">FETCHING SECURE RECORDS...</div>;
  if (!users) return <div className="text-red-500 text-xs font-bold tabular-nums text-center p-8 bg-red-500/10 rounded-2xl border border-red-500/20">ACCESS DENIED - AUTHORIZATION FAILED</div>;

  const pendingUsers = users.filter((u: any) => u.status === 'pending');
  const otherUsers = users.filter((u: any) => u.status !== 'pending');

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/60 px-2 uppercase tracking-widest">Pending Requests</h3>
          <div className="space-y-3">
            {pendingUsers.map((u: any) => (
              <div key={u.id} className="p-5 bg-gradient-to-br from-[#111] to-[#0c0c0c] rounded-2xl border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className="text-base font-black text-white">{u.full_name}</div>
                    <div className="text-xs text-white/50 font-mono mt-0.5">@{u.telegram_username} | ID: {u.telegram_id}</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black tracking-widest uppercase">
                    Pending
                  </div>
                </div>
                <div className="text-xs text-indigo-400 font-mono tracking-widest break-words bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 relative z-10">
                  Req: {(() => {
                    try { return JSON.parse(u.requested_services).join(', ') } catch { return u.requested_services }
                  })()}
                </div>
                <div className="flex gap-3 pt-2 relative z-10">
                  <button 
                    onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] active:scale-95 transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-3.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all font-black uppercase text-xs tracking-widest border border-red-500/20"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/60 px-2 uppercase tracking-widest">User Directory</h3>
        <div className="space-y-3">
          {otherUsers.map((u: any) => (
             <div key={u.id} className="p-4 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors rounded-2xl flex items-center justify-between">
                <div>
                   <div className="text-sm font-bold text-white/90">{u.full_name}</div>
                   <div className="text-[11px] text-white/40 font-mono mt-0.5">{u.telegram_id}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                    u.status === 'approved' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                    u.status === 'rejected' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {u.status}
                  </span>
                  {u.status === 'approved' && (
                    <button 
                      onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'banned' })}
                      className="p-1.5 px-3 text-[10px] bg-red-500/10 text-red-500 rounded-md font-black tracking-widest uppercase hover:bg-red-500/20 transition-colors"
                    >
                      Ban
                    </button>
                  )}
                  {['rejected', 'banned'].includes(u.status) && (
                    <button 
                      onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'approved' })}
                      className="p-1.5 px-3 text-[10px] bg-green-500/10 text-green-500 rounded-md font-black tracking-widest uppercase hover:bg-green-500/20 transition-colors"
                    >
                      Unban
                    </button>
                  )}
                </div>
             </div>
          ))}
          {otherUsers.length === 0 && <div className="text-white/20 text-xs font-mono text-center py-8 bg-[#111] rounded-2xl border border-white/5">No directory records found.</div>}
        </div>
      </div>
    </div>
  );
}

