import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Filter, SortAsc } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRequirements, deleteRequirement } from '../../firebase/firestore';
import { Button } from '../../components/ui/Button';
import { PageHeader, EmptyState, PageLoader, StatusBadge, SearchBar } from '../../components/ui/index';
import { Select } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/comparison';
import { formatDate, timeAgo } from '../../utils';
import toast from 'react-hot-toast';
import type { Requirement, RequirementStatus } from '../../types';
import { REQUIREMENT_STATUSES } from '../../types';

const RequirementsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'deadline' | 'budget'>('createdAt');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!userProfile?.companyName) return;
    try {
      const data = await getRequirements(userProfile.companyName);
      setRequirements(data);
    } catch {
      toast.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userProfile?.companyName]);

  const categories = useMemo(() =>
    [...new Set(requirements.map((r) => r.category))].sort(),
    [requirements]
  );

  const myRequirementsCount = useMemo(() =>
    requirements.filter((r) => r.createdBy === userProfile?.uid).length,
    [requirements, userProfile?.uid]
  );

  const filtered = useMemo(() => {
    let list = [...requirements];

    if (scopeFilter === 'mine' && userProfile?.uid) {
      list = list.filter((r) => r.createdBy === userProfile.uid);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (categoryFilter) {
      list = list.filter((r) => r.category === categoryFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'deadline') return a.deadline.getTime() - b.deadline.getTime();
      if (sortBy === 'budget') return b.budget - a.budget;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return list;
  }, [requirements, scopeFilter, userProfile?.uid, search, statusFilter, categoryFilter, sortBy]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRequirement(deleteTarget);
      setRequirements((prev) => prev.filter((r) => r.id !== deleteTarget));
      toast.success('Requirement deleted');
    } catch {
      toast.error('Failed to delete requirement');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Requirements"
        description="Manage procurement requirements and compare vendor quotations"
        action={
          <Link to="/requirements/new">
            <Button leftIcon={<Plus size={16} />}>New Requirement</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search requirements…"
              className="flex-1 min-w-48"
            />
            <Select
              options={REQUIREMENT_STATUSES.map((s) => ({ value: s, label: s }))}
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={categories.map((c) => ({ value: c, label: c }))}
              placeholder="All Categories"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-44"
            />
            <Select
              options={[
                { value: 'createdAt', label: 'Newest First' },
                { value: 'deadline', label: 'Deadline' },
                { value: 'budget', label: 'Budget (High→Low)' },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-44"
            />
            {(search || statusFilter || categoryFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
                className="text-xs text-slate-500 hover:text-red-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>

        {/* Results count & Scope Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              All Workspace ({requirements.length})
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
              My Requirements ({myRequirementsCount})
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Showing <strong className="text-slate-700">{filtered.length}</strong> requirement{filtered.length !== 1 ? 's' : ''} in <strong className="text-indigo-600">{userProfile?.companyName}</strong>
          </p>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={40} />}
            title={search || statusFilter ? 'No results found' : 'No requirements yet'}
            description={search || statusFilter ? 'Try adjusting your search filters.' : 'Create your first procurement requirement to get started.'}
            action={
              !search && !statusFilter ? (
                <Link to="/requirements/new">
                  <Button leftIcon={<Plus size={16} />} size="sm">New Requirement</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/requirements/${r.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                            {r.title}
                          </Link>
                          {r.createdBy === userProfile?.uid ? (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                              My Task
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded">
                              {r.createdByName || 'Team Member'}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.category}</td>
                      <td className="px-4 py-3 text-slate-600">{r.quantity} {r.unit}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(r.budget)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(r.deadline)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/requirements/${r.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link to={`/requirements/${r.id}/edit`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(r.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
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
        title="Delete Requirement"
        description="This will permanently delete this requirement. This action cannot be undone."
      />
    </div>
  );
};

export default RequirementsPage;
