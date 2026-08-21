import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import CategoryMegaMenu from './CategoryMegaMenu';
import LogoMark from '../common/LogoMark';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../lib/format';
import { isStaff } from '../../lib/permissions';

export default function Header() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <div className="border-b border-slate-100 bg-white/90 shadow-sm backdrop-blur">
        <div className="container-page flex h-[4.5rem] items-center gap-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <LogoMark size={38} className="transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-800">
              e<span className="gradient-text">Pharmacy</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicine, brand, or health product…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-28 text-sm transition-all focus:border-brand-400 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-lift"
              >
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {isStaff(user) && (
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:flex"
              >
                <ShieldIcon />
                Admin
              </Link>
            )}
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700 sm:flex"
            >
              <UserIcon />
              {isAuthenticated ? 'Account' : 'Sign in'}
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-50 to-brand-100 px-4 py-2.5 transition-all hover:shadow-soft"
            >
              <BagIcon />
              <span className="hidden text-sm font-bold text-brand-800 sm:inline">{formatBDT(cart.total)}</span>
              {cart.itemCount > 0 && (
                <span className="animate-scale-in absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-[11px] font-bold text-white shadow-soft">
                  {cart.itemCount > 99 ? '99+' : cart.itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="container-page flex gap-2 pb-3 md:hidden">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicine…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Go
          </button>
        </form>
      </div>
      <CategoryMegaMenu />
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-700">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
