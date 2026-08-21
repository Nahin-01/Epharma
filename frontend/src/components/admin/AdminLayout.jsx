import React, { useState } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';
import { PERMISSIONS, hasPermission, isStaff } from '../../lib/permissions';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true, icon: GridIcon, permission: null },
  { to: '/admin/orders', label: 'Orders', icon: BoxIcon, permission: PERMISSIONS.ORDER_VIEW },
  { to: '/admin/products', label: 'Products', icon: PillIcon, permission: PERMISSIONS.PRODUCT_VIEW },
  { to: '/admin/categories', label: 'Categories', icon: FolderIcon, permission: PERMISSIONS.PRODUCT_VIEW },
  { to: '/admin/inventory', label: 'Inventory', icon: LayersIcon, permission: PERMISSIONS.INVENTORY_VIEW },
  { to: '/admin/coupons', label: 'Coupons', icon: TagIcon, permission: PERMISSIONS.COUPON_MANAGE },
  { to: '/admin/customers', label: 'Customers', icon: UsersIcon, permission: PERMISSIONS.CUSTOMER_VIEW },
  {
    to: '/admin/prescriptions',
    label: 'Prescriptions',
    icon: FileIcon,
    permission: PERMISSIONS.PRESCRIPTION_VIEW,
  },
  { to: '/admin/delivery', label: 'Delivery', icon: TruckIcon, permission: PERMISSIONS.DELIVERY_MANAGE },
  { to: '/admin/reports', label: 'Reports', icon: ChartIcon, permission: PERMISSIONS.REPORT_VIEW },
];

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <Loader label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!isStaff(user)) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-800">Staff access only</h1>
        <p className="max-w-sm text-sm text-slate-500">
          This dashboard is for ePharmacy staff accounts. Your account doesn&rsquo;t have a staff role, so there&rsquo;s
          nothing here for you — head back to the storefront.
        </p>
        <Link to="/" className="btn-primary mt-2">
          Back to storefront
        </Link>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => !item.permission || hasPermission(user, item.permission));

  return (
    <div className="flex min-h-[calc(100vh-1px)] bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-none transform bg-slate-900 text-slate-200 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-400 text-white">
            <PillIcon />
          </span>
          <span className="font-display text-base font-extrabold text-white">ePharmacy</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-200">
            Admin
          </span>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{formatRole(user.role)}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="btn-outline flex-1 border-white/15 bg-transparent py-1.5 text-xs text-slate-200 hover:text-slate-900">
              Storefront
            </Link>
            <button type="button" onClick={logout} className="btn-outline flex-1 border-white/15 bg-transparent py-1.5 text-xs text-slate-200 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <p className="font-display text-sm font-bold text-slate-800 sm:text-base">
            {NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ||
              'Admin'}
          </p>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function formatRole(role) {
  return (role || '')
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" strokeLinejoin="round" />
    </svg>
  );
}
function PillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-40 12 12)" />
      <path d="M9.5 8.5 15.5 15.5" strokeLinecap="round" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" strokeLinejoin="round" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinejoin="round" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 12 12.5 19.5a2 2 0 0 1-2.8 0L4 13.8a2 2 0 0 1 0-2.8L11.5 3H18a2 2 0 0 1 2 2v7Z" strokeLinejoin="round" />
      <circle cx="15" cy="8" r="1.5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M21.5 19a6 6 0 0 0-5-5.9" strokeLinecap="round" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 2.5V7h4M8 12h8M8 16h8M8 8h3" strokeLinecap="round" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 6h11v10H2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10h5l4 4v2h-9z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="18.5" cy="18" r="1.8" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
      <path d="M2.5 20h19" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}
