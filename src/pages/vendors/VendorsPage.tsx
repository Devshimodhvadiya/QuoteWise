import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Users, Star, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { PageHeader, EmptyState, PageLoader, SearchBar } from '../../components/ui/index';
import { Badge } from '../../components/ui/index';
import { timeAgo, getRatingColor } from '../../utils';
import toast from 'react-hot-toast';
import type { Vendor } from '../../types';
import { VENDOR_CATEGORIES } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vendorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Phone is required'),
  category: z.string().min(1, 'Select a category'),
  rating: z.coerce.number().min(0).max(5, 'Rating must be between 0 and 5'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const VendorFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  initial?: Vendor | null;
  onSave: (data: VendorFormData) => Promise<void>;
}> = ({ open, onClose, initial, onSave }) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      rating: 4.0,
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        company: initial.company,
        email: initial.email,
        phone: initial.phone,
        category: initial.category,
        rating: initial.rating,
        address: initial.address,
        notes: initial.notes,
      });
    } else {
      reset({ rating: 4.0 });
    }
  }, [initial, open]);

  const onSubmit = async (data: VendorFormData) => {
    setLoading(true);
    try {
      await onSave(data);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Vendor' : 'Add Vendor'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit(onSubmit)}>
            {initial ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Name" required error={errors.name?.message} placeholder="Jane Smith" {...register('name')} />
          <Input label="Company Name" required error={errors.company?.message} placeholder="Tech Solutions Ltd." {...register('company')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" required error={errors.email?.message} placeholder="vendor@company.com" {...register('email')} />
          <Input label="Phone" required error={errors.phone?.message} placeholder="+91 98765 43210" {...register('phone')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category" required
            options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select category"
            error={errors.category?.message}
            {...register('category')}
          />
          <Input
            label="Rating (0–5)" type="number" min="0" max="5" step="0.1"
            required error={errors.rating?.message} placeholder="4.5" {...register('rating')}
          />
        </div>
        <Input label="Address" placeholder="123 Business Park, Mumbai" error={errors.address?.message} {...register('address')} />
        <Textarea label="Notes" rows={2} placeholder="Any additional notes about this vendor..." error={errors.notes?.message} {...register('notes')} />
      </form>
    </Modal>
  );
};

const VendorsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!userProfile?.companyName) return;
    try {
      const data = await getVendors(userProfile.companyName);
      setVendors(data);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userProfile?.companyName]);

  const filtered = useMemo(() => {
    let list = [...vendors];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) list = list.filter((v) => v.category === categoryFilter);
    return list;
  }, [vendors, search, categoryFilter]);

  const categories = useMemo(() => [...new Set(vendors.map((v) => v.category))].sort(), [vendors]);

  const handleSave = async (data: VendorFormData) => {
    if (!userProfile) return;
    try {
      if (editTarget) {
        await updateVendor(editTarget.id, data);
        setVendors((prev) => prev.map((v) => v.id === editTarget.id ? { ...v, ...data } : v));
        toast.success('Vendor updated');
      } else {
        const id = await createVendor({
          ...data,
          address: data.address ?? '',
          notes: data.notes ?? '',
          companyId: userProfile.companyName,
          createdBy: userProfile.uid,
        });
        const newVendor: Vendor = {
          id,
          ...data,
          address: data.address ?? '',
          notes: data.notes ?? '',
          companyId: userProfile.companyName,
          createdBy: userProfile.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setVendors((prev) => [newVendor, ...prev]);
        toast.success('Vendor added');
      }
      setShowModal(false);
      setEditTarget(null);
    } catch {
      toast.error('Failed to save vendor');
      throw new Error('save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget);
      setVendors((prev) => prev.filter((v) => v.id !== deleteTarget));
      toast.success('Vendor deleted');
    } catch {
      toast.error('Failed to delete vendor');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage your vendor directory"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => { setEditTarget(null); setShowModal(true); }}>
            Add Vendor
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <Card padding="sm">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search vendors…" className="flex-1 min-w-48" />
            <Select
              options={categories.map((c) => ({ value: c, label: c }))}
              placeholder="All Categories"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            />
            {(search || categoryFilter) && (
              <button onClick={() => { setSearch(''); setCategoryFilter(''); }} className="text-xs text-slate-500 hover:text-red-600 underline">
                Clear
              </button>
            )}
          </div>
        </Card>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-700">{filtered.length}</strong> vendor{filtered.length !== 1 ? 's' : ''} in <strong className="text-indigo-600">{userProfile?.companyName}</strong>
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title={search ? 'No vendors found' : 'No vendors yet'}
            description={search ? 'Try a different search term.' : 'Add your first vendor to start receiving quotations.'}
            action={
              !search ? (
                <Button leftIcon={<Plus size={16} />} size="sm" onClick={() => setShowModal(true)}>
                  Add Vendor
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{v.name}</p>
                        <p className="text-xs text-slate-400">{v.company}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">{v.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{v.email}</td>
                      <td className="px-4 py-3 text-slate-600">{v.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${getRatingColor(v.rating)}`}>
                          ★ {v.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(v.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditTarget(v); setShowModal(true); }}
                            className="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(v.id)}
                            className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
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

      <VendorFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        initial={editTarget}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Vendor"
        description="This will permanently remove this vendor. Existing quotations referencing this vendor will remain."
      />
    </div>
  );
};

export default VendorsPage;
