import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-500">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
          <circle cx="19" cy="17" r="2" />
        </svg>
      </span>
      <h3 className="font-display text-lg font-bold text-slate-700">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
