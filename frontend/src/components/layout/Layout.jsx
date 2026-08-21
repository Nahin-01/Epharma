import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const location = useLocation();

  // The admin dashboard (AdminLayout) is a self-contained shell with its own
  // sidebar/header — the storefront chrome would just duplicate navigation,
  // so skip it there instead of nesting two headers.
  if (location.pathname.startsWith('/admin')) {
    return <div key={location.pathname}>{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {/* Keying on the path re-triggers the entrance animation on every
            route change, giving each page a soft fade/slide-in instead of
            snapping into view. */}
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
