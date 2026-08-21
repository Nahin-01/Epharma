import React, { useState } from 'react';

// Icon-prefixed text input, shared across the auth pages for a consistent,
// premium field look (icon in a soft rounded well, focus ring, error state).
export function IconField({ id, label, icon, error, className = '', ...inputProps }) {
  const errorClasses = '!border-red-300 focus:!border-red-400';
  const inputClassName = error ? `input pl-11 ${errorClasses}` : 'input pl-11';
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
          {icon}
        </span>
        <input id={id} className={inputClassName} {...inputProps} />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// Password input with a mask/reveal toggle.
export function PasswordField({ id, label, icon, error, className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const errorClasses = '!border-red-300 focus:!border-red-400';
  const inputClassName = error ? `input pl-11 pr-11 ${errorClasses}` : 'input pl-11 pr-11';
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
          {icon}
        </span>
        <input id={id} type={visible ? 'text' : 'password'} className={inputClassName} {...inputProps} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-brand-600"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.8 21 3 13.2 3 3.6c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3 7 21M17 3l-2 18M4 9h17M3 15h17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M6.2 6.6C4 8.1 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1.1M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7-.5.9-1.2 1.9-2.1 2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
