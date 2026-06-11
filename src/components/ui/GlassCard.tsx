import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'active';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', variant = 'default', ...props }) => {
  const variantClass = 
    variant === 'light' ? 'glass-panel-light' : 
    variant === 'active' ? 'glass-panel-active' : 
    'glass-panel';

  return (
    <div className={`${variantClass} rounded-[28px] p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};
