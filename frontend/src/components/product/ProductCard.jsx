import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PriceTag from '../common/PriceTag';
import ProductImagePlaceholder from './ProductImagePlaceholder';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const image = product.images?.[0];
  const outOfStock = product.stockQuantity <= 0 || product.status !== 'ACTIVE';

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');
      return;
    }
    setAdding(true);
    try {
      await addItem(product._id, 1);
      toast.success(`${product.name} added to bag`);
    } catch (err) {
      toast.error(err.message || 'Could not add to bag');
    } finally {
      setAdding(false);
    }
  };

  const discountPct =
    product.mrp > product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;

  return (
    <Link to={`/products/${product.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductImagePlaceholder
            seed={product.name || product._id}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discountPct > 0 && <span className="badge-accent shadow-soft">{discountPct}% off</span>}
          {product.prescriptionRequired && <span className="badge bg-brand-700/95 text-white shadow-soft">Rx required</span>}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <span className="badge bg-white text-slate-700">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.genericName && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {product.genericName}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">{product.name}</h3>
        <PriceTag mrp={product.mrp} sellingPrice={product.sellingPrice} />
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || adding}
          className="btn-accent mt-2 w-full rounded-full py-2 text-xs"
        >
          {outOfStock ? 'Unavailable' : adding ? 'Adding…' : '+ Add to Bag'}
        </button>
      </div>
    </Link>
  );
}
