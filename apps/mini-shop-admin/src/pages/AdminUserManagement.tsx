import React, { useCallback, useMemo, useState } from 'react';
import { Ban, CheckCircle, Edit3, User as UserIcon, Key } from 'lucide-react';
import { Card, Badge } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { AdminUser } from '@/type/types.ts';
import { userApi } from '@/api';
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { CreateAdminUserModal } from '@/pages/admin/CreateAdminUserModal.tsx';
import { EditAdminUserModal } from '@/pages/admin/EditAdminUserModal.tsx';
import { EditAdminPasswordModal } from '@/pages/admin/EditAdminPassowordModal.tsx';
import { Button } from '@repo/ui';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';

type AdminUserSearchForm = {
  username: string;
  realName: string;
  role: string;
  status: string;
};

type AdminUserListParams = {
  page: number;
  pageSize: number;
  username?: string;
  realName?: string;
  role?: string;
  status?: string | number;
};

const getAdminUserTableData = async (
  { current, pageSize }: { current: number; pageSize: number },
  formData: {
    username?: string;
    realName?: string;
    role?: string;
    status?: string | number;
  },
) => {
  const params: AdminUserListParams = {
    page: current,
    pageSize,
  };

  if (formData?.username) params.username = formData.username;
  if (formData?.realName) params.realName = formData.realName;
  if (formData?.role && formData.role !== 'ALL') params.role = formData.role;
  if (
    formData?.status !== undefined &&
    formData.status !== '' &&
    formData.status !== 'ALL'
  ) {
    params.status = formData.status;
  }

  const data = await userApi.getUsers(params);

  const items: AdminUser[] = data.list ?? [];
  const total: number = data.total ?? 0;

  return {
    list: items,
    total,
  };
};

export const AdminUserManagement: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [resetPwdAdmin, setResetPwdAdmin] = useState<AdminUser | null>(null);

  // useAntdTable 只负责「请求 + 分页」
  const {
    tableProps,
    run,
    refresh,
    search: { reset },
  } = useAntdTable(getAdminUserTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        username: '',
        realName: '',
        role: 'ALL',
        status: 'ALL',
      },
    ],
  });

  const pagination = tableProps.pagination || {};
  const pageSize = pagination.pageSize ?? 10;
  const total = pagination.total ?? 0;
  Math.max(1, Math.ceil(total / pageSize));
  const dataSource = (tableProps.dataSource || []) as AdminUser[];

  // -------------------- 列表操作 --------------------

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setIsEditModalOpen(true);
  };

  const { run: updateUser, loading: isUpdating } = useRequest(
    userApi.updateUser,
    {
      manual: true,
      onSuccess: (data) => {
        addToast(
          'success',
          `Admin ${data.username} ${
            data.status === 1 ? 'activated' : 'disabled'
          }.`,
        );
        refresh();
      },
    },
  );
  const handleToggleStatus = useCallback(
    async (admin: AdminUser) => {
      const newStatus = admin.status === 1 ? 0 : 1;
      updateUser(admin.id, { status: newStatus });
    },
    [updateUser],
  );

  const handleOpenResetPwd = (admin: AdminUser) => {
    setResetPwdAdmin(admin);
    setIsResetPwdModalOpen(true);
  };
  // 搜索回调：直接拿到所有值
  const handleSearch = (values: AdminUserSearchForm) => {
    // 自动重置到第一页，并带上所有条件
    run({ current: 1, pageSize: 10 }, values);
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<AdminUser>();

    return [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500">
            {info.getValue().substring(0, 8)}...
          </span>
        ),
      }),
      columnHelper.accessor('username', {
        header: 'Username',
        cell: (info) => (
          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
            <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-full">
              <UserIcon
                size={14}
                className="text-gray-500 dark:text-gray-400"
              />
            </div>
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('realName', {
        header: 'Real Name',
        cell: (info) => (
          <span className="text-gray-600 dark:text-gray-400">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
          const role = info.getValue();
          let color: 'gray' | 'purple' | 'blue' | 'green' = 'gray';
          if (role === 'SUPER_ADMIN') color = 'purple';
          else if (role === 'ADMIN') color = 'blue';
          else if (role === 'EDITOR') color = 'green';

          return <Badge color={color}>{role}</Badge>;
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge color={info.getValue() === 1 ? 'green' : 'red'}>
            {info.getValue() === 1 ? 'Active' : 'Disabled'}
          </Badge>
        ),
      }),
      columnHelper.accessor('lastLoginAt', {
        header: 'Last Login',
        cell: (info) => (
          <div className="text-xs text-gray-500">
            <div>
              {info.getValue()
                ? new Date(Number(info.getValue())).toLocaleString()
                : 'Never'}
            </div>
            {info.row.original.lastLoginIp && (
              <div className="font-mono mt-0.5 opacity-75">
                {info.row.original.lastLoginIp}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(info.row.original)}
              title="Edit"
            >
              <Edit3 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenResetPwd(info.row.original)}
              title="Reset Password"
            >
              <Key size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              isLoading={isUpdating}
              className={
                info.row.original.status === 1
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-green-500 hover:text-green-600'
              }
              onClick={() => handleToggleStatus(info.row.original)}
              title={info.row.original.status === 1 ? 'Disable' : 'Activate'}
            >
              {info.row.original.status === 1 ? (
                <Ban size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
            </Button>
          </div>
        ),
      }),
    ];
  }, [handleToggleStatus, isUpdating]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage system administrators and their roles"
        buttonText="Add New Admin"
        buttonOnClick={handleCreate}
      />

      <Card>
        <div className="space-y-3 mb-6">
          <SchemaSearchForm<AdminUserSearchForm>
            schema={[
              {
                type: 'input',
                key: 'username',
                label: 'Username',
                placeholder: 'Search username...',
              },
              {
                type: 'input',
                key: 'realName',
                label: 'Real Name',
                placeholder: 'Search real name...',
              },
              {
                type: 'select',
                key: 'role',
                label: 'Role',
                defaultValue: 'ALL', // 支持默认值
                options: [
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'Viewer', value: 'VIEWER' },
                  { label: 'Editor', value: 'EDITOR' },
                  { label: 'Admin', value: 'ADMIN' },
                  { label: 'Super Admin', value: 'SUPER_ADMIN' },
                ],
              },
              {
                type: 'select',
                key: 'status',
                label: 'Status',
                defaultValue: 'ALL', // 支持默认值
                options: [
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Active', value: '1' },
                  { label: 'Disabled', value: '0' },
                ],
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>
        <BaseTable
          data={dataSource}
          rowKey="id"
          columns={columns}
          pagination={{
            ...tableProps.pagination,
            onChange: (page, pageSize) => {
              tableProps.onChange?.(page, pageSize);
            },
          }}
        />
      </Card>

      <CreateAdminUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refresh}
      />
      <EditAdminUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingUser={editingAdmin}
        onSuccess={refresh}
      />

      <EditAdminPasswordModal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        onSuccess={refresh}
        editingUser={resetPwdAdmin}
      />
    </div>
  );
};
