import React, { useEffect, useState } from 'react';
import { reportsApi } from '../../api/admin.api';
import { PageHeader, Card, StatCard, Table } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import { formatBDT, formatDate } from '../../lib/format';

const TABS = [
  ['sales', 'Sales'],
  ['inventory', 'Inventory'],
  ['prescriptions', 'Prescriptions'],
  ['delivery', 'Delivery'],
];

function toDateInput(d) {
  return d.toISOString().slice(0, 10);
}

export default function AdminReports() {
  const [tab, setTab] = useState('sales');
  // Default window: last 30 days — a sensible starting range, adjustable via the date pickers.
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toDateInput(new Date()));

  return (
    <div>
      <PageHeader title="Reports" description="Live rollups computed straight from the database — nothing cached or hardcoded." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === key ? 'bg-white text-brand-700 shadow-soft' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== 'inventory' && (
          <div className="flex items-center gap-2 text-sm">
            <input type="date" className="input py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-slate-400">to</span>
            <input type="date" className="input py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      {tab === 'sales' && <SalesReport from={from} to={to} />}
      {tab === 'inventory' && <InventoryReport />}
      {tab === 'prescriptions' && <BreakdownReport fetcher={reportsApi.prescriptions} from={from} to={to} noun="prescription" />}
      {tab === 'delivery' && <BreakdownReport fetcher={reportsApi.delivery} from={from} to={to} noun="delivery" />}
    </div>
  );
}

function BarList({ rows, valueKey = 'count', total }) {
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r._id}>
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
            <span>{(r._id || 'Unknown').replace(/_/g, ' ')}</span>
            <span>
              {r[valueKey]}
              {total ? ` (${Math.round((r[valueKey] / total) * 100)}%)` : ''}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${(r[valueKey] / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesReport({ from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .sales({ from, to })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Loader label="Crunching sales…" />;
  if (!data) return <p className="text-sm text-slate-400">Could not load the sales report.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={data.summary.totalOrders} tone="brand" icon={<span>#</span>} />
        <StatCard label="Revenue" value={formatBDT(data.summary.totalRevenue)} tone="accent" icon={<span>৳</span>} />
        <StatCard label="Discounts given" value={formatBDT(data.summary.totalDiscount)} tone="slate" icon={<span>%</span>} />
        <StatCard label="Avg. order value" value={formatBDT(data.summary.avgOrderValue)} tone="brand" icon={<span>Ø</span>} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Orders by status">
          <div className="p-5">
            {data.byStatus.length ? <BarList rows={data.byStatus} total={data.summary.totalOrders} /> : <p className="text-sm text-slate-400">No orders in this range.</p>}
          </div>
        </Card>
        <Card title="Revenue by payment method">
          <div className="p-5">
            {data.byPaymentMethod.length ? (
              <BarList rows={data.byPaymentMethod} valueKey="revenue" />
            ) : (
              <p className="text-sm text-slate-400">No orders in this range.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BreakdownReport({ fetcher, from, to, noun }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetcher({ from, to })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <Loader label="Loading…" />;
  if (!data) return <p className="text-sm text-slate-400">Could not load this report.</p>;

  return (
    <div className="space-y-6">
      <StatCard label={`Total ${noun}s`} value={data.total} tone="brand" icon={<span>#</span>} />
      <Card title="By status">
        <div className="p-5">
          {data.byStatus.length ? <BarList rows={data.byStatus} total={data.total} /> : <p className="text-sm text-slate-400">Nothing in this range.</p>}
        </div>
      </Card>
    </div>
  );
}

function InventoryReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .inventory()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Scanning inventory…" />;
  if (!data) return <p className="text-sm text-slate-400">Could not load the inventory report.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Low stock products" value={data.lowStockCount} tone={data.lowStockCount ? 'red' : 'slate'} icon={<span>!</span>} />
        <StatCard label="Batches expiring within 30 days" value={data.expiringCount} tone={data.expiringCount ? 'red' : 'slate'} icon={<span>⏰</span>} />
      </div>

      <Card title="Low stock products">
        {data.lowStock.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">Everything is above its reorder threshold.</p>
        ) : (
          <Table columns={['Product', 'SKU', 'In stock', 'Threshold']}>
            {data.lowStock.map((p) => (
              <tr key={p._id}>
                <td className="px-5 py-3 font-semibold text-slate-800">{p.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.sku || '—'}</td>
                <td className="px-5 py-3 font-semibold text-red-600">{p.stockQuantity}</td>
                <td className="px-5 py-3 text-slate-500">{p.lowStockThreshold}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Batches expiring soon">
        {data.expiring.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No batches expiring in the next 30 days.</p>
        ) : (
          <Table columns={['Product', 'Batch #', 'Warehouse', 'Expiry']}>
            {data.expiring.map((b) => (
              <tr key={b._id}>
                <td className="px-5 py-3 font-semibold text-slate-800">{b.product?.name || '—'}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{b.batchNumber}</td>
                <td className="px-5 py-3 text-slate-500">{b.warehouse?.name || '—'}</td>
                <td className="px-5 py-3 font-semibold text-red-600">{formatDate(b.expiryDate)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
