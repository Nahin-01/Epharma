import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersApi, paymentsApi } from '../api/orders.api';
import { formatBDT, formatDateTime } from '../lib/format';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../lib/constants';
import { apiClient } from '../lib/apiClient';
import Loader from '../components/common/Loader';
import { useToast } from '../context/ToastContext';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'];

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [completingPayment, setCompletingPayment] = useState(false);

  const load = () => {
    setLoading(true);
    ordersApi
      .getById(id)
      .then((data) => {
        setOrder(data);
        return paymentsApi.getByOrder(id).catch(() => null);
      })
      .then((p) => setPayment(p))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await ordersApi.cancel(id, 'Cancelled by customer');
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleCompleteMockPayment = async () => {
    if (!payment) return;
    setCompletingPayment(true);
    try {
      const origin = new URL(apiClient.defaults.baseURL).origin;
      const redirectUrl = payment.gatewayResponse?.redirectUrl;
      const url = redirectUrl
        ? redirectUrl.startsWith('http')
          ? redirectUrl
          : `${origin}${redirectUrl}`
        : `${origin}/api/v1/payments/mock/${payment.transactionId}/complete`;
      await fetch(url);
      toast.success('Payment marked as completed (mock gateway)');
      load();
    } catch (err) {
      toast.error('Could not complete mock payment');
    } finally {
      setCompletingPayment(false);
    }
  };

  if (loading) return <Loader label="Loading order…" />;
  if (error || !order) {
    return <div className="container-page py-16 text-center text-slate-600">{error || 'Order not found.'}</div>;
  }

  return (
    <div className="container-page py-8">
      <Link to="/orders" className="mb-4 inline-block text-sm text-brand-700 hover:underline">
        ← Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Order #{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Placed {formatDateTime(order.placedAt || order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100'}`}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Items</h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.product?._id || item.product} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} × {formatBDT(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold">{formatBDT(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Delivery Address</h2>
            <p className="text-sm text-slate-600">
              {order.address.name} — {order.address.phone}
              <br />
              {order.address.line1}, {order.address.area ? `${order.address.area}, ` : ''}
              {order.address.district}
            </p>
          </section>

          {order.statusHistory?.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-800">Status History</h2>
              <ol className="space-y-2 text-sm">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="flex items-center justify-between text-slate-600">
                    <span>{ORDER_STATUS_LABELS[h.status] || h.status}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Payment</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Method</dt>
                <dd>{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold">{order.paymentStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd>{formatBDT(order.subtotal)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd>-{formatBDT(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery</dt>
                <dd>{formatBDT(order.deliveryCharge)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <dt>Total</dt>
                <dd className="text-brand-700">{formatBDT(order.total)}</dd>
              </div>
            </dl>

            {payment && payment.method !== 'COD' && payment.status === 'PROCESSING' && (
              <button
                type="button"
                className="btn-accent mt-4 w-full"
                onClick={handleCompleteMockPayment}
                disabled={completingPayment}
              >
                {completingPayment ? 'Completing…' : 'Complete payment (mock gateway)'}
              </button>
            )}
          </section>

          {CANCELLABLE_STATUSES.includes(order.status) && (
            <button type="button" className="btn-outline w-full text-red-600" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
