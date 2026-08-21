import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const cards = [
  {
    key: 'refill',
    Icon: RefillIcon,
    gradient: 'from-brand-500 to-brand-600',
    title: 'Refill Request',
    description: 'Need to reorder the same medicine you bought before? Do it in one click.',
    to: '/orders',
    cta: 'View my orders',
  },
  {
    key: 'upload',
    Icon: UploadIcon,
    gradient: 'from-accent-500 to-accent-600',
    title: 'Upload Prescription',
    description: 'Upload your prescription and get the medicine delivered right at your door step.',
    to: '/upload-prescription',
    cta: 'Upload now',
  },
  {
    key: 'doctor',
    Icon: DoctorIcon,
    gradient: 'from-slate-700 to-slate-800',
    title: 'Doctor Consultation',
    description: 'Video/audio consultation, 24 hours. Doctor booking is launching soon.',
    to: null,
    cta: 'Notify me',
  },
];

export default function ActionCards() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  return (
    <section className="container-page relative -mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className="card card-hover animate-slide-up flex flex-col gap-3 p-6"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-soft`}
          >
            <card.Icon />
          </span>
          <h3 className="font-display font-bold text-slate-800">{card.title}</h3>
          <p className="flex-1 text-sm leading-relaxed text-slate-500">{card.description}</p>
          {card.to ? (
            <Link
              to={card.to === '/orders' && !isAuthenticated ? '/login' : card.to}
              className="group mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700"
            >
              {card.cta}
              <ArrowIcon />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => toast.info('Doctor consultation booking is coming soon.')}
              className="group mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700"
            >
              {card.cta}
              <ArrowIcon />
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="transition-transform group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v4a4 4 0 0 0 8 0V3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5H6a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="16" r="3" />
      <path d="M18 3v2" strokeLinecap="round" />
    </svg>
  );
}
