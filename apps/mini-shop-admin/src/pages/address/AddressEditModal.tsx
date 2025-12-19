import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  FormTextField,
  FormTextareaField,
  FormSelectField,
} from '@repo/ui';
import { addressApi } from '@/api';
import { useToastStore } from '@/store/useToastStore';
import { AddressResponse } from '@/type/types.ts';

// Zod Schema Definition
const AddressEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  // Add regex validation if needed: .regex(/^(09|\+639)\d{9}$/, 'Invalid phone format')
  fullAddress: z.string().min(1, 'Full address is required'),
  isDefault: z.coerce.number(), // 0 or 1
});

type AddressEditFormInput = z.infer<typeof AddressEditSchema>;

interface Props {
  data?: AddressResponse;
  close: () => void;
}

export const AddressEditModal: React.FC<Props> = ({ data, close }) => {
  const addToast = useToastStore((state) => state.addToast);

  const form = useForm<AddressEditFormInput>({
    resolver: zodResolver(AddressEditSchema),
    defaultValues: {
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      phone: data?.phone || '',
      fullAddress: data?.fullAddress || '',
      isDefault: data?.isDefault || 0,
    },
  });

  const { run, loading } = useRequest(
    async (formData: AddressEditFormInput) => {
      if (data?.addressId) {
        // Here we merge the form data.
        // Note: Geo-IDs (provinceId, etc.) are excluded from the form currently
        // as per the original code's limitation.
        return addressApi.updateAddress(data.addressId, formData);
      }
      return Promise.reject('Create not supported in this demo');
    },
    {
      manual: true,
      onSuccess: () => {
        addToast('success', 'Address saved successfully');
        close();
      },
      onError: (err) => {
        addToast('error', err.message || 'Failed to save');
      },
    },
  );

  const onSubmit = (formData: AddressEditFormInput) => {
    run(formData);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormTextField name="firstName" label="First Name" />
            <FormTextField name="lastName" label="Last Name" />
          </div>

          <FormTextField name="phone" label="Phone" />

          {/* Placeholder for Region Selector */}
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded border border-dashed border-gray-300 text-sm text-gray-500">
            Note: Geo-location editing requires fetching Province/City/Barangay
            IDs. Currently: {data?.province}, {data?.city}, {data?.barangay}
            <br />
            (To implement this, integrate `RegionSelector` component here)
          </div>

          <FormTextareaField
            name="fullAddress"
            label="Full Address (Street/Unit)"
          />

          <FormSelectField
            name="isDefault"
            label="Set as Default Address"
            options={[
              { label: 'No', value: '0' },
              { label: 'Yes', value: '1' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button isLoading={loading} type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
