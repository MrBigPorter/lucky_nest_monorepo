import { z } from 'zod';
import { Modal, Input, Button } from '@/components/UIComponents.tsx';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore.ts';
import React, { useEffect } from 'react';
import { useRequest } from 'ahooks';
import { categoryApi } from '@/api';
import { Category } from '@/type/types.ts';
import { BaseSelect } from '@repo/ui';

const editCategorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
  nameEn: z
    .string()
    .min(3, 'Category name must be at least 3 characters')
    .optional(),
  sortOrder: z.coerce.number().optional(),
  state: z.coerce.number().optional(),
});

type editCategoryFormInput = z.infer<typeof editCategorySchema>;

interface editCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  detail: Category;
}

export const EditCategoryModal: React.FC<editCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  detail,
}) => {
  const addToast = useToastStore((state) => state.addToast);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<editCategoryFormInput>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: '',
      nameEn: '',
      sortOrder: 0,
      state: 1,
    },
  });

  const { run, loading } = useRequest(categoryApi.updateCategory, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'category updated successfully');
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen && detail) {
      reset({
        name: detail.name,
        nameEn: detail.nameEn,
        sortOrder: detail.sortOrder,
        state: detail.state,
      });
    }
  }, [isOpen, detail, reset]);

  const onSubmit = (data: editCategoryFormInput) => {
    run(detail.id, data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Category" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="NameEn"
          error={errors.nameEn?.message}
          {...register('nameEn')}
        />
        <Input
          label="SortOrder"
          type="number"
          error={errors.sortOrder?.message}
          {...register('sortOrder')}
        />
        <Controller
          control={control}
          name="state"
          render={({ field, fieldState }) => (
            <BaseSelect
              label="State"
              placeholder="Select state"
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
              value={field.value?.toString()}
              onChange={(val) => field.onChange(Number(val))}
              error={fieldState.error?.message}
              ref={field.ref}
            />
          )}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Edit Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};
