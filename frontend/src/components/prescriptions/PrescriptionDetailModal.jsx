import React, { useEffect, useState } from 'react';
import { prescriptionsApi } from '../../api/prescriptions.api';
import { toAbsoluteFileUrl } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatDateTime } from '../../lib/format';
import { PRESCRIPTION_STATUS_COLORS, PRESCRIPTION_STATUS_LABELS } from '../../lib/constants';

const isStillAnalyzing = (p) => (p.files?.length || 0) > 0 && p.files.some((f) => !f.ocrResult);

// OCR runs asynchronously on a background worker, so a prescription handed
// to this modal right after upload usually has no results yet. Poll briefly
// while it's open so "Reading your prescription…" resolves on its own
// (mirrors the Flutter app's _pollForOcrResult in prescription_detail_screen.dart).
export default function PrescriptionDetailModal({ prescription, onClose, onUpdated, toast }) {
  const [fileUrls, setFileUrls] = useState({});
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setFileUrls({});
    setNote('');
    if (!prescription) return undefined;
    prescription.files?.forEach((f) => {
      prescriptionsApi
        .getSignedFileUrl(prescription._id, f._id)
        .then(({ url }) => setFileUrls((m) => ({ ...m, [f._id]: toAbsoluteFileUrl(url) })))
        .catch(() => {});
    });

    let cancelled = false;
    async function poll() {
      for (let attempt = 0; attempt < 10 && !cancelled; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (cancelled) return;
        try {
          const updated = await prescriptionsApi.getById(prescription._id);
          if (cancelled) return;
          onUpdated(updated);
          if (!isStillAnalyzing(updated)) return;
        } catch {
          return;
        }
      }
    }
    if (isStillAnalyzing(prescription)) poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescription?._id]);

  if (!prescription) return null;

  const handleSendNote = async () => {
    if (!note.trim()) return;
    setSending(true);
    try {
      const updated = await prescriptionsApi.addClarification(prescription._id, note.trim());
      toast.success('Your response has been sent to the pharmacy team.');
      setNote('');
      onUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Could not send your response');
    } finally {
      setSending(false);
    }
  };

  const files = prescription.files || [];
  const matchedMedicines = files.flatMap((f) => f.ocrResult?.matchedMedicines || []);
  const stillAnalyzing = isStillAnalyzing(prescription);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-slate-800">#{prescription._id.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-slate-400">Uploaded {formatDateTime(prescription.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRESCRIPTION_STATUS_COLORS[prescription.status] || 'bg-slate-100'}`}>
              {PRESCRIPTION_STATUS_LABELS[prescription.status] || prescription.status}
            </span>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Uploaded files</p>
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => {
            const url = fileUrls[f._id];
            const isImage = f.mimeType?.startsWith('image/');
            return (
              <a
                key={f._id}
                href={url || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-center"
              >
                {!url ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                ) : isImage ? (
                  <img src={url} alt={f.originalName || 'Prescription file'} className="h-full w-full object-cover" />
                ) : (
                  <>
                    <span className="text-2xl">📄</span>
                    <span className="px-2 text-[11px] text-slate-500">{f.originalName || 'View file'}</span>
                  </>
                )}
              </a>
            );
          })}
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Medicines detected</p>
          {stillAnalyzing && matchedMedicines.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
              Reading your prescription…
            </p>
          ) : matchedMedicines.length === 0 ? (
            <p className="text-sm text-slate-400">No medicines could be read from this prescription.</p>
          ) : (
            <div className="space-y-2">
              {matchedMedicines.map((m, i) => (
                <MedicineMatchRow key={i} medicine={m} toast={toast} />
              ))}
            </div>
          )}
        </div>

        {prescription.reviewerNotes && (
          <div className="mb-5 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Pharmacist note</p>
            {prescription.reviewerNotes}
          </div>
        )}

        {prescription.clarificationHistory?.length > 0 && (
          <div className="mb-5">
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

        {prescription.status === 'NEEDS_CLARIFICATION' && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Respond to the pharmacy team</p>
            <textarea
              className="input min-h-[80px]"
              placeholder="Add the details the pharmacist asked for…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="button" onClick={handleSendNote} disabled={sending || !note.trim()} className="btn-primary mt-3 w-full">
              {sending ? 'Sending…' : 'Send response'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// One detected medicine line. If the OCR text matched a catalogue product
// (resolved server-side in matchMedicinesFromText), offers "Add to bag";
// otherwise it's flagged as not carried so the customer knows to ask the
// pharmacist or search manually.
function MedicineMatchRow({ medicine, toast }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const label = medicine.productName || medicine.text || 'Unrecognized line';

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your bag.');
      return;
    }
    setAdding(true);
    try {
      await addItem(medicine.product, 1);
      toast.success(`${label} added to bag`);
    } catch (err) {
      toast.error(err.message || 'Could not add to bag');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
        {medicine.productName && medicine.text && medicine.text !== medicine.productName && (
          <p className="truncate text-xs text-slate-400">from: "{medicine.text}"</p>
        )}
      </div>
      {medicine.product ? (
        <button type="button" onClick={handleAdd} disabled={adding} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
          {adding ? 'Adding…' : 'Add to bag'}
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500">Not in database</span>
      )}
    </div>
  );
}
