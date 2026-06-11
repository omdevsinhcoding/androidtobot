import React from 'react';
import { Home, Clock, User, ShieldAlert } from 'lucide-react';

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
    <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 z-50 bg-black/80">
      {/* Container respects safe area insets */}
      <div 
        className="flex items-center justify-around px-2"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tap-target flex-1 flex flex-col items-center justify-center gap-1.5 py-3 group outline-none"
              aria-label={tab.label}
              aria-pressed={isActive}
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                {isActive && (
                  <div className="absolute inset-0 bg-[var(--tg-theme-button-color)] opacity-20 rounded-full scale-125 transition-transform duration-300" />
                )}
                <Icon 
                  size={22} 
                  className={`transition-all duration-300 ${isActive ? 'text-[var(--tg-theme-button-color)] scale-110' : 'text-white/40 scale-100 group-hover:text-white/70'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-[var(--tg-theme-button-color)]' : 'text-white/40 group-hover:text-white/70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
