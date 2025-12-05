import { z } from 'zod';
import { Modal, Input, Button } from '@/components/UIComponents.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore.ts';
import React, { useEffect } from 'react';
import { useRequest } from 'ahooks';
import { categoryApi } from '@/api';

const createCategorySchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters'),
  nameEn: z
    .string()
    .min(3, 'Category name must be at least 3 characters')
    .optional()
    .or(z.literal('')),
  sortOrder: z.coerce.number().optional(),
});

type createCategoryFormInput = z.infer<typeof createCategorySchema>;

interface createCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCategoryModal: React.FC<createCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const addToast = useToastStore((state) => state.addToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<createCategoryFormInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      nameEn: '',
      sortOrder: 0,
    },
  });

  const { run, loading } = useRequest(categoryApi.createCategory, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'category created successfully');
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: createCategoryFormInput) => {
    run(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Category"
      size="lg"
    >
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

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={loading}>
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};
