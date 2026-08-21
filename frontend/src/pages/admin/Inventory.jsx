import React, { useEffect, useState } from 'react';
import { inventoryApi, warehousesApi, suppliersApi } from '../../api/admin.api';
import { productsApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, StatusPill, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatBDT, formatDate } from '../../lib/format';

const STATUS_FILTERS = ['', 'ACTIVE', 'EXPIRED', 'DEPLETED', 'RECALLED'];

export default function AdminInventory() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const load = () => {
    setLoading(true);
    inventoryApi
      .listBatches({ status: status || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => {
        setBatches(data);
        setMeta(m);
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);
  useEffect(() => {
    warehousesApi.list({ limit: 100 }).then(({ data }) => setWarehouses(data)).catch(() => setWarehouses([]));
    suppliersApi.list({ limit: 100 }).then(({ data }) => setSuppliers(data)).catch(() => setSuppliers([]));
  }, []);

  const handleSaved = () => {
    setModalOpen(false);
    load();
  };

  const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock batches across all warehouses, with expiry tracking."
        action={
          <div className="flex gap-2">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn-primary whitespace-nowrap"
            >
              + Add batch
            </button>
          </div>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading batches…" />
        ) : batches.length === 0 ? (
          <EmptyState title="No batches found" description="Add stock to start tracking inventory." />
        ) : (
          <Table columns={['Product', 'Batch #', 'Warehouse', 'Available', 'Expiry', 'Status', '']}>
            {batches.map((b) => {
              const days = daysUntil(b.expiryDate);
              return (
                <tr key={b._id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{b.product?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{formatBDT(b.sellingPrice)} / unit</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{b.batchNumber}</td>
                  <td className="px-5 py-3 text-slate-500">{b.warehouse?.name || '—'}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{b.availableQuantity ?? b.quantity}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className={days <= 90 && b.status === 'ACTIVE' ? 'font-semibold text-red-600' : 'text-slate-500'}>
                      {formatDate(b.expiryDate)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={b.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(b);
                        setModalOpen(true);
                      }}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        <div className="px-5 pb-5">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </Card>

      <BatchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        batch={editing}
        warehouses={warehouses}
        suppliers={suppliers}
        onSaved={handleSaved}
        toast={toast}
      />
    </div>
  );
}

function BatchFormModal({ open, onClose, batch, warehouses, suppliers, onSaved, toast }) {
  const [productQuery, setProductQuery] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [form, setForm] = useState({
    product: '',
    warehouse: '',
    supplier: '',
    batchNumber: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    expiryDate: '',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setForm({
        product: batch.product?._id || batch.product,
        warehouse: batch.warehouse?._id || batch.warehouse,
        supplier: batch.supplier?._id || '',
        batchNumber: batch.batchNumber,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : '',
        status: batch.status,
      });
      setProductQuery(batch.product?.name || '');
    } else {
      setForm({ product: '', warehouse: '', supplier: '', batchNumber: '', purchasePrice: '', sellingPrice: '', quantity: '', expiryDate: '', status: 'ACTIVE' });
      setProductQuery('');
    }
    setProductOptions([]);
    setError(null);
  }, [batch, open]);

  useEffect(() => {
    if (batch || !productQuery || productQuery.length < 2) {
      setProductOptions([]);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      productsApi
        .list({ search: productQuery, limit: 8 })
        .then(({ data }) => !cancelled && setProductOptions(data))
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [productQuery, batch]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (batch) {
        await inventoryApi.updateBatch(batch._id, {
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          quantity: Number(form.quantity),
          expiryDate: form.expiryDate,
          status: form.status,
        });
        toast.success('Batch updated');
      } else {
        if (!form.product) {
          setError('Please select a product.');
          setSaving(false);
          return;
        }
        await inventoryApi.createBatch({
          product: form.product,
          warehouse: form.warehouse,
          supplier: form.supplier || null,
          batchNumber: form.batchNumber,
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          quantity: Number(form.quantity),
          expiryDate: form.expiryDate,
        });
        toast.success('Batch added');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save batch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={batch ? 'Update batch' : 'Add stock batch'} wide>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!batch && (
          <div className="relative sm:col-span-2">
            <Field label="Product">
              <input
                className="input"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setForm((f) => ({ ...f, product: '' }));
                }}
                placeholder="Search products by name…"
                required
              />
            </Field>
            {productOptions.length > 0 && !form.product && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lift">
                {productOptions.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      setForm((f) => ({ ...f, product: p._id }));
                      setProductQuery(p.name);
                      setProductOptions([]);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!batch && (
          <>
            <Field label="Warehouse">
              <Select value={form.warehouse} onChange={update('warehouse')} required>
                <option value="">Choose a warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Supplier" hint="Optional">
              <Select value={form.supplier} onChange={update('supplier')}>
                <option value="">None</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Batch number">
              <input className="input" value={form.batchNumber} onChange={update('batchNumber')} required />
            </Field>
          </>
        )}
        <Field label="Purchase price (৳)">
          <input className="input" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={update('purchasePrice')} required />
        </Field>
        <Field label="Selling price (৳)">
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={update('sellingPrice')} required />
        </Field>
        <Field label="Quantity">
          <input className="input" type="number" min="0" value={form.quantity} onChange={update('quantity')} required />
        </Field>
        <Field label="Expiry date">
          <input className="input" type="date" value={form.expiryDate} onChange={update('expiryDate')} required />
        </Field>
        {batch && (
          <Field label="Status">
            <Select value={form.status} onChange={update('status')}>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="DEPLETED">Depleted</option>
              <option value="RECALLED">Recalled</option>
            </Select>
          </Field>
        )}

        {error && <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : batch ? 'Save changes' : 'Add batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
