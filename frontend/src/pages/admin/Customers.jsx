import React, { useEffect, useState } from 'react';
import { customersApi } from '../../api/customers.api';
import { PageHeader, Card, Table, Modal } from '../../components/admin/AdminUI';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../lib/format';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    customersApi
      .list({ page, limit: 15 })
      .then(({ data, meta: m }) => {
        setCustomers(data);
        setMeta(m);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [page]);

  const openDetail = (c) => {
    setActive(c);
    setDetail(null);
    setDetailLoading(true);
    customersApi
      .getById(c._id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div>
      <PageHeader title="Customers" description="Everyone who has created a shopper account." />

      <Card>
        {loading ? (
          <Loader label="Loading customers…" />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Shopper accounts will show up here as people register." />
        ) : (
          <Table columns={['Name', 'Contact', 'Loyalty points', 'Joined', '']}>
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold text-slate-800">{c.user?.name || '—'}</td>
                <td className="px-5 py-3">
                  <p className="text-slate-700">{c.user?.email || '—'}</p>
                  <p className="text-xs text-slate-400">{c.user?.phone}</p>
                </td>
                <td className="px-5 py-3 text-slate-500">{c.loyaltyPoints ?? 0}</td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDate(c.user?.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => openDetail(c)} className="btn-ghost px-3 py-1.5 text-xs">
                    View
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

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={active?.user?.name || 'Customer'}>
        {detailLoading ? (
          <Loader label="Loading customer…" />
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                <p className="text-slate-700">{detail.user?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Phone</p>
                <p className="text-slate-700">{detail.user?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Loyalty points</p>
                <p className="text-slate-700">{detail.loyaltyPoints ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Joined</p>
                <p className="text-slate-700">{formatDate(detail.user?.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Saved addresses</p>
              {detail.addresses?.length ? (
                <div className="space-y-2">
                  {detail.addresses.map((a, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold text-slate-700">
                        {a.label} {a.isDefault && <span className="text-xs font-normal text-brand-600">(default)</span>}
                      </p>
                      <p className="text-slate-500">{a.line1}, {a.area}, {a.district}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No saved addresses yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Could not load this customer&rsquo;s profile.</p>
        )}
      </Modal>
    </div>
  );
}
