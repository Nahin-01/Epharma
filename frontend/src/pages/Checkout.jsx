import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { customersApi } from '../api/customers.api';
import { prescriptionsApi } from '../api/prescriptions.api';
import { deliveryApi, ordersApi } from '../api/orders.api';
import { formatBDT } from '../lib/format';
import { DISTRICTS, PAYMENT_METHODS } from '../lib/constants';
import Loader from '../components/common/Loader';

const emptyAddress = {
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  district: '',
  area: '',
  thana: '',
  postCode: '',
};

export default function Checkout() {
  const { cart, initialized: cartInitialized, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [deliveryType, setDeliveryType] = useState('STANDARD');
  const [deliveryCharge, setDeliveryCharge] = useState(cart.deliveryCharge);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [recurring, setRecurring] = useState(false);

  const [acceptedPrescriptions, setAcceptedPrescriptions] = useState([]);
  const [prescriptionId, setPrescriptionId] = useState('');

  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    // Wait for the cart's first real fetch to resolve before deciding it's
    // empty — otherwise a fresh page load (e.g. a direct link or refresh)
    // races the initial GET /cart and bounces the user back to /cart before
    // their actual items have loaded.
    if (cartInitialized && cart.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartInitialized, cart.items.length, navigate]);

  useEffect(() => {
    let cancelled = false;
    customersApi
      .listAddresses()
      .then((list) => {
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setAddressId(def._id);
        else setUseNewAddress(true);
      })
      .catch(() => setUseNewAddress(true))
      .finally(() => {
        if (!cancelled) setLoadingAddresses(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cart.requiresPrescription) return;
    let cancelled = false;
    prescriptionsApi
      .listMine({ status: 'ACCEPTED', limit: 20 })
      .then(({ data }) => {
        if (!cancelled) setAcceptedPrescriptions(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cart.requiresPrescription]);

  const selectedAddress = useNewAddress ? newAddress : addresses.find((a) => a._id === addressId);

  useEffect(() => {
    const district = selectedAddress?.district;
    const area = selectedAddress?.area;
    if (!district) return;
    let cancelled = false;
    deliveryApi
      .resolveCharge(district, area)
      .then(({ charge }) => {
        if (!cancelled) setDeliveryCharge(deliveryType === 'EXPRESS' ? charge * 2 : charge);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress?.district, selectedAddress?.area, deliveryType]);

  const estimatedTotal =
    cart.subtotal - cart.couponDiscount + (cart.subtotal >= 1000 && deliveryType === 'STANDARD' ? 0 : deliveryCharge);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (cart.requiresPrescription && !prescriptionId) {
      setFormError('This order needs a reviewed prescription. Please select one below.');
      return;
    }

    const payload = {
      deliveryType,
      notes,
      couponCode: cart.couponCode || undefined,
      paymentMethod,
      recurring,
    };

    if (useNewAddress) {
      payload.address = {
        name: newAddress.name,
        phone: newAddress.phone,
        line1: newAddress.line1,
        line2: newAddress.line2,
        district: newAddress.district,
        area: newAddress.area,
        thana: newAddress.thana,
        postCode: newAddress.postCode,
      };
    } else {
      payload.addressId = addressId;
    }

    if (prescriptionId) payload.prescriptionId = prescriptionId;

    setSubmitting(true);
    try {
      const result = await ordersApi.checkout(payload);
      await refresh();
      toast.success('Order placed successfully!');
      navigate(`/orders/${result.order._id}`, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Could not place your order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAddresses || !cartInitialized) return <Loader label="Loading checkout…" />;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-800">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Delivery Address</h2>
            {addresses.length > 0 && (
              <div className="mb-3 space-y-2">
                {addresses.map((addr) => (
                  <label key={addr._id} className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm">
                    <input
                      type="radio"
                      name="address"
                      checked={!useNewAddress && addressId === addr._id}
                      onChange={() => {
                        setUseNewAddress(false);
                        setAddressId(addr._id);
                      }}
                    />
                    <span>
                      <strong>{addr.label || 'Address'}</strong> — {addr.name}, {addr.phone}
                      <br />
                      {addr.line1}, {addr.area ? `${addr.area}, ` : ''}
                      {addr.district}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={useNewAddress} onChange={(e) => setUseNewAddress(e.target.checked)} />
              Use a new address
            </label>

            {useNewAddress && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Full name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  required
                />
                <input
                  className="input"
                  placeholder="Phone (e.g. 01712345678)"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  required
                />
                <input
                  className="input sm:col-span-2"
                  placeholder="Address line"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                  required
                />
                <select
                  className="input"
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  required
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Area (optional)"
                  value={newAddress.area}
                  onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                />
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Delivery Type</h2>
            <div className="flex gap-3">
              {['STANDARD', 'EXPRESS'].map((type) => (
                <label
                  key={type}
                  className={`flex-1 cursor-pointer rounded-md border p-3 text-sm ${
                    deliveryType === type ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    className="sr-only"
                    checked={deliveryType === type}
                    onChange={() => setDeliveryType(type)}
                  />
                  <span className="font-medium">{type === 'STANDARD' ? 'Standard' : 'Express'}</span>
                </label>
              ))}
            </div>
          </section>

          {cart.requiresPrescription && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-800">Prescription</h2>
              {acceptedPrescriptions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No accepted prescriptions found yet.{' '}
                  <a href="/upload-prescription" className="font-semibold text-brand-700">
                    Upload one
                  </a>{' '}
                  and wait for pharmacist review before checkout.
                </p>
              ) : (
                <div className="space-y-2">
                  {acceptedPrescriptions.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm">
                      <input
                        type="radio"
                        name="prescription"
                        checked={prescriptionId === p._id}
                        onChange={() => setPrescriptionId(p._id)}
                      />
                      Prescription #{p._id.slice(-6).toUpperCase()} — {p.files?.length || 0} file(s)
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Payment Method</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`cursor-pointer rounded-md border p-3 text-center text-sm font-medium ${
                    paymentMethod === m.value ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <label className="label" htmlFor="notes">
              Order notes (optional)
            </label>
            <textarea
              id="notes"
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions, landmark, etc."
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
              Set this up as a recurring order (monthly refill reminders)
            </label>
          </section>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Order Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatBDT(cart.subtotal)}</dd>
            </div>
            {cart.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Coupon discount</dt>
                <dd>-{formatBDT(cart.couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery charge</dt>
              <dd>{formatBDT(deliveryCharge)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatBDT(Math.max(0, estimatedTotal))}</dd>
            </div>
          </dl>

          {formError && <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{formError}</p>}

          <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
