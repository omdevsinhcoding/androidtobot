import React from 'react';
import { Home, Clock, User, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="px-4 pb-[calc(1rem+var(--safe-bottom))] pt-2">
      <nav className="glass-panel rounded-full overflow-hidden relative">
        <div className="flex items-center justify-between px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-full transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
                  <span className={`text-[10px] font-medium mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
