import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../api/products.api';

// Every number shown here is fetched live from the backend — nothing is
// hardcoded. While loading, each stat shows a subtle skeleton instead of a
// placeholder number, so we never briefly display a fake value.
function countCategories(nodes = []) {
  return nodes.reduce((sum, node) => sum + 1 + countCategories(node.children || []), 0);
}

function useHeroStats() {
  const [productCount, setProductCount] = useState(null);
  const [categoryCount, setCategoryCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .list({ limit: 1 })
      .then(({ meta }) => {
        if (!cancelled) setProductCount(meta?.total ?? null);
      })
      .catch(() => {
        if (!cancelled) setProductCount(null);
      });
    categoriesApi
      .tree()
      .then((tree) => {
        if (!cancelled) setCategoryCount(countCategories(tree));
      })
      .catch(() => {
        if (!cancelled) setCategoryCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { productCount, categoryCount };
}

export default function HeroBanner() {
  const { productCount, categoryCount } = useHeroStats();

  const stats = [
    {
      label: 'Medicines in stock',
      value: productCount === null ? null : `${productCount.toLocaleString()}+`,
    },
    {
      label: 'Categories to browse',
      value: categoryCount === null ? null : `${categoryCount}+`,
    },
    { label: 'Prescription support', value: 'Daily, 10 AM–9 PM' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
      {/* Decorative blurred blobs — pure CSS, no imagery required */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
        <div
          className="animate-blob absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl"
          style={{ animationDelay: '2s' }}
        />
        <div className="animate-float-slow absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div className="animate-slide-up">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            <SparkleIcon />
            Genuine medicine, delivered
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Your trusted <span className="text-accent-300">online pharmacy</span> in Bangladesh
          </h1>
          <p className="mt-4 max-w-md text-base text-brand-50/90">
            Order medicine, upload your prescription, and get doorstep delivery — all from one place, all tracked
            live from the moment you check out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-accent px-6 py-3 text-sm">
              Order Medicine Online
              <ArrowIcon />
            </Link>
            <Link
              to="/upload-prescription"
              className="btn px-6 py-3 text-sm bg-white text-brand-700 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Upload Prescription
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {stats.map((s) => (
              <div key={s.label}>
                {s.value === null ? (
                  <span className="mb-1 block h-6 w-14 animate-pulse rounded bg-white/20 sm:h-7" />
                ) : (
                  <p className="font-display text-xl font-extrabold text-white sm:text-2xl">{s.value}</p>
                )}
                <p className="text-xs text-brand-100/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden animate-scale-in md:block" style={{ animationDelay: '150ms' }}>
          <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-4xl border border-white/15 bg-white/10 backdrop-blur">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/95 shadow-lift">
              <CapsuleIllustration />
            </div>
          </div>

          <div
            className="animate-float absolute -left-6 top-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-700 shadow-lift"
            style={{ animationDelay: '300ms' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <CheckIcon />
            </span>
            <span className="text-xs font-semibold">Verified pharmacist reviewed</span>
          </div>

          <div
            className="animate-float absolute -right-4 top-40 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-700 shadow-lift"
            style={{ animationDelay: '800ms' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <TruckIcon />
            </span>
            <span className="text-xs font-semibold">Doorstep delivery today</span>
          </div>

          <div
            className="animate-float absolute bottom-0 left-8 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-700 shadow-lift"
            style={{ animationDelay: '1200ms' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <StarIcon />
            </span>
            <span className="text-xs font-semibold">Secure, tracked checkout</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapsuleIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="hero-capsule" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <clipPath id="hero-capsule-clip">
          <rect x="4" y="13" width="32" height="14" rx="7" transform="rotate(-40 20 20)" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-capsule-clip)">
        <rect x="0" y="9" width="20" height="22" fill="url(#hero-capsule)" />
        <rect x="20" y="9" width="20" height="22" fill="#f97316" />
      </g>
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

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v9H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3l-5.8 3.2 1.1-6.5-4.8-4.6 6.6-.9L12 2.5Z" />
    </svg>
  );
}
