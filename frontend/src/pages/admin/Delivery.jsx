import React, { useEffect, useState } from 'react';
import { deliveryApi } from '../../api/orders.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, StatusPill, Modal, Field } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatBDT, formatDateTime } from '../../lib/format';

export default function AdminDelivery() {
  const [tab, setTab] = useState('shipments');

  return (
    <div>
      <PageHeader
        title="Delivery"
        description="Live courier tracking and the delivery zones that drive checkout charges."
      />

      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          ['shipments', 'Shipments'],
          ['zones', 'Delivery zones'],
        ].map(([key, label]) => (
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

      {tab === 'shipments' ? <ShipmentsTab /> : <ZonesTab />}
    </div>
  );
}

function ShipmentsTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(null);

  const load = () => {
    setLoading(true);
    deliveryApi
      .listAll({ page, limit: 15 })
      .then(({ data, meta: m }) => {
        setItems(data);
        setMeta(m);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSync = async (d) => {
    setSyncing(d._id);
    try {
      const updated = await deliveryApi.syncTracking(d.order?._id || d.order);
      setItems((list) => list.map((x) => (x._id === updated._id ? updated : x)));
      toast.success('Tracking synced with the courier');
    } catch (err) {
      toast.error(err.message || 'Could not sync tracking');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card>
      {loading ? (
        <Loader label="Loading shipments…" />
      ) : items.length === 0 ? (
        <EmptyState title="No shipments yet" description="Deliveries appear here once an order is dispatched." />
      ) : (
        <Table columns={['Order', 'Customer', 'Courier', 'Charge', 'Status', 'Updated', '']}>
          {items.map((d) => (
            <tr key={d._id} className="hover:bg-slate-50/60">
              <td className="px-5 py-3 font-semibold text-slate-800">{d.order?.orderNumber || '—'}</td>
              <td className="px-5 py-3">
                <p className="text-slate-700">{d.customer?.name || '—'}</p>
                <p className="text-xs text-slate-400">{d.customer?.phone}</p>
              </td>
              <td className="px-5 py-3 text-slate-500">{d.courierProvider || '—'}{d.trackingId && <span className="block text-xs text-slate-400">{d.trackingId}</span>}</td>
              <td className="px-5 py-3 text-slate-700">{formatBDT(d.charge)}</td>
              <td className="px-5 py-3">
                <StatusPill status={d.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(d.updatedAt)}</td>
              <td className="px-5 py-3 text-right">
                <button type="button" onClick={() => handleSync(d)} disabled={syncing === d._id} className="btn-ghost px-3 py-1.5 text-xs">
                  {syncing === d._id ? 'Syncing…' : 'Sync'}
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
  );
}

const EMPTY_ZONE = { district: '', area: '', charge: '', expressCharge: '', estimatedDays: 2, isActive: true };

function ZonesTab() {
  const toast = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    deliveryApi
      .listZones()
      .then(({ data }) => setZones(data))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deliveryApi.removeZone(confirmDelete._id);
      toast.success('Zone removed');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not remove zone');
    }
  };

  return (
    <Card
      title={`${zones.length} zone${zones.length === 1 ? '' : 's'} configured`}
      action={
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary px-4 py-2 text-xs"
        >
          + Add zone
        </button>
      }
    >
      {loading ? (
        <Loader label="Loading zones…" />
      ) : zones.length === 0 ? (
        <EmptyState title="No delivery zones yet" description="Add a district to start charging accurate delivery fees." />
      ) : (
        <Table columns={['District', 'Area', 'Standard charge', 'Express charge', 'Est. days', 'Status', '']}>
          {zones.map((z) => (
            <tr key={z._id} className="hover:bg-slate-50/60">
              <td className="px-5 py-3 font-semibold text-slate-800">{z.district}</td>
              <td className="px-5 py-3 text-slate-500">{z.area || 'All areas'}</td>
              <td className="px-5 py-3 text-slate-700">{formatBDT(z.charge)}</td>
              <td className="px-5 py-3 text-slate-700">{z.expressCharge ? formatBDT(z.expressCharge) : '—'}</td>
              <td className="px-5 py-3 text-slate-500">{z.estimatedDays}</td>
              <td className="px-5 py-3">
                {z.isActive ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-800">Active</span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-500">Inactive</span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(z);
                    setModalOpen(true);
                  }}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmDelete(z)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ZoneFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        zone={editing}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
        toast={toast}
      />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove zone?"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Checkout will fall back to the default delivery charge for <strong>{confirmDelete?.district}</strong>.
        </p>
      </Modal>
    </Card>
  );
}

function ZoneFormModal({ open, onClose, zone, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_ZONE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (zone) {
      setForm({
        district: zone.district || '',
        area: zone.area || '',
        charge: zone.charge ?? '',
        expressCharge: zone.expressCharge ?? '',
        estimatedDays: zone.estimatedDays ?? 2,
        isActive: zone.isActive ?? true,
      });
    } else {
      setForm(EMPTY_ZONE);
    }
    setError(null);
  }, [zone, open]);

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
      charge: Number(form.charge),
      expressCharge: form.expressCharge === '' ? undefined : Number(form.expressCharge),
      estimatedDays: Number(form.estimatedDays) || 0,
    };
    try {
      if (zone) {
        await deliveryApi.updateZone(zone._id, payload);
        toast.success('Zone updated');
      } else {
        await deliveryApi.createZone(payload);
        toast.success('Zone added');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={zone ? 'Edit delivery zone' : 'Add delivery zone'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="District">
          <input className="input" value={form.district} onChange={update('district')} required minLength={2} />
        </Field>
        <Field label="Area" hint="Leave blank to cover the whole district">
          <input className="input" value={form.area} onChange={update('area')} />
        </Field>
        <Field label="Standard delivery charge (৳)">
          <input className="input" type="number" min="0" value={form.charge} onChange={update('charge')} required />
        </Field>
        <Field label="Express delivery charge (৳)" hint="Optional">
          <input className="input" type="number" min="0" value={form.expressCharge} onChange={update('expressCharge')} />
        </Field>
        <Field label="Estimated delivery days">
          <input className="input" type="number" min="0" value={form.estimatedDays} onChange={update('estimatedDays')} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Active
        </label>

        {error && <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : zone ? 'Save changes' : 'Add zone'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
