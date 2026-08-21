import React from 'react';
import { Link } from 'react-router-dom';

// Shared split-screen shell for Login / Register / OTP / Forgot-Password —
// a branded gradient panel (visually consistent with HeroBanner) on the
// left, and the actual form card on the right. Falls back to a single
// centered column on small screens.
export default function AuthLayout({ eyebrow, title, subtitle, panelPoints, children }) {
  return (
    <div className="relative flex min-h-[80vh] overflow-hidden bg-slate-50">
      {/* Branded panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-10 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent-500/25 blur-3xl" />
          <div
            className="animate-blob absolute -right-16 top-1/2 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl"
            style={{ animationDelay: '2s' }}
          />
          <div className="animate-float-slow absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2 text-lg font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <PillIcon />
          </span>
          <span className="font-display">ePharmacy</span>
        </Link>

        <div className="relative z-10 animate-slide-up">
          {eyebrow && (
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              <SparkleIcon />
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-3xl font-extrabold leading-tight">{title}</h2>
          {subtitle && <p className="mt-3 max-w-sm text-sm text-brand-50/90">{subtitle}</p>}

          {panelPoints && panelPoints.length > 0 && (
            <ul className="mt-8 space-y-3">
              {panelPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-brand-50/90">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15">
                    <CheckIcon />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="relative z-10 text-xs text-brand-100/70">
          &copy; {new Date().getFullYear()} ePharmacy. Genuine medicine, delivered.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:w-[56%] lg:px-14">
        <div className="w-full max-w-sm animate-scale-in">{children}</div>
      </div>
    </div>
  );
}

function PillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="9" width="20" height="8" rx="4" transform="rotate(-40 12 12)" fill="url(#auth-pill)" />
      <defs>
        <linearGradient id="auth-pill" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.7L19.5 9l-5.7 1.8L12 16.5l-1.8-5.7L4.5 9l5.7-1.3L12 2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
