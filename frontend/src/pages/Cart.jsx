import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatBDT } from '../lib/format';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import ProductImagePlaceholder from '../components/product/ProductImagePlaceholder';

export default function Cart() {
  const { cart, loading, updateItem, removeItem, applyCoupon } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState(cart.couponCode || '');
  const [applying, setApplying] = useState(false);
  const [busyProductId, setBusyProductId] = useState(null);

  const handleQuantity = async (productId, quantity) => {
    setBusyProductId(productId);
    try {
      await updateItem(productId, quantity);
    } catch (err) {
      toast.error(err.message || 'Could not update item');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRemove = async (productId) => {
    setBusyProductId(productId);
    try {
      await removeItem(productId);
      toast.success('Item removed');
    } catch (err) {
      toast.error(err.message || 'Could not remove item');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const summary = await applyCoupon(couponInput.trim() || null);
      if (summary.couponError) toast.error(summary.couponError);
      else if (couponInput.trim()) toast.success('Coupon applied');
    } catch (err) {
      toast.error(err.message || 'Could not apply coupon');
    } finally {
      setApplying(false);
    }
  };

  if (loading && cart.items.length === 0) return <Loader label="Loading your bag…" />;

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Your bag is empty"
          description="Browse our catalogue and add medicines or health products to your bag."
          actionLabel="Start shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-800">My Bag ({cart.itemCount} items)</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {cart.hasUnavailableItem && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Some items in your bag are no longer available in the requested quantity — please review before checkout.
            </p>
          )}
          {cart.items.map((item) => (
            <div key={item.product} className="card flex gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <ProductImagePlaceholder seed={item.name || item.product} iconSize={26} />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/products/${item.product}`} className="font-medium text-slate-800 hover:text-brand-700">
                      {item.name}
                    </Link>
                    {item.prescriptionRequired && (
                      <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        Rx
                      </span>
                    )}
                    {!item.available && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Only {item.stockQuantity} left in stock
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.product)}
                    disabled={busyProductId === item.product}
                    className="text-xs font-medium text-slate-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-slate-300">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
                      disabled={busyProductId === item.product}
                      onClick={() => handleQuantity(item.product, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
                      disabled={busyProductId === item.product}
                      onClick={() => handleQuantity(item.product, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-brand-700">{formatBDT(item.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Order Summary</h2>

          <form onSubmit={handleApplyCoupon} className="mb-4 flex gap-2">
            <input
              type="text"
              className="input"
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <button type="submit" className="btn-outline whitespace-nowrap" disabled={applying}>
              {applying ? 'Applying…' : 'Apply'}
            </button>
          </form>
          {cart.couponError && <p className="mb-3 text-xs text-red-600">{cart.couponError}</p>}

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium">{formatBDT(cart.subtotal)}</dd>
            </div>
            {cart.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Coupon discount</dt>
                <dd>-{formatBDT(cart.couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery charge</dt>
              <dd className="font-medium">{cart.deliveryCharge === 0 ? 'Free' : formatBDT(cart.deliveryCharge)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatBDT(cart.total)}</dd>
            </div>
          </dl>

          {cart.requiresPrescription && (
            <p className="mt-3 rounded-md bg-brand-50 p-2 text-xs text-brand-800">
              One or more items require a prescription. You can upload it now or at checkout.
            </p>
          )}

          <button
            type="button"
            className="btn-primary mt-5 w-full"
            disabled={cart.hasUnavailableItem}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
