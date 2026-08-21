import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customersApi } from '../api/customers.api';
import Loader from '../components/common/Loader';

const emptyAddress = { label: 'Home', name: '', phone: '', line1: '', line2: '', district: '', area: '', thana: '', postCode: '', isDefault: false };

export default function Account() {
  const { user, changePassword, logout } = useAuth();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);

  const loadAddresses = () => {
    setLoading(true);
    customersApi
      .listAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadAddresses, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await customersApi.addAddress(form);
      toast.success('Address added');
      setForm(emptyAddress);
      loadAddresses();
    } catch (err) {
      toast.error(err.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await customersApi.deleteAddress(id);
      toast.success('Address removed');
      loadAddresses();
    } catch (err) {
      toast.error(err.message || 'Could not remove address');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    setSavingPw(true);
    try {
      await changePassword(pwForm);
      toast.success('Password changed. Please sign in again.');
      setPwForm({ currentPassword: '', newPassword: '' });
      await logout();
    } catch (err) {
      setPwError(err.message || 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-800">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Profile</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Name</dt>
                <dd className="font-medium">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="font-medium">{user?.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Phone</dt>
                <dd className="font-medium">{user?.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Role</dt>
                <dd className="font-medium">{user?.role}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Saved Addresses</h2>
            {loading ? (
              <Loader label="Loading addresses…" size="sm" />
            ) : addresses.length === 0 ? (
              <p className="text-sm text-slate-500">No saved addresses yet.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <div key={addr._id} className="flex items-start justify-between rounded-md border border-slate-200 p-3 text-sm">
                    <div>
                      <strong>{addr.label}</strong> {addr.isDefault && <span className="text-xs text-brand-600">(default)</span>}
                      <br />
                      {addr.name}, {addr.phone}
                      <br />
                      {addr.line1}, {addr.area ? `${addr.area}, ` : ''}
                      {addr.district}
                    </div>
                    <button type="button" onClick={() => handleDeleteAddress(addr._id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddAddress} className="mt-4 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Label (e.g. Home)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              <input className="input" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
              <input className="input sm:col-span-2" placeholder="Address line" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
              <input className="input" placeholder="Area (optional)" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Set as default
              </label>
              <button type="submit" className="btn-primary sm:col-span-2" disabled={savingAddress}>
                {savingAddress ? 'Saving…' : 'Add address'}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                className="input"
                placeholder="Current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
              <input
                type="password"
                className="input"
                placeholder="New password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                minLength={8}
                required
              />
              {pwError && <p className="field-error">{pwError}</p>}
              <button type="submit" className="btn-primary w-full" disabled={savingPw}>
                {savingPw ? 'Saving…' : 'Change password'}
              </button>
            </form>
          </section>

          <section className="card space-y-2 p-5 text-sm">
            <Link to="/orders" className="block font-medium text-brand-700 hover:underline">
              View my orders →
            </Link>
            <Link to="/prescriptions" className="block font-medium text-brand-700 hover:underline">
              View my prescriptions →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
