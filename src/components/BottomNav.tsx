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
    <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 z-50">
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
              className="tap-target flex-1 flex flex-col items-center justify-center gap-1 py-3 group outline-none"
              aria-label={tab.label}
              aria-pressed={isActive}
            >
              <div className={`relative transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105 group-active:scale-95'}`}>
                <Icon 
                  size={24} 
                  className={isActive ? 'text-[var(--tg-theme-button-color)]' : 'text-white/40'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <div className="absolute inset-0 blur-md bg-[var(--tg-theme-button-color)] opacity-40 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-colors ${isActive ? 'text-[var(--tg-theme-button-color)]' : 'text-white/40'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
