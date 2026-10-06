import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getComparisons } from '../../firebase/firestore';
import { Card } from '../../components/ui/Card';
import { PageHeader, EmptyState, PageLoader, SearchBar } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/comparison';
import { timeAgo } from '../../utils';
import type { Comparison } from '../../types';
import toast from 'react-hot-toast';

const ComparisonsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userProfile?.companyName) return;
    getComparisons(userProfile.companyName)
      .then(setComparisons)
      .catch(() => toast.error('Failed to load comparisons'))
      .finally(() => setLoading(false));
  }, [userProfile?.companyName]);

  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');

  const myComparisonsCount = useMemo(() =>
    comparisons.filter((c) => c.createdBy === userProfile?.uid).length,
    [comparisons, userProfile?.uid]
  );

  const filtered = useMemo(() => {
    let list = [...comparisons];
    if (scopeFilter === 'mine' && userProfile?.uid) {
      list = list.filter((c) => c.createdBy === userProfile.uid);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.requirementTitle.toLowerCase().includes(q) ||
          (c.recommendedVendorName ?? '').toLowerCase().includes(q) ||
          c.createdByName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [comparisons, scopeFilter, userProfile?.uid, search]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Comparisons"
        description="All vendor comparisons for your company"
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search comparisons…"
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
              All Workspace ({comparisons.length})
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
              My Comparisons ({myComparisonsCount})
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-700">{filtered.length}</strong> comparison{filtered.length !== 1 ? 's' : ''} in <strong className="text-indigo-600">{userProfile?.companyName}</strong>
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={40} />}
            title={search ? 'No comparisons found' : 'No comparisons yet'}
            description={search ? 'Try a different search.' : 'Run your first comparison from a requirement with 2+ quotations.'}
            action={!search ? <Link to="/requirements"><Button variant="outline">Go to Requirements</Button></Link> : undefined}
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requirement</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recommended Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Score</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Savings</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{c.requirementTitle}</p>
                        <p className="text-xs text-slate-400">{c.scores.length} vendors compared</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {c.recommendedVendorName && <Trophy size={14} className="text-amber-500" />}
                          <span className="font-medium text-slate-800">{c.recommendedVendorName || 'No eligible vendor'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-indigo-700">
                          {c.scores[0]?.finalScore ?? 0}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {c.estimatedSavings > 0 ? formatCurrency(c.estimatedSavings) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.createdByName}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/comparisons/${c.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComparisonsPage;
