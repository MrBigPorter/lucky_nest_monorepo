import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequest } from 'ahooks';
import { Modal, Input, Select, Button, Switch } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { userApi, AdminUpdateUser } from '@/api/adminUserApi';
import { AdminUser } from '@/types';

const editAdminUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  realName: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.string(),
  status: z.number(),
});

type EditAdminUserFormInputs = z.infer<typeof editAdminUserSchema>;

interface EditAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: AdminUser | null;
  onSuccess: () => void;
}

export const EditAdminUserModal: React.FC<EditAdminUserModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  onSuccess,
}) => {
  const addToast = useToastStore((state) => state.addToast);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditAdminUserFormInputs>({
    resolver: zodResolver(editAdminUserSchema),
  });

  const { run: updateUser, loading: isUpdating } = useRequest(userApi.updateUser, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Admin user updated successfully');
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen && editingUser) {
      reset({
        username: editingUser.username,
        realName: editingUser.realName || '',
        role: editingUser.role,
        status: editingUser.status,
        password: '', // 密码字段总是为空，以防意外提交
      });
    }
  }, [isOpen, editingUser, reset]);

  const onSubmit = (data: EditAdminUserFormInputs) => {
    if (editingUser) {
      const updateData: AdminUpdateUser = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateUser(editingUser.id, updateData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Admin User: ${editingUser?.username}`}
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
          label="Password (leave blank to keep unchanged)"
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
          <Button type="submit" isLoading={isUpdating}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
