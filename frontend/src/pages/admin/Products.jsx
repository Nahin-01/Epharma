import React, { useEffect, useState } from 'react';
import { productsApi, categoriesApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, StatusPill, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatBDT } from '../../lib/format';

const DOSAGE_FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'SUSPENSION', 'CREAM', 'OINTMENT', 'DROPS', 'INJECTION', 'INHALER', 'DEVICE', 'OTHER'];
const EMPTY_FORM = {
  name: '',
  slug: '',
  category: '',
  dosageForm: 'TABLET',
  strength: '',
  manufacturer: '',
  prescriptionRequired: false,
  mrp: '',
  sellingPrice: '',
  lowStockThreshold: 10,
  status: 'ACTIVE',
};

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    productsApi
      .list({ search: search || undefined, page, limit: 12, sort: 'newest' })
      .then(({ data, meta: m }) => {
        setProducts(data);
        setMeta(m);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page]);
  useEffect(() => {
    categoriesApi.tree().then(flattenCategories).then(setCategories).catch(() => setCategories([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await productsApi.remove(confirmDelete._id);
      toast.success('Product deleted');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete product');
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Every medicine in the live catalogue."
        action={
          <div className="flex gap-2">
            <input
              className="input w-56"
              placeholder="Search products…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button type="button" onClick={openCreate} className="btn-primary whitespace-nowrap">
              + Add product
            </button>
          </div>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading products…" />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description="Try a different search, or add your first product." />
        ) : (
          <Table columns={['Product', 'Category', 'Price', 'Stock alert', 'Status', '']}>
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.strength} {p.manufacturer && `· ${p.manufacturer}`}</p>
                </td>
                <td className="px-5 py-3 text-slate-500">{p.category?.name || '—'}</td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-800">{formatBDT(p.sellingPrice)}</p>
                  {p.mrp > p.sellingPrice && <p className="text-xs text-slate-400 line-through">{formatBDT(p.mrp)}</p>}
                </td>
                <td className="px-5 py-3 text-slate-500">≤ {p.lowStockThreshold}</td>
                <td className="px-5 py-3">
                  <StatusPill status={p.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => openEdit(p)} className="btn-ghost px-3 py-1.5 text-xs">
                    Edit
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(p)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
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

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        categories={categories}
        onSaved={handleSaved}
        toast={toast}
      />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete product?"
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
          This permanently removes <strong>{confirmDelete?.name}</strong> from the catalogue. This can&rsquo;t be undone.
        </p>
      </Modal>
    </div>
  );
}

function flattenCategories(tree, depth = 0) {
  return (tree || []).flatMap((node) => [
    { _id: node._id, name: `${'— '.repeat(depth)}${node.name}` },
    ...flattenCategories(node.children, depth + 1),
  ]);
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ProductFormModal({ open, onClose, product, categories, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        category: product.category?._id || product.category || '',
        dosageForm: product.dosageForm || 'TABLET',
        strength: product.strength || '',
        manufacturer: product.manufacturer || '',
        prescriptionRequired: Boolean(product.prescriptionRequired),
        mrp: product.mrp ?? '',
        sellingPrice: product.sellingPrice ?? '',
        lowStockThreshold: product.lowStockThreshold ?? 10,
        status: product.status || 'ACTIVE',
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
    setError(null);
  }, [product, open]);

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.category) {
      setError('Please choose a category.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    try {
      if (product) {
        await productsApi.update(product._id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit product' : 'Add product'} wide>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <input className="input" value={form.name} onChange={update('name')} required minLength={2} />
        </Field>
        <Field label="Slug" hint="Used in the product URL" className="sm:col-span-2">
          <input
            className="input"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update('slug')(e);
            }}
            required
            pattern="[a-z0-9\-]+"
          />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={update('category')} required>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dosage form">
          <Select value={form.dosageForm} onChange={update('dosageForm')}>
            {DOSAGE_FORMS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Strength" hint="e.g. 500mg">
          <input className="input" value={form.strength} onChange={update('strength')} />
        </Field>
        <Field label="Manufacturer">
          <input className="input" value={form.manufacturer} onChange={update('manufacturer')} />
        </Field>
        <Field label="MRP (৳)">
          <input className="input" type="number" min="0" step="0.01" value={form.mrp} onChange={update('mrp')} required />
        </Field>
        <Field label="Selling price (৳)">
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={update('sellingPrice')} required />
        </Field>
        <Field label="Low stock threshold">
          <input className="input" type="number" min="0" value={form.lowStockThreshold} onChange={update('lowStockThreshold')} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={update('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={form.prescriptionRequired} onChange={update('prescriptionRequired')} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Requires a valid prescription to order
        </label>

        {error && <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
