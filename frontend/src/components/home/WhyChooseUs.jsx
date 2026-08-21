import React from 'react';
import Reveal from '../common/Reveal';

const FEATURES = [
  {
    Icon: ShieldIcon,
    gradient: 'from-brand-500 to-brand-600',
    title: '100% Genuine Medicine',
    description: 'Sourced directly from licensed manufacturers and distributors — every batch is traceable.',
  },
  {
    Icon: TruckIcon,
    gradient: 'from-accent-500 to-accent-600',
    title: 'Fast, Tracked Delivery',
    description: 'Same-day delivery across Dhaka, with live order tracking from pack to doorstep.',
  },
  {
    Icon: UserCheckIcon,
    gradient: 'from-slate-700 to-slate-800',
    title: 'Licensed Pharmacists',
    description: 'Every prescription is reviewed by a registered pharmacist before it ships — no exceptions.',
  },
  {
    Icon: LockIcon,
    gradient: 'from-brand-400 to-brand-500',
    title: 'Secure Payments',
    description: 'Pay by cash on delivery, bKash, Nagad, Rocket, or card — all handled through encrypted checkout.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="container-page mt-16">
      <Reveal className="text-center">
        <h2 className="section-title">Why choose ePharmacy</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Everything about how we operate is built around one thing: getting you the right medicine, safely.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <div className="card card-hover flex h-full flex-col gap-3 p-6">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-white shadow-soft`}
              >
                <f.Icon />
              </span>
              <h3 className="font-display font-bold text-slate-800">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v9H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}
function UserCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6" strokeLinecap="round" />
      <path d="m15 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}
