import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../../api/admin.api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, StatCard, Card } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import { formatBDT } from '../../lib/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reportsApi
      .dashboard()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load the dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="A live snapshot of what's happening across ePharmacy right now."
      />

      {loading && <Loader label="Loading dashboard…" />}
      {error && <p className="field-error rounded-lg bg-red-50 px-4 py-3">{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Orders today" value={summary.ordersToday} tone="brand" icon={<BoxIcon />} />
            <StatCard label="Revenue today" value={formatBDT(summary.revenueToday)} tone="accent" icon={<CoinIcon />} />
            <StatCard label="Pending orders" value={summary.pendingOrders} tone="slate" icon={<ClockIcon />} />
            <StatCard label="Total customers" value={summary.totalCustomers} tone="brand" icon={<UsersIcon />} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Prescriptions awaiting review"
              value={summary.pendingPrescriptions}
              tone={summary.pendingPrescriptions > 0 ? 'red' : 'slate'}
              icon={<FileIcon />}
              hint={summary.pendingPrescriptions > 0 ? 'Needs pharmacist attention' : 'All caught up'}
            />
            <StatCard
              label="Low stock products"
              value={summary.lowStockCount}
              tone={summary.lowStockCount > 0 ? 'red' : 'slate'}
              icon={<AlertIcon />}
              hint={summary.lowStockCount > 0 ? 'Below their reorder threshold' : 'Stock levels healthy'}
            />
            <StatCard
              label="Batches expiring soon"
              value={summary.expiringCount}
              tone={summary.expiringCount > 0 ? 'red' : 'slate'}
              icon={<CalendarIcon />}
              hint={summary.expiringCount > 0 ? 'Within the next 90 days' : 'Nothing expiring soon'}
            />
          </div>

          <Card title="Quick actions" className="mt-6">
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink to="/admin/prescriptions" label="Review prescriptions" desc="Approve or flag uploads" />
              <QuickLink to="/admin/orders" label="Manage orders" desc="Update status, track fulfillment" />
              <QuickLink to="/admin/inventory" label="Check inventory" desc="Batches, stock, expiry" />
              <QuickLink to="/admin/reports" label="View reports" desc="Sales, delivery, prescriptions" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function QuickLink({ to, label, desc }) {
  return (
    <Link
      to={to}
      className="card-hover flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:border-brand-200"
    >
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <span className="text-xs text-slate-500">{desc}</span>
    </Link>
  );
}

function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" strokeLinejoin="round" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.2 2.5-2.2s2.5.8 2.5 2c0 2.7-5 1.8-5 4.5 0 1.3 1.1 2.2 2.5 2.2s2.5-.9 2.5-2.2" strokeLinecap="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M21.5 19a6 6 0 0 0-5-5.9" strokeLinecap="round" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 2.5V7h4M8 12h8M8 16h8M8 8h3" strokeLinecap="round" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}
