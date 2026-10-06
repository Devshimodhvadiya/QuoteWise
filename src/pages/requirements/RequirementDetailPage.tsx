import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Plus, BarChart3, Calendar, Package,
  DollarSign, Tag, User, Clock, ShieldAlert,
} from 'lucide-react';
import {
  getRequirement, getQuotationsByRequirement, deleteRequirement,
  getComparisonsByRequirement, getVendors,
} from '../../firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  PageHeader, PageLoader, StatusBadge, EmptyState,
} from '../../components/ui/index';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/comparison';
import { formatDate, timeAgo } from '../../utils';
import toast from 'react-hot-toast';
import type { Requirement, Quotation, Comparison, Vendor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AddQuotationModal from '../../components/quotations/AddQuotationModal';

const RequirementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddQuotation, setShowAddQuotation] = useState(false);

  const load = async () => {
    if (!id || !userProfile?.companyName) return;
    try {
      const [req, quots, comps, vens] = await Promise.all([
        getRequirement(id, userProfile.companyName),
        getQuotationsByRequirement(id, userProfile.companyName),
        getComparisonsByRequirement(id, userProfile.companyName),
        getVendors(userProfile.companyName),
      ]);
      if (!req || req.companyId.trim().toLowerCase() !== userProfile.companyName.trim().toLowerCase()) {
        toast.error('Requirement not found or does not belong to your company');
        navigate('/requirements');
        return;
      }
      setRequirement(req);
      setQuotations(quots);
      setComparisons(comps);
      setVendors(vens);
    } catch {
      toast.error('Failed to load requirement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, userProfile]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRequirement(id);
      toast.success('Requirement deleted');
      navigate('/requirements');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!requirement) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Package size={40} />}
          title="Requirement not found"
          description="This requirement may have been deleted."
          action={<Link to="/requirements"><Button variant="outline">Back to Requirements</Button></Link>}
        />
      </div>
    );
  }

  const availableVendors = vendors.filter(
    (v) => !quotations.some((q) => q.vendorId === v.id)
  );

  return (
    <div>
      <PageHeader
        title={requirement.title}
        description={`Created ${timeAgo(requirement.createdAt)} by ${requirement.createdByName}`}
        breadcrumb={
          <Link to="/requirements" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} />
            Requirements
          </Link>
        }
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              leftIcon={<Plus size={16} />}
              size="sm"
              onClick={() => setShowAddQuotation(true)}
            >
              Add Quotation
            </Button>
            {quotations.length >= 2 && (
              <Link to={`/comparisons/new?requirementId=${id}`}>
                <Button leftIcon={<BarChart3 size={16} />} size="sm">
                  Compare Vendors
                </Button>
              </Link>
            )}
            <Link to={`/requirements/${id}/edit`}>
              <Button variant="outline" leftIcon={<Edit size={16} />} size="sm">Edit</Button>
            </Link>
            <Button
              variant="ghost"
              leftIcon={<Trash2 size={16} />}
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Requirement Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
                <InfoItem icon={<Tag size={14} />} label="Category" value={requirement.category} />
                <InfoItem icon={<Package size={14} />} label="Quantity" value={`${requirement.quantity} ${requirement.unit}`} />
                <InfoItem icon={<DollarSign size={14} />} label="Budget" value={formatCurrency(requirement.budget)} highlight />
                <InfoItem icon={<Calendar size={14} />} label="Deadline" value={formatDate(requirement.deadline)} />
                <InfoItem icon={<User size={14} />} label="Created By" value={requirement.createdByName} />
                <InfoItem icon={<Clock size={14} />} label="Updated" value={timeAgo(requirement.updatedAt)} />
              </div>
              {requirement.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{requirement.description}</p>
                </div>
              )}

              {(requirement.maxBudget || requirement.maxDeliveryDays || requirement.minWarrantyMonths || requirement.minVendorRating) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2.5">
                    <ShieldAlert size={14} className="text-indigo-600" />
                    <span>Mandatory Hard Constraints</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {requirement.maxBudget ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium">Max Budget Cap</p>
                        <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(requirement.maxBudget)}</p>
                      </div>
                    ) : null}
                    {requirement.maxDeliveryDays ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium">Max Delivery</p>
                        <p className="font-bold text-slate-800 mt-0.5">{requirement.maxDeliveryDays} days</p>
                      </div>
                    ) : null}
                    {requirement.minWarrantyMonths ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium">Min Warranty</p>
                        <p className="font-bold text-slate-800 mt-0.5">{requirement.minWarrantyMonths} months</p>
                      </div>
                    ) : null}
                    {requirement.minVendorRating ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium">Min Rating</p>
                        <p className="font-bold text-amber-600 mt-0.5">★ {requirement.minVendorRating} / 5</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Status</h3>
                <StatusBadge status={requirement.status} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Quotations received</span>
                  <span className="font-medium text-slate-900">{quotations.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Comparisons done</span>
                  <span className="font-medium text-slate-900">{comparisons.length}</span>
                </div>
                {quotations.length >= 2 && (
                  <Link to={`/comparisons/new?requirementId=${id}`}>
                    <Button size="sm" className="w-full mt-3" leftIcon={<BarChart3 size={14} />}>
                      Run Comparison
                    </Button>
                  </Link>
                )}
                {quotations.length < 2 && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
                    Add at least 2 quotations to compare vendors.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Quotations */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Vendor Quotations ({quotations.length})</h3>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowAddQuotation(true)}
            >
              Add Quotation
            </Button>
          </div>
          {quotations.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No quotations added yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAddQuotation(true)}
              >
                Add First Quotation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Warranty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{q.vendorName}</p>
                        <p className="text-xs text-slate-400">{q.vendorCompany}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(q.price)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{q.warrantyMonths} mo.</td>
                      <td className="px-4 py-3 text-right text-slate-600">{q.deliveryDays} days</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-amber-500 font-medium">★ {q.vendorRating}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{q.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Comparison history */}
        {comparisons.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Comparison History ({comparisons.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {comparisons.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      🏆 Recommended: {c.recommendedVendorName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {timeAgo(c.createdAt)} · By {c.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-indigo-600">
                      {c.scores[0]?.finalScore ?? 0}/100
                    </span>
                    <Link to={`/comparisons/${c.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Requirement"
        description="This will permanently delete this requirement and all associated data. This action cannot be undone."
      />

      <AddQuotationModal
        open={showAddQuotation}
        onClose={() => setShowAddQuotation(false)}
        requirement={requirement}
        vendors={availableVendors}
        companyId={userProfile?.companyName ?? ''}
        createdBy={userProfile?.uid ?? ''}
        onSuccess={(q) => {
          setQuotations((prev) => [...prev, q]);
          setShowAddQuotation(false);
        }}
      />
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = ({
  icon, label, value, highlight,
}) => (
  <div>
    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className={`text-sm font-semibold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default RequirementDetailPage;
