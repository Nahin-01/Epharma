import React from 'react';
import { useToast } from '../../context/ToastContext';

export default function DoctorBanner() {
  const toast = useToast();
  return (
    <section className="container-page mt-14">
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-white shadow-lift sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex">
              <StethoscopeIcon />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl">
                Doctor consultation, video/audio, 24 hours
              </h3>
              <p className="mt-1 text-sm text-white/90">
                Schedule an appointment with a verified doctor. Get 10% off with promo code{' '}
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono font-semibold">EPDT10</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn whitespace-nowrap bg-white text-accent-700 hover:-translate-y-0.5 hover:shadow-lift"
            onClick={() => toast.info('Doctor appointment booking is coming soon.')}
          >
            Schedule appointment
          </button>
        </div>
      </div>
    </section>
  );
}

function StethoscopeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v4a4 4 0 0 0 8 0V3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5H6a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="16" r="3" />
      <path d="M18 3v2" strokeLinecap="round" />
    </svg>
  );
}
