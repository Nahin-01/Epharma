import React, { useEffect, useState } from 'react';
import { prescriptionsApi } from '../../api/prescriptions.api';
import { toAbsoluteFileUrl } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, StatusPill, Modal, Field, Select } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../lib/format';
import { PRESCRIPTION_STATUS_TRANSITIONS } from '../../lib/constants';

const STATUS_FILTERS = ['', 'UPLOADED', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION', 'VERIFIED', 'ACCEPTED', 'REJECTED', 'FULFILLED'];

export default function AdminPrescriptions() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);

  const load = () => {
    setLoading(true);
    prescriptionsApi
      .listReviewQueue({ status: status || undefined, page, limit: 12 })
      .then(({ data, meta: m }) => {
        setItems(data);
        setMeta(m);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const handleReviewed = (updated) => {
    setItems((list) => list.filter((p) => p._id !== updated._id));
    setActive(null);
  };

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Uploads waiting on a pharmacist's review, oldest first."
        action={
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-56">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace(/_/g, ' ') : 'All statuses'}
              </option>
            ))}
          </Select>
        }
      />

      <Card>
        {loading ? (
          <Loader label="Loading prescriptions…" />
        ) : items.length === 0 ? (
          <EmptyState title="Nothing to review" description="New prescription uploads will appear here." />
        ) : (
          <Table columns={['Customer', 'Source', 'Files', 'Status', 'Uploaded', '']}>
            {items.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-800">{p.customer?.name || '—'}</p>
                  <p className="text-xs text-slate-400">{p.customer?.phone}</p>
                </td>
                <td className="px-5 py-3 text-slate-500">{p.source}</td>
                <td className="px-5 py-3 text-slate-500">{p.files?.length ?? 0}</td>
                <td className="px-5 py-3">
                  <StatusPill status={p.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(p.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => setActive(p)} className="btn-ghost px-3 py-1.5 text-xs">
                    Review
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

      <ReviewModal prescription={active} onClose={() => setActive(null)} onReviewed={handleReviewed} toast={toast} />
    </div>
  );
}

function ReviewModal({ prescription, onClose, onReviewed, toast }) {
  const [fileUrls, setFileUrls] = useState({});
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDecision('');
    setNotes('');
    setFileUrls({});
    if (!prescription) return;
    prescription.files?.forEach((f) => {
      prescriptionsApi
        .getSignedFileUrl(prescription._id, f._id)
        .then(({ url }) => setFileUrls((m) => ({ ...m, [f._id]: toAbsoluteFileUrl(url) })))
        .catch(() => {});
    });
  }, [prescription?._id]);

  if (!prescription) return null;
  const allowed = PRESCRIPTION_STATUS_TRANSITIONS[prescription.status] || [];

  const handleSubmit = async () => {
    if (!decision) return;
    setSaving(true);
    try {
      const updated = await prescriptionsApi.review(prescription._id, decision, notes);
      toast.success(`Prescription marked ${decision.replace(/_/g, ' ').toLowerCase()}`);
      onReviewed(updated);
    } catch (err) {
      toast.error(err.message || 'Could not save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(prescription)} onClose={onClose} title={`Prescription from ${prescription.customer?.name || 'customer'}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill status={prescription.status} />
          <span className="text-xs text-slate-400">Uploaded {formatDateTime(prescription.createdAt)}</span>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Uploaded files</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {prescription.files?.map((f) => (
              <a
                key={f._id}
                href={fileUrls[f._id] || '#'}
                target="_blank"
                rel="noreferrer"
                className="group flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
              >
                {fileUrls[f._id] ? (
                  <img src={fileUrls[f._id]} alt={f.originalName || 'Prescription file'} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                )}
              </a>
            ))}
          </div>
        </div>

        {prescription.clarificationHistory?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Clarification history</p>
            <div className="space-y-2">
              {prescription.clarificationHistory.map((c, i) => (
                <p key={i} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {c.note}
                </p>
              ))}
            </div>
          </div>
        )}

        {allowed.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Decision</p>
            <div className="flex flex-wrap gap-2">
              {allowed.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDecision(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    decision === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {decision && (
              <div className="mt-3">
                <Field label={decision === 'NEEDS_CLARIFICATION' || decision === 'REJECTED' ? 'Notes (shown to the customer)' : 'Notes (optional)'}>
                  <textarea
                    className="input min-h-[80px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required={decision === 'NEEDS_CLARIFICATION' || decision === 'REJECTED'}
                  />
                </Field>
                <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary mt-3 w-full">
                  {saving ? 'Saving…' : `Confirm: ${decision.replace(/_/g, ' ')}`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">This prescription is in a final state.</p>
        )}
      </div>
    </Modal>
  );
}
