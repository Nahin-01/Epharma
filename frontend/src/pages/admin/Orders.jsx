import React, { useEffect, useState } from 'react';
import { ordersApi } from '../../api/orders.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, StatusPill, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatBDT, formatDateTime } from '../../lib/format';
import { ORDER_STATUS_TRANSITIONS } from '../../lib/constants';

const STATUS_FILTERS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);

  const load = () => {
    setLoading(true);
    ordersApi
      .listAll({ status: status || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => {
        setOrders(data);
        setMeta(m);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const handleUpdated = (updated) => {
    setOrders((list) => list.map((o) => (o._id === updated._id ? updated : o)));
    setActive(updated);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Every order placed on the storefront and app, live from the backend."
        action={
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace(/_/g, ' ') : 'All statuses'}
              </option>
            ))}
          </Select>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading orders…" />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders found" description="Try a different status filter." />
        ) : (
          <Table columns={['Order', 'Customer', 'Items', 'Total', 'Status', 'Placed', '']}>
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800">{o.orderNumber}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-700">{o.customer?.name || '—'}</p>
                  <p className="text-xs text-slate-400">{o.customer?.phone || o.customer?.email}</p>
                </td>
                <td className="px-5 py-3 text-slate-500">{o.items?.length ?? 0}</td>
                <td className="px-5 py-3 font-semibold text-slate-800">{formatBDT(o.total)}</td>
                <td className="px-5 py-3">
                  <StatusPill status={o.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => setActive(o)} className="btn-ghost px-3 py-1.5 text-xs">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        <div className="px-5 pb-5">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </Card>

      <OrderDetailModal order={active} onClose={() => setActive(null)} onUpdated={handleUpdated} toast={toast} />
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdated, toast }) {
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNextStatus('');
    setNote('');
  }, [order?._id]);

  if (!order) return null;
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];

  const handleUpdate = async () => {
    if (!nextStatus) return;
    setSaving(true);
    try {
      const updated = await ordersApi.updateStatus(order._id, nextStatus, note);
      toast.success(`Order moved to ${nextStatus.replace(/_/g, ' ')}`);
      onUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Could not update order status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(order)} onClose={onClose} title={`Order ${order.orderNumber}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill status={order.status} />
          <span className="text-xs text-slate-400">Placed {formatDateTime(order.createdAt)}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Customer</p>
            <p className="text-sm font-semibold text-slate-800">{order.customer?.name}</p>
            <p className="text-xs text-slate-500">{order.customer?.email}</p>
            <p className="text-xs text-slate-500">{order.customer?.phone}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Delivery address</p>
            <p className="text-sm text-slate-700">{order.address?.line1}, {order.address?.area}</p>
            <p className="text-xs text-slate-500">{order.address?.district} · {order.deliveryType}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
            {order.items?.map((it) => (
              <div key={it.product} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-700">
                  {it.name} <span className="text-slate-400">× {it.quantity}</span>
                </span>
                <span className="font-semibold text-slate-800">{formatBDT(it.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>{formatBDT(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {allowed.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Update status</p>
            <div className="flex flex-wrap gap-2">
              {allowed.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNextStatus(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    nextStatus === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {nextStatus && (
              <div className="mt-3">
                <Field label="Note (optional)">
                  <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible in the order's status history" />
                </Field>
                <button type="button" onClick={handleUpdate} disabled={saving} className="btn-primary mt-3 w-full">
                  {saving ? 'Updating…' : `Move to ${nextStatus.replace(/_/g, ' ')}`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">This order is in a final state and can&rsquo;t move further.</p>
        )}
      </div>
    </Modal>
  );
}
