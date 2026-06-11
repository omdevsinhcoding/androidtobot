import React, { useState, useMemo, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
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
  CheckCircle2,
  ShieldCheck,
  Server,
  Lock,
  Globe
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'history' | 'admin'>('feed');
  const [filter, setFilter] = useState('Latest');

  useEffect(() => {
    // Notify telegram app is ready
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
    await Promise.all([refetchLatest(), refetchAll()]);
  };

  // Rest of the app
  if (!WebApp.initDataUnsafe?.user) {
     return (
       <div className="app-shell font-sans text-center justify-center items-center p-6 bg-black z-[9999]">
          <ShieldCheck size={48} className="text-red-500/50 mb-6" />
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">Restricted Access</h1>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
             This secure protocol must be accessed exclusively through the designated Telegram interface.
          </p>
       </div>
     );
  }

  if (userLoading) {
    return (
      <div className="app-shell font-sans selection:bg-indigo-500/30">
        <header className="app-header flex justify-center items-center px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">OTP Manager</h1>
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
          </div>
        </header>
        <main className="app-main items-center justify-center">
          <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-white/50">Loading...</p>
        </main>
      </div>
    );
  }

  if (userError || (!user && !userLoading)) {
    return (
       <div className="app-shell font-sans text-center justify-center items-center p-6 bg-black z-[9999]">
          <ShieldCheck size={48} className="text-yellow-500/50 mb-6" />
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">Awaiting Approval</h1>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-6">
             Your access request is currently pending administrator review. Please wait for authorization.
          </p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 active:bg-white/80 transition-all">
            Refresh Status
          </button>
       </div>
    );
  }

  const pageTransition = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.3, ease: 'easeOut' as const }
  };

  return (
    <div className="app-shell font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="app-header shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex items-center justify-between px-4">
        <div className="flex flex-col justify-center h-full">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">OTP Inbox</h1>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="flex items-center gap-3 h-full">
          <button 
            onClick={refetchData}
            className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center active:scale-95 transition-all group shadow-glass"
          >
            <RefreshCw size={16} className={`${latestLoading || allLoading ? "animate-spin text-indigo-500" : "text-white/20 group-hover:text-white/40"} transition-colors`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div 
              key="feed" 
              {...pageTransition}
              className="px-4 pb-4 w-full max-w-lg mx-auto"
            >
              <div className="top-tabs-wrapper shadow-sm flex gap-2 overflow-x-auto hidden-scrollbar mb-4">
                 {tabs.map(f => (
                   <button
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border shrink-0 ${
                       filter === f 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/10 text-white/60 border-transparent hover:bg-white/20'
                     }`}
                   >
                     {f}
                   </button>
                 ))}
              </div>

              <div className="space-y-3">
                 {displaySms.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 bg-[#0c0c0c] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                        <RefreshCw size={24} className={`${latestLoading || allLoading ? "animate-spin text-indigo-500" : "text-white/5"}`} />
                      </div>
                      <p className="text-lg font-medium text-white/50">{latestLoading || allLoading ? 'Loading OTPs...' : 'No OTPs found'}</p>
                      {!latestLoading && !allLoading && (
                        <button 
                          onClick={refetchData}
                          className="mt-4 px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 active:scale-95 transition-all"
                        >
                           Refresh Inbox
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
              className="px-4 pt-4 pb-6 space-y-4 w-full max-w-lg mx-auto"
            >
              {/* Clean Industrial Profile */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-2 text-center shadow-lg">
                 <div 
                   className="w-20 h-20 shrink-0 rounded-full bg-[#111] border border-white/10 flex items-center justify-center relative overflow-hidden mb-2 shadow-inner"
                 >
                    {WebApp.initDataUnsafe?.user?.photo_url ? (
                      <img 
                        src={WebApp.initDataUnsafe.user.photo_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                       <UserIcon size={32} className="text-white/10" />
                    )}
                 </div>

                 <div className="flex flex-col justify-center">
                    <h2 className="text-lg font-bold text-white mb-0.5">
                       {user?.full_name || WebApp.initDataUnsafe?.user?.first_name || 'Protocol User'}
                    </h2>
                    <p className="text-sm font-medium text-white/50">
                       @{user?.telegram_username || WebApp.initDataUnsafe?.user?.username || 'unknown'}
                    </p>
                 </div>
              </div>

              {/* Control Terminal Interface */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/40 px-2 mt-2">Settings</h3>
                 
                 <div className="flex flex-col gap-2">
                    {user?.isAdmin && (
                      <button 
                        onClick={() => setActiveTab('admin')}
                        className="w-full bg-[#0c0c0c] border border-red-900/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-red-900/5 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <ShieldCheck size={20} className="text-red-900" />
                            <span className="text-sm font-medium text-white">Admin Settings</span>
                         </div>
                      </button>
                    )}

                    <button className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                       <div className="flex items-center gap-3">
                          <Headphones size={20} className="text-white/20" />
                          <span className="text-sm font-medium text-white">Support</span>
                       </div>
                    </button>

                    <button className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                       <div className="flex items-center gap-3">
                          <SettingsIcon size={20} className="text-white/20" />
                          <span className="text-sm font-medium text-white">Configuration</span>
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
              className="px-4 pt-4 pb-6 space-y-4 w-full max-w-lg mx-auto"
            >
               <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setActiveTab('profile')} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white"><ChevronRight className="rotate-180" size={18} /></button>
                  <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
               </div>
               
               <AdminView />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" {...pageTransition} className="px-6 pt-6 pb-6 w-full max-w-lg mx-auto">
               <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white">History</h2>
                  <p className="text-sm text-white/50 mt-1">Your complete OTP history</p>
               </div>
               <div className="space-y-4">
                 {allLoading ? (
                    <div className="py-20 text-center">
                       <RefreshCw size={48} className="mx-auto mb-6 text-indigo-500/50 animate-spin" />
                       <p className="text-base text-white/40">Loading history...</p>
                    </div>
                 ) : currentPool.length === 0 ? (
                    <div className="py-20 text-center">
                       <RefreshCw size={48} className="mx-auto mb-6 text-indigo-500/10" />
                       <p className="text-base text-white/40">No history found</p>
                    </div>
                 ) : (
                    currentPool.map((sms: any, idx: number) => (
                       <div key={sms.receivedAt || idx} className="opacity-80 hover:opacity-100 transition-opacity duration-200">
                          <OTPCard sms={sms} />
                       </div>
                    ))
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer shadow-[0_-10px_40px_rgba(0,0,0,0.8)] px-2">
         <div className="w-full max-w-[400px] h-full flex items-center justify-between px-6">
            <NavItem 
               icon={<Home size={24} />} 
               label="HOME" 
               active={activeTab === 'feed'} 
               onClick={() => setActiveTab('feed')} 
            />
            <NavItem 
               icon={<ShoppingBag size={24} />} 
               label="HISTORY" 
               active={activeTab === 'history'} 
               onClick={() => setActiveTab('history')} 
            />
            <NavItem 
               icon={<UserIcon size={24} />} 
               label="SYSTEM" 
               active={activeTab === 'profile'} 
               onClick={() => setActiveTab('profile')} 
            />
         </div>
      </footer>

      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #000000; }
        .drop-shadow-glow { filter: drop-shadow(0 0 10px rgba(79,70,229,0.2)); }
        .shadow-glass { box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center h-full flex-1 gap-1 transition-colors duration-200 cursor-pointer ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
    >
       <div className="mb-0.5">{icon}</div>
       <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function AdminView() {
  const { data: users, isLoading } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <div className="text-white/40 text-xs tabular-nums text-center p-4">CONNECTING...</div>;
  if (!users) return <div className="text-red-500 text-xs tabular-nums text-center p-4">ACCESS DENIED</div>;

  const pendingUsers = users.filter((u: any) => u.status === 'pending');
  const otherUsers = users.filter((u: any) => u.status !== 'pending');

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60 px-2 mt-4">Pending Requests</h3>
          <div className="space-y-3">
            {pendingUsers.map((u: any) => (
              <div key={u.id} className="p-4 bg-[#0c0c0c] rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold text-white italic">{u.full_name}</div>
                    <div className="text-xs text-white/40 font-mono">@{u.telegram_username} | ID: {u.telegram_id}</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-black tracking-widest uppercase">
                    Pending
                  </div>
                </div>
                <div className="text-xs text-indigo-400 font-mono tracking-widest break-words">
                  Req: {(() => {
                    try { return JSON.parse(u.requested_services).join(', ') } catch { return u.requested_services }
                  })()}
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-3 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 active:bg-indigo-500/30 transition-all font-black uppercase text-xs tracking-widest border border-indigo-500/20"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 active:bg-red-500/30 transition-all font-black uppercase text-xs tracking-widest border border-red-500/20"
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
          <h3 className="text-sm font-medium text-white/60 px-2 mt-4">User Directory</h3>
        <div className="space-y-2">
          {otherUsers.map((u: any) => (
             <div key={u.id} className="p-3 bg-white/[0.02] rounded-xl flex items-center justify-between">
                <div>
                   <div className="text-xs font-bold text-white/80">{u.full_name}</div>
                   <div className="text-[10px] text-white/30 font-mono">{u.telegram_id}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                    u.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                    u.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {u.status}
                  </span>
                  {u.status === 'approved' && (
                    <button 
                      onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'banned' })}
                      className="p-1 px-2 text-[10px] bg-red-500/10 text-red-500 rounded font-black tracking-widest uppercase hover:bg-red-500/20"
                    >
                      Ban
                    </button>
                  )}
                  {['rejected', 'banned'].includes(u.status) && (
                    <button 
                      onClick={() => updateStatus.mutate({ telegramId: u.telegram_id, status: 'approved' })}
                      className="p-1 px-2 text-[10px] bg-green-500/10 text-green-500 rounded font-black tracking-widest uppercase hover:bg-green-500/20"
                    >
                      Unban
                    </button>
                  )}
                </div>
             </div>
          ))}
          {otherUsers.length === 0 && <div className="text-white/20 text-xs font-mono text-center py-4">No records found.</div>}
        </div>
      </div>
    </div>
  );
}
