import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api/products.api';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/common/Pagination';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'best_selling', label: 'Best Selling' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState(null);

  const query = useMemo(() => {
    const params = {};
    for (const [key, value] of searchParams.entries()) params[key] = value;
    if (!params.page) params.page = '1';
    return params;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    productsApi
      .list(query)
      .then(({ data, meta: m }) => {
        if (cancelled) return;
        setProducts(data);
        setMeta(m);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (!categoryId) {
      setCategoryName(null);
      return;
    }
    let cancelled = false;
    categoriesApi
      .getById(categoryId)
      .then((cat) => {
        if (!cancelled) setCategoryName(cat.name);
      })
      .catch(() => {
        if (!cancelled) setCategoryName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '' || value === null) next.delete(key);
    else next.set(key, value);
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const search = searchParams.get('search');
  const heading = search ? `Search results for "${search}"` : categoryName || 'All Products';

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">{heading}</h1>
          {meta && <p className="text-sm text-slate-500">{meta.total} products found</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-500" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            className="input w-auto"
            value={searchParams.get('sort') || 'relevance'}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="ml-2 flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={searchParams.get('prescriptionRequired') === 'false'}
              onChange={(e) => updateParam('prescriptionRequired', e.target.checked ? 'false' : undefined)}
            />
            No prescription needed
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={searchParams.get('inStock') === 'true'}
              onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : undefined)}
            />
            In stock only
          </label>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <ProductGrid products={products} loading={loading} />
      <Pagination meta={meta} onPageChange={goToPage} />
    </div>
  );
}
