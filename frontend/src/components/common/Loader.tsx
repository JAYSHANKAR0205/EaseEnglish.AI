import React from 'react';

interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading...', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`${sizeMap[size]} border-emerald-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label={label}
      />
      {label && <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>}
    </div>
  );
};
