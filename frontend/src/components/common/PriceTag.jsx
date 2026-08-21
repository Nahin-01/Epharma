import React from 'react';
import { discountPercent, formatBDT } from '../../lib/format';

export default function PriceTag({ mrp, sellingPrice, size = 'md' }) {
  const pct = discountPercent(mrp, sellingPrice);
  const priceClass = size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-display font-extrabold text-brand-700 ${priceClass}`}>{formatBDT(sellingPrice)}</span>
      {pct > 0 && (
        <>
          <span className="text-sm text-slate-400 line-through">{formatBDT(mrp)}</span>
          <span className="badge-accent">{pct}% off</span>
        </>
      )}
    </div>
  );
}
