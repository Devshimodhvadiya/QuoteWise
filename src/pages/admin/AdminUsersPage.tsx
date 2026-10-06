import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Search,
  UserPlus,
  Building,
  CheckCircle2,
  XCircle,
  Briefcase,
  Mail,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeCompanyUsers,
  updateUserRole,
  updateUserStatus,
  createCompanyUser,
} from '../../firebase/firestore';
import { Card } from '../../components/ui/Card';
import { PageHeader, EmptyState, PageLoader, Badge } from '../../components/ui/index';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils';
import toast from 'react-hot-toast';
import type { AppUser, UserRole } from '../../types';

const AdminUsersPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Dialog actions
  const [roleAction, setRoleAction] = useState<{ user: AppUser; newRole: UserRole } | null>(null);
  const [statusAction, setStatusAction] = useState<{ user: AppUser; newStatus: 'active' | 'suspended' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberCompany, setNewMemberCompany] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('IT Hardware & Enterprise Sourcing');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('employee');
  const [addingLoading, setAddingLoading] = useState(false);

  // Subscribe to all company users so Admin can monitor new self-registered users immediately
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCompanyUsers('all', (liveUsers) => {
      setUsers(liveUsers);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Distinct company list from users
  const companies = useMemo(() => {
    const set = new Set<string>();
    if (userProfile?.companyName) set.add(userProfile.companyName);
    users.forEach((u) => {
      if (u.companyName && u.companyName.trim()) set.add(u.companyName.trim());
    });
    return Array.from(set).sort();
  }, [users, userProfile?.companyName]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const employees = users.filter((u) => u.role === 'employee').length;
    const active = users.filter((u) => u.status !== 'suspended').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const newUsers = users.filter((u) => {
      const diffHours = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60);
      return diffHours <= 48;
    }).length;
    return { total, admins, employees, active, suspended, newUsers, companiesCount: companies.length };
  }, [users, companies]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.companyName && u.companyName.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const uStatus = u.status || 'active';
      const matchesStatus = statusFilter === 'all' || uStatus === statusFilter;
      const matchesCompany =
        companyFilter === 'all' ||
        (u.companyName && u.companyName.toLowerCase() === companyFilter.toLowerCase());

      return matchesSearch && matchesRole && matchesStatus && matchesCompany;
    });
  }, [users, searchQuery, roleFilter, statusFilter, companyFilter]);

  const handleRoleChange = async () => {
    if (!roleAction) return;
    setActionLoading(true);
    try {
      await updateUserRole(roleAction.user.uid, roleAction.newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === roleAction.user.uid ? { ...u, role: roleAction.newRole } : u))
      );
      toast.success(`${roleAction.user.name}'s role updated to ${roleAction.newRole}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setActionLoading(false);
      setRoleAction(null);
    }
  };

  const handleStatusChange = async () => {
    if (!statusAction) return;
    setActionLoading(true);
    try {
      await updateUserStatus(statusAction.user.uid, statusAction.newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.uid === statusAction.user.uid ? { ...u, status: statusAction.newStatus } : u))
      );
      toast.success(
        `${statusAction.user.name} has been ${
          statusAction.newStatus === 'active' ? 'reactivated' : 'suspended'
        }`
      );
    } catch {
      toast.error('Failed to update member status');
    } finally {
      setActionLoading(false);
      setStatusAction(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error('Please enter name and email');
      return;
    }
    setAddingLoading(true);
    try {
      const targetCompany = (newMemberCompany.trim() || userProfile?.companyName || 'QuoteWise Enterprise');
      const newUser: AppUser = {
        uid: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        companyName: targetCompany,
        role: newMemberRole,
        department: newMemberDept,
        status: 'active',
        assignedCount: 0,
        createdAt: new Date(),
      };
      await createCompanyUser(newUser);
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`Team member ${newUser.name} added successfully!`);
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberCompany('');
    } catch {
      toast.error('Failed to create team member');
    } finally {
      setAddingLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center – Organization Users & Access"
        description="Monitor all registered users across organizations, assign role privileges, and control tenant access in real-time."
        action={
          <button
            onClick={() => {
              setNewMemberCompany(userProfile?.companyName || 'QuoteWise Enterprise');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <UserPlus size={16} />
            Add Team Member
          </button>
        }
      />

      <div className="px-6 space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Users</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                  {stats.newUsers > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      +{stats.newUsers} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Across {stats.companiesCount} Organizations</p>
              </div>
              <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Users size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Administrators</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.admins}</p>
                <p className="text-xs text-indigo-600/80 mt-0.5">Full governance rights</p>
              </div>
              <div className="w-11 h-11 bg-indigo-100/70 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
                <ShieldCheck size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Employees / Operators</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.employees}</p>
                <p className="text-xs text-emerald-600/80 mt-0.5">Procurement evaluators</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Briefcase size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account Status</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.active} <span className="text-xs font-normal text-slate-500">/ {stats.suspended} paused</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Live RBAC enforcement</p>
              </div>
              <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <UserCheck size={22} />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 border-slate-200">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, company or department..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Organization filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Building size={14} className="text-slate-500" />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Organizations ({companies.length})</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    roleFilter === 'all' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    roleFilter === 'admin' ? 'bg-white shadow-sm text-indigo-700 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Admins
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('employee')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    roleFilter === 'employee' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Employees
                </button>
              </div>

              {/* Status filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'all' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'active' ? 'bg-white shadow-sm text-emerald-700 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('suspended')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'suspended' ? 'bg-white shadow-sm text-amber-700 font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                User Accounts ({filteredUsers.length} of {users.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-time Sync Active
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Viewing: <strong className="text-slate-700">{companyFilter === 'all' ? 'All Organizations' : companyFilter}</strong>
              </span>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={40} />}
              title="No matching users found"
              description="Try adjusting your search query, company or role filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-4 py-3.5">Organization / Company</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Registered</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.uid === userProfile?.uid;
                    const isActive = u.status !== 'suspended';
                    const initials = u.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const diffHours = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60);
                    const isRecentlyRegistered = diffHours <= 48;

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                        {/* Member Details */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900">{u.name}</p>
                                {isSelf && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    You
                                  </span>
                                )}
                                {isRecentlyRegistered && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <Sparkles size={10} />
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Organization */}
                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50/70 text-indigo-800 border border-indigo-100">
                            <Building size={12} className="text-indigo-500" />
                            {u.companyName || 'QuoteWise Enterprise'}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <Layers size={11} className="text-slate-500" />
                            {u.department || 'Procurement Operations'}
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-4 py-3.5">
                          <Badge
                            className={
                              u.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                                : 'bg-slate-50 text-slate-600 border-slate-200 font-medium'
                            }
                          >
                            {u.role === 'admin' ? '🔐 Administrator' : '👤 Employee'}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={12} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <XCircle size={12} />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic">Current Session</span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {/* Change Role */}
                              <button
                                onClick={() =>
                                  setRoleAction({
                                    user: u,
                                    newRole: u.role === 'admin' ? 'employee' : 'admin',
                                  })
                                }
                                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                                  u.role === 'admin'
                                    ? 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
                                    : 'text-indigo-600 hover:text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                                }`}
                                title={u.role === 'admin' ? 'Demote to Employee' : 'Promote to Admin'}
                              >
                                {u.role === 'admin' ? 'Make Employee' : 'Promote Admin'}
                              </button>

                              {/* Toggle Status */}
                              <button
                                onClick={() =>
                                  setStatusAction({
                                    user: u,
                                    newStatus: isActive ? 'suspended' : 'active',
                                  })
                                }
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                  isActive
                                    ? 'text-amber-600 hover:text-amber-800 border-amber-200 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Suspend access' : 'Activate access'}
                              >
                                {isActive ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Role Confirmation Dialog */}
      <ConfirmDialog
        open={!!roleAction}
        onClose={() => setRoleAction(null)}
        onConfirm={handleRoleChange}
        loading={actionLoading}
        title="Change Access Role"
        description={
          roleAction
            ? `Are you sure you want to change ${roleAction.user.name}'s role to "${
                roleAction.newRole === 'admin' ? 'Administrator' : 'Employee'
              }"?`
            : ''
        }
        confirmLabel="Confirm Role Update"
      />

      {/* Status Confirmation Dialog */}
      <ConfirmDialog
        open={!!statusAction}
        onClose={() => setStatusAction(null)}
        onConfirm={handleStatusChange}
        loading={actionLoading}
        title={statusAction?.newStatus === 'active' ? 'Reactivate Member' : 'Suspend Member Access'}
        description={
          statusAction
            ? `Are you sure you want to ${
                statusAction.newStatus === 'active' ? 'restore active access for' : 'suspend'
              } ${statusAction.user.name}?`
            : ''
        }
        confirmLabel={statusAction?.newStatus === 'active' ? 'Activate Member' : 'Suspend Member'}
      />

      {/* Add Team Member Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Organization Team Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@company.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Company / Organization *
            </label>
            <input
              type="text"
              required
              value={newMemberCompany}
              onChange={(e) => setNewMemberCompany(e.target.value)}
              placeholder="e.g. QuoteWise Enterprise or Acme Corp"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Department / Function *
            </label>
            <select
              value={newMemberDept}
              onChange={(e) => setNewMemberDept(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="IT Hardware & Enterprise Sourcing">IT Hardware & Enterprise Sourcing</option>
              <option value="Networking & Telecom Procurement">Networking & Telecom Procurement</option>
              <option value="Commercial & Price Benchmarking">Commercial & Price Benchmarking</option>
              <option value="Vendor Quality & Warranty Auditing">Vendor Quality & Warranty Auditing</option>
              <option value="Supply Chain & Turnaround Operations">Supply Chain & Turnaround Operations</option>
              <option value="Compliance & Audit Oversight">Compliance & Audit Oversight</option>
              <option value="Facilities & Commercial Contracts">Facilities & Commercial Contracts</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Assigned Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  newMemberRole === 'employee'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={newMemberRole === 'employee'}
                  onChange={() => setNewMemberRole('employee')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold">Employee</p>
                  <p className="text-[11px] text-slate-500">Create & compare RFQs and quotations</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  newMemberRole === 'admin'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={newMemberRole === 'admin'}
                  onChange={() => setNewMemberRole('admin')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold">Administrator</p>
                  <p className="text-[11px] text-slate-500">Full user management & team control</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingLoading}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {addingLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
