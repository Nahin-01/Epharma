import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="hidden bg-gradient-to-r from-brand-900 to-brand-700 text-xs text-brand-50 sm:block">
      <div className="container-page flex h-9 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClockIcon />
          <span>Daily delivery, 10 AM – 9 PM</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/orders" className="transition-colors hover:text-white">
            My Orders
          </Link>
          <Link to="/prescriptions" className="transition-colors hover:text-white">
            My Prescriptions
          </Link>
          {isAuthenticated ? (
            <>
              <span className="text-brand-200">Hi, {user?.name || 'there'}</span>
              <button type="button" onClick={logout} className="transition-colors hover:text-white">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="transition-colors hover:text-white">
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white transition-colors hover:bg-white/25"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
