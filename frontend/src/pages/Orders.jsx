import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { formatBDT, formatDateTime } from '../lib/format';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../lib/constants';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ordersApi
      .listMine({ page, limit: 10 })
      .then(({ data, meta: m }) => {
        if (cancelled) return;
        setOrders(data);
        setMeta(m);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading) return <Loader label="Loading your orders…" />;

  if (orders.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState title="No orders yet" description="Once you place an order, it'll show up here." actionLabel="Start shopping" actionTo="/products" />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-800">My Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/orders/${order._id}`}
            className="card flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-semibold text-slate-800">#{order.orderNumber}</p>
              <p className="text-xs text-slate-500">{formatDateTime(order.placedAt || order.createdAt)}</p>
              <p className="text-xs text-slate-500">{order.items?.length || 0} item(s)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100'}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="font-bold text-brand-700">{formatBDT(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
