import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getQuotations, deleteQuotation } from '../../firebase/firestore';
import { Card } from '../../components/ui/Card';
import { PageHeader, EmptyState, PageLoader, SearchBar } from '../../components/ui/index';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/comparison';
import { timeAgo } from '../../utils';
import type { Quotation } from '../../types';
import toast from 'react-hot-toast';

const QuotationsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userProfile?.companyName) return;
    getQuotations(userProfile.companyName)
      .then(setQuotations)
      .catch(() => toast.error('Failed to load quotations'))
      .finally(() => setLoading(false));
  }, [userProfile?.companyName]);

  const myQuotationsCount = useMemo(() =>
    quotations.filter((q) => q.createdBy === userProfile?.uid).length,
    [quotations, userProfile?.uid]
  );

  const filtered = useMemo(() => {
    let list = [...quotations];
    if (scopeFilter === 'mine' && userProfile?.uid) {
      list = list.filter((q) => q.createdBy === userProfile.uid);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (x) =>
          (x.requirementTitle ?? '').toLowerCase().includes(q) ||
          (x.vendorName ?? '').toLowerCase().includes(q) ||
          (x.vendorCompany ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [quotations, scopeFilter, userProfile?.uid, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuotation(deleteTarget);
      setQuotations((prev) => prev.filter((q) => q.id !== deleteTarget));
      toast.success('Quotation deleted');
    } catch {
      toast.error('Failed to delete quotation');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="All vendor quotations across requirements"
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search quotations…"
            className="max-w-sm"
          />

          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                scopeFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Workspace ({quotations.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                scopeFilter === 'mine'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Submissions ({myQuotationsCount})
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-700">{filtered.length}</strong> quotation{filtered.length !== 1 ? 's' : ''} in <strong className="text-indigo-600">{userProfile?.companyName}</strong>
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title={search ? 'No quotations found' : 'No quotations yet'}
            description="Quotations are added from requirement detail pages."
            action={!search ? <Link to="/requirements"><Button variant="outline">Go to Requirements</Button></Link> : undefined}
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requirement</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Warranty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <Link
                          to={`/requirements/${q.requirementId}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {q.requirementTitle ?? 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{q.vendorName}</p>
                        <p className="text-xs text-slate-400">{q.vendorCompany}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(q.price)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{q.warrantyMonths} mo.</td>
                      <td className="px-4 py-3 text-right text-slate-600">{q.deliveryDays} days</td>
                      <td className="px-4 py-3 text-right text-amber-500 font-medium">★ {q.vendorRating}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(q.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget(q.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Quotation"
        description="This will permanently delete this quotation. This action cannot be undone."
      />
    </div>
  );
};

export default QuotationsPage;
