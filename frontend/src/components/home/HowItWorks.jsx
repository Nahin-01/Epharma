import React from 'react';
import Reveal from '../common/Reveal';

const STEPS = [
  {
    Icon: SearchIcon,
    title: 'Search or upload',
    description: 'Find your medicine in the catalogue, or upload a photo of your prescription in seconds.',
  },
  {
    Icon: ReviewIcon,
    title: 'Pharmacist reviews it',
    description: 'A licensed pharmacist checks every prescription before it ships — never an automated rubber stamp.',
  },
  {
    Icon: DoorIcon,
    title: 'Delivered to your door',
    description: 'Track your order live, pay however suits you, and get it delivered the same day in Dhaka.',
  },
];

export default function HowItWorks() {
  return (
    <section className="container-page mt-16">
      <Reveal className="text-center">
        <h2 className="section-title">How ePharmacy works</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Three simple steps between you and your medicine — no queues, no guesswork.
        </p>
      </Reveal>

      <div className="relative mt-10 grid gap-8 sm:grid-cols-3">
        <div className="absolute left-0 right-0 top-8 hidden border-t-2 border-dashed border-brand-100 sm:block" />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 120} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 shadow-lift ring-4 ring-brand-50">
              <step.Icon />
            </span>
            <span className="badge-brand mt-4">Step {i + 1}</span>
            <h3 className="mt-2 font-display font-bold text-slate-800">{step.title}</h3>
            <p className="mt-1.5 max-w-[15rem] text-sm text-slate-500">{step.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12.5 11 14.5 15.5 10" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="17" rx="2.5" />
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v9H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}
