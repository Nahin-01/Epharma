import React, { useEffect, useState } from 'react';
import { couponsApi } from '../../api/orders.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatBDT, formatDate } from '../../lib/format';

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: '',
  minOrderAmount: 0,
  maxDiscountAmount: '',
  usageLimit: '',
  usageLimitPerCustomer: 1,
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    couponsApi
      .list({ page, limit: 15 })
      .then(({ data, meta: m }) => {
        setCoupons(data);
        setMeta(m);
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSaved = () => {
    setModalOpen(false);
    load();
  };
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await couponsApi.remove(confirmDelete._id);
      toast.success('Coupon deleted');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete coupon');
    }
  };

  const isExpired = (c) => new Date(c.expiresAt) < new Date();

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes shoppers can apply at checkout."
        action={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn-primary"
          >
            + Add coupon
          </button>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading coupons…" />
        ) : coupons.length === 0 ? (
          <EmptyState title="No coupons yet" description="Create your first discount code." />
        ) : (
          <Table columns={['Code', 'Discount', 'Min order', 'Usage limit', 'Expires', 'Status', '']}>
            {coupons.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <p className="font-mono text-sm font-bold text-slate-800">{c.code}</p>
                  {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                </td>
                <td className="px-5 py-3 text-slate-700">{c.type === 'PERCENTAGE' ? `${c.value}%` : formatBDT(c.value)}</td>
                <td className="px-5 py-3 text-slate-500">{formatBDT(c.minOrderAmount)}</td>
                <td className="px-5 py-3 text-slate-500">{c.usageLimit ?? '∞'}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{formatDate(c.expiresAt)}</td>
                <td className="px-5 py-3">
                  {!c.isActive ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-500">Disabled</span>
                  ) : isExpired(c) ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase text-red-600">Expired</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-800">Live</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setModalOpen(true);
                    }}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(c)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    Delete
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

      <CouponFormModal open={modalOpen} onClose={() => setModalOpen(false)} coupon={editing} onSaved={handleSaved} toast={toast} />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete coupon?"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Shoppers won&rsquo;t be able to apply <strong className="font-mono">{confirmDelete?.code}</strong> anymore.
        </p>
      </Modal>
    </div>
  );
}

function CouponFormModal({ open, onClose, coupon, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (coupon) {
      setForm({
        code: coupon.code || '',
        description: coupon.description || '',
        type: coupon.type || 'PERCENTAGE',
        value: coupon.value ?? '',
        minOrderAmount: coupon.minOrderAmount ?? 0,
        maxDiscountAmount: coupon.maxDiscountAmount ?? '',
        usageLimit: coupon.usageLimit ?? '',
        usageLimitPerCustomer: coupon.usageLimitPerCustomer ?? 1,
        startsAt: toDateInput(coupon.startsAt) || toDateInput(new Date()),
        expiresAt: toDateInput(coupon.expiresAt),
        isActive: coupon.isActive ?? true,
      });
    } else {
      setForm({ ...EMPTY_FORM, startsAt: toDateInput(new Date()) });
    }
    setError(null);
  }, [coupon, open]);

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      usageLimitPerCustomer: Number(form.usageLimitPerCustomer) || 1,
    };
    try {
      if (coupon) {
        delete payload.code;
        await couponsApi.update(coupon._id, payload);
        toast.success('Coupon updated');
      } else {
        await couponsApi.create(payload);
        toast.success('Coupon created');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={coupon ? 'Edit coupon' : 'Add coupon'} wide>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Code" className="sm:col-span-2">
          <input
            className="input font-mono uppercase"
            value={form.code}
            onChange={update('code')}
            disabled={Boolean(coupon)}
            required
            minLength={3}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <input className="input" value={form.description} onChange={update('description')} placeholder="Shown to shoppers, optional" />
        </Field>
        <Field label="Discount type">
          <Select value={form.type} onChange={update('type')}>
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </Select>
        </Field>
        <Field label={form.type === 'PERCENTAGE' ? 'Value (%)' : 'Value (৳)'}>
          <input className="input" type="number" min="0" value={form.value} onChange={update('value')} required />
        </Field>
        <Field label="Min order amount (৳)">
          <input className="input" type="number" min="0" value={form.minOrderAmount} onChange={update('minOrderAmount')} />
        </Field>
        <Field label="Max discount amount (৳)" hint="Only for percentage coupons">
          <input className="input" type="number" min="0" value={form.maxDiscountAmount} onChange={update('maxDiscountAmount')} />
        </Field>
        <Field label="Total usage limit" hint="Leave blank for unlimited">
          <input className="input" type="number" min="1" value={form.usageLimit} onChange={update('usageLimit')} />
        </Field>
        <Field label="Uses per customer">
          <input className="input" type="number" min="1" value={form.usageLimitPerCustomer} onChange={update('usageLimitPerCustomer')} />
        </Field>
        <Field label="Starts on">
          <input className="input" type="date" value={form.startsAt} onChange={update('startsAt')} />
        </Field>
        <Field label="Expires on">
          <input className="input" type="date" value={form.expiresAt} onChange={update('expiresAt')} required />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Active
        </label>

        {error && <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : coupon ? 'Save changes' : 'Create coupon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
