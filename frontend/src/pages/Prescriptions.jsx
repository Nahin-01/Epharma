import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { prescriptionsApi } from '../api/prescriptions.api';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../lib/format';
import { PRESCRIPTION_STATUS_COLORS, PRESCRIPTION_STATUS_LABELS } from '../lib/constants';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import PrescriptionDetailModal from '../components/prescriptions/PrescriptionDetailModal';

export default function Prescriptions() {
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    prescriptionsApi
      .listMine({ limit: 50 })
      .then(({ data }) => setPrescriptions(data))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = (updated) => {
    setPrescriptions((list) => list.map((p) => (p._id === updated._id ? updated : p)));
    setActive(updated);
  };

  if (loading) return <Loader label="Loading prescriptions…" />;

  if (prescriptions.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="No prescriptions yet"
          description="Upload a prescription and our pharmacy team will review it."
          actionLabel="Upload prescription"
          actionTo="/upload-prescription"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">My Prescriptions</h1>
        <Link to="/upload-prescription" className="btn-primary text-sm">
          + Upload new
        </Link>
      </div>
      <div className="space-y-3">
        {prescriptions.map((p) => (
          <div
            key={p._id}
            role="button"
            tabIndex={0}
            onClick={() => setActive(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActive(p);
              }
            }}
            className="card flex cursor-pointer flex-col justify-between gap-2 p-4 transition-colors hover:border-brand-300 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-semibold text-slate-800">#{p._id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-slate-500">
                {p.files?.length || 0} file(s) · Uploaded {formatDateTime(p.createdAt)}
              </p>
              {p.reviewerNotes && <p className="mt-1 text-xs text-slate-500">Note: {p.reviewerNotes}</p>}
            </div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${PRESCRIPTION_STATUS_COLORS[p.status] || 'bg-slate-100'}`}>
              {PRESCRIPTION_STATUS_LABELS[p.status] || p.status}
            </span>
          </div>
        ))}
      </div>

      <PrescriptionDetailModal prescription={active} onClose={() => setActive(null)} onUpdated={handleUpdated} toast={toast} />
    </div>
  );
}
