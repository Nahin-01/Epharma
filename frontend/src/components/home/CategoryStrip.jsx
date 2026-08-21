import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../../api/products.api';

const TILE_GRADIENTS = [
  'from-brand-500 to-brand-600',
  'from-accent-400 to-accent-500',
  'from-slate-600 to-slate-700',
  'from-brand-400 to-brand-500',
  'from-accent-500 to-accent-600',
  'from-brand-600 to-brand-800',
];

function CategorySkeleton() {
  return (
    <div className="card flex flex-col items-center gap-3 p-5">
      <div className="skeleton h-14 w-14 rounded-2xl" />
      <div className="skeleton h-3 w-16 rounded-full" />
    </div>
  );
}

export default function CategoryStrip() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .tree(true)
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="container-page mt-14">
      <h2 className="section-title mb-5">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
          : categories.slice(0, 12).map((cat, i) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="card card-hover animate-slide-up flex flex-col items-center gap-3 p-5 text-center"
                style={{ animationDelay: `${(i % 6) * 60}ms` }}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-soft ${
                    TILE_GRADIENTS[i % TILE_GRADIENTS.length]
                  }`}
                >
                  {cat.icon || '🏷️'}
                </span>
                <span className="line-clamp-2 text-xs font-semibold text-slate-700">{cat.name}</span>
              </Link>
            ))}
      </div>
    </section>
  );
}
