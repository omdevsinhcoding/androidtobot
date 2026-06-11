import React from 'react';
import { Inbox, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'inbox' | 'history' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <div className="absolute bottom-[max(24px,var(--safe-bottom))] left-0 w-full px-6 z-50 pointer-events-none">
      <div className="glass-panel-light p-2 rounded-3xl flex justify-between items-center relative pointer-events-auto mx-auto max-w-[320px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="relative flex-1 flex flex-col items-center justify-center py-2.5 tap-target z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 bg-white/10 rounded-[20px] border border-white/5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={`mb-1 transition-colors z-20 ${isActive ? 'text-sky-400' : 'text-white/40'}`}
              />
              <span className={`text-[10px] font-bold z-20 transition-colors tracking-wide ${isActive ? 'text-sky-300' : 'text-white/30'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
