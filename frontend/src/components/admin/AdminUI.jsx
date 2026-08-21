import React, { useEffect } from 'react';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PRESCRIPTION_STATUS_COLORS, PRESCRIPTION_STATUS_LABELS } from '../../lib/constants';

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'brand', icon }) {
  const tones = {
    brand: 'from-brand-500 to-brand-600',
    accent: 'from-accent-500 to-accent-600',
    slate: 'from-slate-600 to-slate-700',
    red: 'from-red-500 to-red-600',
  };
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-slate-900">{value === null || value === undefined ? '—' : value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          {title && <h2 className="font-display text-sm font-bold text-slate-800 sm:text-base">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-5 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

// Extra tones for resources that don't have a dedicated constants map
// (payments, inventory batches) — orders/prescriptions use the shared maps
// in lib/constants.js so their colors/labels stay in exactly one place.
const EXTRA_TONES = {
  PAID: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-red-100 text-red-800',
  DEPLETED: 'bg-slate-200 text-slate-700',
  RECALLED: 'bg-red-100 text-red-800',
};
const EXTRA_LABELS = {
  DEPLETED: 'Depleted',
  RECALLED: 'Recalled',
};

export function StatusPill({ status }) {
  const tone = ORDER_STATUS_COLORS[status] || PRESCRIPTION_STATUS_COLORS[status] || EXTRA_TONES[status] || 'bg-slate-200 text-slate-700';
  const label =
    ORDER_STATUS_LABELS[status] || PRESCRIPTION_STATUS_LABELS[status] || EXTRA_LABELS[status] || (status || '').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative max-h-[88vh] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} animate-scale-in overflow-y-auto rounded-3xl bg-white shadow-lift`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, error, hint, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Select({ className = '', ...props }) {
  return <select className={`input ${className}`} {...props} />;
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
