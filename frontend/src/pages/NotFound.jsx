import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
