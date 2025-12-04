import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequest } from 'ahooks';
import { Modal, Input, Select, Button, Switch } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { userApi, AdminCreateUser } from '@/api/adminUserApi';

const createAdminUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  realName: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string(),
  status: z.number(),
});

type CreateAdminUserFormInputs = z.infer<typeof createAdminUserSchema>;

interface CreateAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAdminUserModal: React.FC<CreateAdminUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const addToast = useToastStore((state) => state.addToast);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateAdminUserFormInputs>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      username: '',
      realName: '',
      password: '',
      role: 'viewer',
      status: 1,
    },
  });

  const { run: createUser, loading: isCreating } = useRequest(userApi.createAdminUser, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Admin user created successfully');
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: CreateAdminUserFormInputs) => {
    createUser(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Admin User"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Real Name"
          error={errors.realName?.message}
          {...register('realName')}
        />
        <Input
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Select
          label="Role"
          error={errors.role?.message}
          {...register('role')}
          options={[
            { label: 'Super Admin', value: 'super_admin' },
            { label: 'Operations', value: 'operations' },
            { label: 'Finance', value: 'finance' },
            { label: 'Viewer', value: 'viewer' },
          ]}
        />
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value === 1}
                onChange={(checked) => field.onChange(checked ? 1 : 0)}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
