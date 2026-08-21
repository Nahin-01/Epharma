import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products.api';
import ProductGrid from '../product/ProductGrid';

// Each rail independently fetches its own slice of live products from the
// backend (e.g. isBestSeller=true, isFeatured=true) — nothing is stubbed.
export default function ProductRail({ title, params, viewAllHref, limit = 8 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsApi
      .list({ limit, ...params })
      .then(({ data }) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), limit]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="container-page mt-14">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="group inline-flex items-center gap-1 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100"
          >
            View all
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>
      <ProductGrid products={products} loading={loading} />
    </section>
  );
}
