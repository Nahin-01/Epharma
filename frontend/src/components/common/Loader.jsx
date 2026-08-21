import React from 'react';

export default function Loader({ label = 'Loading…', size = 'md' }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span
        className={`${dim} animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
