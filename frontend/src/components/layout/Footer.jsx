import React from 'react';
import { Link } from 'react-router-dom';
import LogoMark from '../common/LogoMark';

const PAYMENT_METHODS = ['COD', 'bKash', 'Nagad', 'Rocket', 'Card'];

const SOCIALS = [
  { label: 'Facebook', d: 'M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1Z' },
  { label: 'Instagram', d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.2-1.7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  { label: 'Twitter', d: 'M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2c-.8.5-1.6.8-2.6 1a4 4 0 0 0-6.8 3.6A11.4 11.4 0 0 1 3.9 4.9a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5v.1a4 4 0 0 0 3.2 3.9c-.6.1-1.2.2-1.8.1a4 4 0 0 0 3.7 2.7A8 8 0 0 1 2 18.6a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.3-6.1 11.3-11.3v-.5c.8-.6 1.4-1.3 1.9-2.1Z' },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      <div className="container-page grid grid-cols-2 gap-10 py-14 text-sm sm:grid-cols-2 md:grid-cols-5">
        <div className="col-span-2 pr-4 md:col-span-2">
          <Link to="/" className="mb-4 flex items-center gap-2.5">
            <LogoMark size={36} />
            <span className="font-display text-lg font-extrabold text-white">
              e<span className="text-accent-400">Pharmacy</span>
            </span>
          </Link>
          <p className="max-w-xs text-slate-400">
            Genuine medicine, delivered to your door. Upload a prescription or search the catalogue — either way,
            everything you see is live from our pharmacy backend.
          </p>
          <div className="mt-5 flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                onClick={(e) => e.preventDefault()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-brand-500 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold text-white">Quick Links</h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/products" className="transition-colors hover:text-accent-400">
                How to Order
              </Link>
            </li>
            <li>
              <Link to="/upload-prescription" className="transition-colors hover:text-accent-400">
                Upload Prescription
              </Link>
            </li>
            <li>
              <Link to="/orders" className="transition-colors hover:text-accent-400">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/account" className="transition-colors hover:text-accent-400">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold text-white">Featured</h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/products?sort=best_selling" className="transition-colors hover:text-accent-400">
                Best Sellers
              </Link>
            </li>
            <li>
              <Link to="/products?isFeatured=true" className="transition-colors hover:text-accent-400">
                Featured Products
              </Link>
            </li>
            <li>
              <Link to="/products" className="transition-colors hover:text-accent-400">
                All Medicines
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold text-white">Contact</h4>
          <ul className="space-y-2.5 text-slate-400">
            <li>Hotline: 16000</li>
            <li>support@epharmacy.example</li>
            <li>Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} ePharmacy. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-slate-500">We accept</span>
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
