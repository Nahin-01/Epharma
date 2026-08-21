import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../../api/products.api';

// Category list (and every subcategory inside the dropdown) is fetched live
// from GET /categories/tree — nothing here is a hardcoded menu.
export default function CategoryMegaMenu() {
  const [tree, setTree] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .tree(true)
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="border-b border-slate-100 bg-white">
        <div className="container-page flex h-11 items-center gap-6 text-sm text-slate-400">Loading categories…</div>
      </div>
    );
  }

  if (error || tree.length === 0) {
    // Don't show a broken empty bar — but don't hide navigation entirely,
    // since the rest of the storefront should still work.
    return null;
  }

  return (
    <nav className="relative border-b border-slate-100 bg-white" onMouseLeave={() => setOpenId(null)}>
      <div className="container-page flex h-11 items-center gap-1 overflow-x-auto text-sm font-medium text-slate-600">
        {tree.map((cat) => (
          <div key={cat._id} className="relative h-full" onMouseEnter={() => setOpenId(cat._id)}>
            <Link
              to={`/products?category=${cat._id}`}
              className={`flex h-full items-center whitespace-nowrap rounded-full px-3 transition-colors ${
                openId === cat._id ? 'text-brand-700' : 'hover:text-brand-700'
              }`}
            >
              {cat.name}
            </Link>
            {openId === cat._id && cat.children?.length > 0 && (
              <div className="animate-scale-in absolute left-0 top-[calc(100%-4px)] z-40 min-w-[220px] origin-top-left rounded-2xl border border-slate-100 bg-white py-2 shadow-lift">
                {cat.children.map((child) => (
                  <Link
                    key={child._id}
                    to={`/products?category=${child._id}`}
                    className="block px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
