import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  ClipboardList, Users, FileText, BarChart3, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRequirements } from '../../firebase/firestore';
import { getVendors } from '../../firebase/firestore';
import { getQuotations } from '../../firebase/firestore';
import { getComparisons } from '../../firebase/firestore';
import { Card, StatCard } from '../../components/ui/Card';
import { PageHeader, PageLoader, StatusBadge } from '../../components/ui/index';
import { formatDate, formatCurrency, timeAgo } from '../../utils';
import type { Requirement, Vendor, Quotation, Comparison } from '../../types';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#94a3b8',
  Open: '#6366f1',
  'Under Review': '#f59e0b',
  Completed: '#22c55e',
  Cancelled: '#ef4444',
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

const DashboardPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.companyName) return;
    const load = async () => {
      try {
        const [reqs, vens, quots, comps] = await Promise.all([
          getRequirements(userProfile.companyName),
          getVendors(userProfile.companyName),
          getQuotations(userProfile.companyName),
          getComparisons(userProfile.companyName),
        ]);
        setRequirements(reqs);
        setVendors(vens);
        setQuotations(quots);
        setComparisons(comps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile?.companyName]);

  const stats = useMemo(() => {
    const activeReqs = requirements.filter((r) => r.status === 'Open' || r.status === 'Under Review').length;
    
    // Deduplicate comparisons by requirementId (latest per requirement to avoid double-counting)
    const latestCompByReq = new Map<string, Comparison>();
    comparisons.forEach((c) => {
      const existing = latestCompByReq.get(c.requirementId);
      if (!existing || new Date(c.createdAt) > new Date(existing.createdAt)) {
        latestCompByReq.set(c.requirementId, c);
      }
    });

    const uniqueComps = Array.from(latestCompByReq.values());
    const totalSavings = uniqueComps.reduce((acc, c) => acc + (c.estimatedSavings ?? 0), 0);
    const avgSavings = uniqueComps.length > 0 ? totalSavings / uniqueComps.length : 0;

    return {
      totalRequirements: requirements.length,
      activeRequirements: activeReqs,
      totalVendors: vendors.length,
      totalQuotations: quotations.length,
      completedComparisons: comparisons.length,
      averageSavings: avgSavings,
      totalSavings,
    };
  }, [requirements, vendors, quotations, comparisons]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    requirements.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requirements]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; quotations: number; requirements: number }> = {};
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    requirements.forEach((r) => {
      const k = fmt(r.createdAt);
      if (!months[k]) months[k] = { month: k, quotations: 0, requirements: 0 };
      months[k].requirements++;
    });
    quotations.forEach((q) => {
      const k = fmt(q.createdAt);
      if (!months[k]) months[k] = { month: k, quotations: 0, requirements: 0 };
      months[k].quotations++;
    });

    return Object.values(months).slice(-6);
  }, [requirements, quotations]);

  const recentRequirements = requirements.slice(0, 5);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title={`Good ${getGreeting()}, ${userProfile?.name?.split(' ')[0]} 👋`}
        description={`${userProfile?.companyName} · Procurement Dashboard`}
        action={
          <Link to="/requirements/new">
            <Button leftIcon={<ClipboardList size={16} />}>New Requirement</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          <StatCard label="Requirements" value={stats.totalRequirements} icon={<ClipboardList size={20} />} color="indigo" />
          <StatCard label="Active" value={stats.activeRequirements} icon={<TrendingUp size={20} />} color="blue" />
          <StatCard label="Vendors" value={stats.totalVendors} icon={<Users size={20} />} color="green" />
          <StatCard label="Quotations" value={stats.totalQuotations} icon={<FileText size={20} />} color="amber" />
          <StatCard label="Evaluations" value={stats.completedComparisons} icon={<BarChart3 size={20} />} color="indigo" />
          <StatCard
            label="Total Savings"
            value={stats.totalSavings > 0 ? formatCurrency(stats.totalSavings) : '₹0'}
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
          <StatCard
            label="Avg. Savings"
            value={stats.averageSavings > 0 ? formatCurrency(stats.averageSavings) : '—'}
            icon={<TrendingUp size={20} />}
            color="green"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly activity */}
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Activity</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barSize={12} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="requirements" name="Requirements" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quotations" name="Quotations" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                No data yet. Create your first requirement.
              </div>
            )}
          </Card>

          {/* Status distribution */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Requirements by Status</h3>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: STATUS_COLORS[d.name] ?? '#94a3b8' }}
                        />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                No requirements yet.
              </div>
            )}
          </Card>
        </div>

        {/* Recent requirements */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent Requirements</h3>
            <Link to="/requirements" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentRequirements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentRequirements.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link to={`/requirements/${r.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                          {r.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(r.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.category}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(r.budget)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(r.deadline)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClipboardList size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No requirements yet.</p>
              <Link to="/requirements/new" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                Create your first requirement
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default DashboardPage;
