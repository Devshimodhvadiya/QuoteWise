import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { createQuotation } from '../../firebase/firestore';
import toast from 'react-hot-toast';
import type { Requirement, Vendor, Quotation } from '../../types';

const schema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  price: z.coerce.number().positive('Price must be positive'),
  warrantyMonths: z.coerce.number().min(0, 'Warranty must be 0 or more'),
  deliveryDays: z.coerce.number().positive('Delivery days must be at least 1'),
  vendorRating: z.coerce.number().min(0).max(5, 'Rating must be between 0 and 5'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  requirement: Requirement;
  vendors: Vendor[];
  companyId: string;
  createdBy: string;
  onSuccess: (quotation: Quotation) => void;
}

const AddQuotationModal: React.FC<Props> = ({
  open, onClose, requirement, vendors, companyId, createdBy, onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      warrantyMonths: 12,
      deliveryDays: 7,
      vendorRating: 4.0,
    },
  });

  const selectedVendorId = watch('vendorId');
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const onSubmit = async (data: FormData) => {
    const vendor = vendors.find((v) => v.id === data.vendorId);
    if (!vendor) return;

    setLoading(true);
    try {
      const quotationData: Omit<Quotation, 'id' | 'createdAt'> = {
        requirementId: requirement.id,
        requirementTitle: requirement.title,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorCompany: vendor.company,
        price: data.price,
        warrantyMonths: data.warrantyMonths,
        deliveryDays: data.deliveryDays,
        vendorRating: data.vendorRating,
        notes: data.notes ?? '',
        companyId,
        createdBy,
        submittedAt: new Date(),
      };

      const id = await createQuotation(quotationData);
      const created: Quotation = { ...quotationData, id, createdAt: new Date() };
      toast.success('Quotation added!');
      reset();
      onSuccess(created);
    } catch {
      toast.error('Failed to add quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Vendor Quotation"
      description={`Adding quotation for: ${requirement.title}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit(onSubmit)}>Add Quotation</Button>
        </>
      }
    >
      {vendors.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-500">
            All vendors already have quotations, or no vendors exist.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Go to Vendors to add more vendors first.
          </p>
        </div>
      ) : (
        <form className="space-y-4">
          <Select
            label="Select Vendor"
            required
            options={vendors.map((v) => ({ value: v.id, label: `${v.name} — ${v.company}` }))}
            placeholder="Choose a vendor"
            error={errors.vendorId?.message}
            {...register('vendorId')}
          />

          {selectedVendor && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-slate-700">{selectedVendor.name}</p>
              <p className="text-slate-500">{selectedVendor.company} · {selectedVendor.category}</p>
              <p className="text-slate-400 text-xs">{selectedVendor.email} · {selectedVendor.phone}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="42000"
              error={errors.price?.message}
              {...register('price')}
            />
            <Input
              label="Warranty (months)"
              type="number"
              min="0"
              required
              placeholder="24"
              error={errors.warrantyMonths?.message}
              {...register('warrantyMonths')}
            />
            <Input
              label="Delivery Days"
              type="number"
              min="1"
              required
              placeholder="7"
              error={errors.deliveryDays?.message}
              {...register('deliveryDays')}
            />
            <Input
              label="Vendor Rating (0–5)"
              type="number"
              min="0"
              max="5"
              step="0.1"
              required
              placeholder="4.5"
              error={errors.vendorRating?.message}
              {...register('vendorRating')}
            />
          </div>

          <Textarea
            label="Notes"
            placeholder="Additional terms, conditions, or remarks..."
            rows={2}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </form>
      )}
    </Modal>
  );
};

export default AddQuotationModal;
