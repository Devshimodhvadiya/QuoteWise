import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getComparisons } from '../../firebase/firestore';
import { Card } from '../../components/ui/Card';
import { PageHeader, EmptyState, PageLoader, SearchBar } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/comparison';
import { formatDateTime, timeAgo } from '../../utils';
import type { Comparison } from '../../types';
import toast from 'react-hot-toast';

const HistoryPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userProfile?.companyName) return;
    getComparisons(userProfile.companyName)
      .then(setComparisons)
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [userProfile?.companyName]);

  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');

  const myCount = useMemo(() =>
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
          (c.recommendedVendorName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [comparisons, scopeFilter, userProfile?.uid, search]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Comparison History"
        description="Review all past vendor comparisons"
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search history…"
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
              My Comparisons ({myCount})
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-700">{filtered.length}</strong> record{filtered.length !== 1 ? 's' : ''} in <strong className="text-indigo-600">{userProfile?.companyName}</strong>
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<History size={40} />}
            title={search ? 'No results found' : 'No comparison history'}
            description="Completed comparisons will appear here."
            action={<Link to="/requirements"><Button variant="outline">Go to Requirements</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{c.requirementTitle}</h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{c.scores.length} vendors</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Trophy size={14} className="text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">
                        {c.recommendedVendorName || 'No eligible vendor'}
                      </span>
                      <span className="text-indigo-700 font-bold text-sm ml-1">
                        {c.scores[0]?.finalScore ?? 0}/100
                      </span>
                    </div>
                    {c.estimatedSavings > 0 && (
                      <p className="mt-1 text-xs text-green-600">
                        Est. savings: {formatCurrency(c.estimatedSavings)}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(c.createdAt)} · By {c.createdByName}
                    </p>
                  </div>
                  <Link to={`/comparisons/${c.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>

                {/* Weight indicators */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Weights used:</span>
                  <span className="text-indigo-600 font-medium">Price {c.weights.price}%</span>
                  <span className="text-green-600 font-medium">Warranty {c.weights.warranty}%</span>
                  <span className="text-blue-600 font-medium">Delivery {c.weights.delivery}%</span>
                  <span className="text-amber-600 font-medium">Rating {c.weights.rating}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
