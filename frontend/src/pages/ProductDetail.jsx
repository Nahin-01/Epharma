import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import PriceTag from '../components/common/PriceTag';
import Loader from '../components/common/Loader';
import ProductGrid from '../components/product/ProductGrid';
import ProductImagePlaceholder from '../components/product/ProductImagePlaceholder';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveImage(0);
    setQuantity(1);
    productsApi
      .getBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        return productsApi.getRelated(data._id, 8).then((rel) => {
          if (!cancelled) setRelated(rel);
        });
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
  }, [slug]);

  if (loading) return <Loader label="Loading product…" />;
  if (error || !product) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-600">{error || 'Product not found.'}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => navigate('/products')}>
          Browse products
        </button>
      </div>
    );
  }

  const outOfStock = product.stockQuantity <= 0 || product.status !== 'ACTIVE';
  const images = product.images?.length ? product.images : [null];

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      toast.success(`${product.name} added to bag`);
    } catch (err) {
      toast.error(err.message || 'Could not add to bag');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-xs text-slate-400">
        <Link to="/products" className="hover:text-brand-700">
          Products
        </Link>
        {product.category?.name && (
          <>
            {' / '}
            <Link to={`/products?category=${product.category._id}`} className="hover:text-brand-700">
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-slate-500">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="card aspect-square overflow-hidden">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ProductImagePlaceholder seed={product.name || product._id} iconSize={72} />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={img || idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    idx === activeImage ? 'border-brand-600' : 'border-slate-200'
                  }`}
                >
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                      +
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.genericName && (
            <p className="text-sm uppercase tracking-wide text-slate-400">{product.genericName}</p>
          )}
          <h1 className="mt-1 text-2xl font-bold text-slate-800">{product.name}</h1>
          {product.manufacturer && <p className="mt-1 text-sm text-slate-500">By {product.manufacturer}</p>}

          <div className="mt-4">
            <PriceTag mrp={product.mrp} sellingPrice={product.sellingPrice} size="lg" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {product.prescriptionRequired && (
              <span className="rounded bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-800">
                Prescription required
              </span>
            )}
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                outOfStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {outOfStock ? 'Out of stock' : `In stock (${product.stockQuantity})`}
            </span>
            {product.dosageForm && (
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {product.dosageForm}
              </span>
            )}
          </div>

          {product.description && <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-slate-300">
              <button
                type="button"
                className="px-3 py-2 text-slate-600 disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                className="px-3 py-2 text-slate-600 disabled:opacity-40"
                disabled={quantity >= product.stockQuantity}
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
              >
                +
              </button>
            </div>
            <button type="button" className="btn-accent flex-1" disabled={outOfStock || adding} onClick={handleAdd}>
              {outOfStock ? 'Unavailable' : adding ? 'Adding…' : 'Add to Bag'}
            </button>
          </div>

          {product.prescriptionRequired && (
            <p className="mt-3 text-xs text-slate-500">
              This item requires a valid prescription. You'll be asked to upload or select one at checkout.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Related Products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
