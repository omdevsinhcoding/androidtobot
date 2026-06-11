import React from 'react';
import { Home, Clock, User, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inbox' },
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', icon: ShieldAlert, label: 'Admin' });
  }

  return (
    <div className="pb-[calc(1rem+var(--safe-bottom))]">
      <nav className="mx-auto w-[90%] max-w-[400px] glass-panel rounded-[32px] p-2 relative shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-3xl">
        {/* Dynamic Island inner glow */}
        <div className="absolute inset-0 rounded-[32px] shadow-[inset_0_1px_10px_rgba(255,255,255,0.1)] pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[64px] rounded-2xl transition-all duration-500 tap-target ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Active Indicator Blob */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabBg"
                    className="absolute inset-1 bg-gradient-to-b from-white/10 to-transparent rounded-2xl border-t border-white/20"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                
                <motion.div 
                  className="relative z-10 flex flex-col items-center"
                  animate={isActive ? { y: -2 } : { y: 2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : ''} 
                  />
                  <AnimatePresence mode="popLayout">
                    {isActive && (
                      <motion.span 
                        initial={{ opacity: 0, height: 0, scale: 0.8 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.8 }}
                        className="text-[11px] font-bold mt-1 tracking-wide"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
