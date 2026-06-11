import React from 'react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="mesh-bg-app text-white h-[100dvh] w-full flex flex-col font-sans antialiased overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      {children}
    </div>
  );
};
