import React from 'react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, hasPrevPage, hasNextPage } = meta;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p += 1) pages.push(p);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        className="btn-outline px-3 py-1.5 text-xs"
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={
            'h-8 w-8 rounded-md text-xs font-semibold ' +
            (p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100')
          }
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="btn-outline px-3 py-1.5 text-xs"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
