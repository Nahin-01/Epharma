import React, { useEffect, useState } from 'react';
import { categoriesApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const EMPTY_FORM = { name: '', slug: '', parent: '', order: 0, isActive: true };

export default function AdminCategories() {
  const toast = useToast();
  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    categoriesApi
      .tree(false)
      .then((data) => {
        setTree(data);
        setFlat(flatten(data));
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setModalOpen(true);
  };
  const handleSaved = () => {
    setModalOpen(false);
    load();
  };
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await categoriesApi.remove(confirmDelete._id);
      toast.success('Category deleted');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete category');
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="The category tree shoppers browse by, top to bottom."
        action={
          <button type="button" onClick={openCreate} className="btn-primary">
            + Add category
          </button>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading categories…" />
        ) : tree.length === 0 ? (
          <EmptyState title="No categories yet" description="Add your first category to start organizing products." />
        ) : (
          <div className="divide-y divide-slate-100">
            <CategoryRows nodes={tree} depth={0} onEdit={openEdit} onDelete={setConfirmDelete} />
          </div>
        )}
      </Card>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editing}
        categories={flat}
        onSaved={handleSaved}
        toast={toast}
      />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete category?"
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
          This removes <strong>{confirmDelete?.name}</strong>. Products already in this category keep their reference,
          but it will disappear from browse menus.
        </p>
      </Modal>
    </div>
  );
}

function CategoryRows({ nodes, depth, onEdit, onDelete }) {
  return nodes.map((node) => (
    <React.Fragment key={node._id}>
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
          {depth > 0 && <span className="text-slate-300">└</span>}
          <span className="text-sm font-semibold text-slate-800">{node.name}</span>
          {!node.isActive && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Inactive</span>
          )}
        </div>
        <div className="flex flex-none gap-1">
          <button type="button" onClick={() => onEdit(node)} className="btn-ghost px-3 py-1.5 text-xs">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(node)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
      {node.children?.length > 0 && <CategoryRows nodes={node.children} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />}
    </React.Fragment>
  ));
}

function flatten(tree, depth = 0) {
  return (tree || []).flatMap((node) => [
    { _id: node._id, name: `${'— '.repeat(depth)}${node.name}` },
    ...flatten(node.children, depth + 1),
  ]);
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function CategoryFormModal({ open, onClose, category, categories, onSaved, toast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        slug: category.slug || '',
        parent: category.parent?._id || category.parent || '',
        order: category.order ?? 0,
        isActive: category.isActive ?? true,
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
    setError(null);
  }, [category, open]);

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
    setSaving(true);
    const payload = { ...form, order: Number(form.order) || 0, parent: form.parent || null };
    try {
      if (category) {
        await categoriesApi.update(category._id, payload);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(payload);
        toast.success('Category created');
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = categories.filter((c) => c._id !== category?._id);

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit category' : 'Add category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input className="input" value={form.name} onChange={update('name')} required minLength={2} />
        </Field>
        <Field label="Slug">
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
        <Field label="Parent category" hint="Leave blank for a top-level category">
          <Select value={form.parent} onChange={update('parent')}>
            <option value="">No parent (top-level)</option>
            {parentOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Display order" hint="Lower numbers show first">
          <input className="input" type="number" value={form.order} onChange={update('order')} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Visible to shoppers
        </label>

        {error && <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
