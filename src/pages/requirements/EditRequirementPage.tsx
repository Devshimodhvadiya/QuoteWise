import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRequirement, updateRequirement } from '../../firebase/firestore';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { PageHeader, PageLoader } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { REQUIREMENT_CATEGORIES, REQUIREMENT_STATUSES } from '../../types';
import { format } from 'date-fns';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  budget: z.coerce.number().positive('Budget must be positive'),
  deadline: z.string().min(1, 'Deadline is required'),
  status: z.enum(['Draft', 'Open', 'Under Review', 'Completed', 'Cancelled']),
  maxBudget: z.coerce.number().optional(),
  maxDeliveryDays: z.coerce.number().optional(),
  minWarrantyMonths: z.coerce.number().optional(),
  minVendorRating: z.coerce.number().min(0).max(5).optional(),
});

type FormData = z.infer<typeof schema>;

const EditRequirementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!id || !userProfile?.companyName) return;
    getRequirement(id, userProfile.companyName).then((req) => {
      if (!req || req.companyId.trim().toLowerCase() !== userProfile.companyName.trim().toLowerCase()) {
        toast.error('Requirement not found or access denied');
        navigate('/requirements');
        return;
      }
      reset({
        title: req.title,
        description: req.description,
        category: req.category,
        quantity: req.quantity,
        unit: req.unit,
        budget: req.budget,
        deadline: format(req.deadline, 'yyyy-MM-dd'),
        status: req.status,
        maxBudget: req.maxBudget ?? req.budget,
        maxDeliveryDays: req.maxDeliveryDays,
        minWarrantyMonths: req.minWarrantyMonths,
        minVendorRating: req.minVendorRating,
      });
      setLoading(false);
    });
  }, [id, userProfile?.companyName, navigate, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateRequirement(id, {
        title: data.title,
        description: data.description ?? '',
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        budget: data.budget,
        deadline: new Date(data.deadline),
        status: data.status,
        maxBudget: data.maxBudget && data.maxBudget > 0 ? data.maxBudget : data.budget,
        maxDeliveryDays: data.maxDeliveryDays && data.maxDeliveryDays > 0 ? data.maxDeliveryDays : undefined,
        minWarrantyMonths: data.minWarrantyMonths && data.minWarrantyMonths > 0 ? data.minWarrantyMonths : undefined,
        minVendorRating: data.minVendorRating && data.minVendorRating > 0 ? data.minVendorRating : undefined,
      });
      toast.success('Requirement updated');
      navigate(`/requirements/${id}`);
    } catch {
      toast.error('Failed to update requirement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Edit Requirement"
        breadcrumb={
          <Link to={`/requirements/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} />
            Back to Requirement
          </Link>
        }
        action={
          <div className="flex gap-2">
            <Link to={`/requirements/${id}`}><Button variant="outline">Cancel</Button></Link>
            <Button leftIcon={<Save size={16} />} loading={saving} onClick={handleSubmit(onSubmit)}>
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-5">Basic Information</h3>
            <div className="space-y-4">
              <Input
                label="Requirement Title"
                required
                error={errors.title?.message}
                {...register('title')}
              />
              <Textarea
                label="Description"
                error={errors.description?.message}
                rows={3}
                {...register('description')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  required
                  options={REQUIREMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  error={errors.category?.message}
                  {...register('category')}
                />
                <Select
                  label="Status"
                  required
                  options={REQUIREMENT_STATUSES.map((s) => ({ value: s, label: s }))}
                  error={errors.status?.message}
                  {...register('status')}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-5">Quantity & Budget</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Quantity"
                type="number"
                min="1"
                required
                error={errors.quantity?.message}
                {...register('quantity')}
              />
              <Input
                label="Unit"
                required
                error={errors.unit?.message}
                {...register('unit')}
              />
              <Input
                label="Budget (₹)"
                type="number"
                min="1"
                required
                error={errors.budget?.message}
                {...register('budget')}
              />
              <Input
                label="Deadline"
                type="date"
                required
                error={errors.deadline?.message}
                {...register('deadline')}
              />
            </div>
          </Card>

          {/* Hard Constraints */}
          <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Mandatory Hard Constraints</h3>
                  <p className="text-xs text-slate-500">
                    Disqualifies non-compliant vendors before weighted scoring. Ineligible vendors cannot be recommended.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <Input
                label="Max Budget Cap (₹)"
                type="number"
                placeholder="Defaults to budget"
                error={errors.maxBudget?.message}
                {...register('maxBudget')}
              />
              <Input
                label="Max Delivery Days"
                type="number"
                placeholder="e.g., 15 days"
                error={errors.maxDeliveryDays?.message}
                {...register('maxDeliveryDays')}
              />
              <Input
                label="Min Warranty (Months)"
                type="number"
                placeholder="e.g., 12 months"
                error={errors.minWarrantyMonths?.message}
                {...register('minWarrantyMonths')}
              />
              <Input
                label="Min Vendor Rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="e.g., 3.5"
                error={errors.minVendorRating?.message}
                {...register('minVendorRating')}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={`/requirements/${id}`}><Button variant="outline">Cancel</Button></Link>
            <Button type="submit" leftIcon={<Save size={16} />} loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRequirementPage;
