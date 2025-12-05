import React, { useState } from 'react';
import {
  Ban,
  CheckCircle,
  Edit3,
  User as UserIcon,
  Key,
  Plus,
} from 'lucide-react';
import { Card, Button, Badge, Input, Select } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { AdminUser } from '@/types';
import { userApi } from '@/api';
import { useAntdTable } from 'ahooks';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CreateAdminUserModal } from '@/pages/admin/CreateAdminUserModal.tsx';
import { EditAdminUserModal } from '@/pages/admin/EditAdminUserModal.tsx';
import { EditAdminPasswordModal } from '@/pages/admin/EditAdminPassowordModal.tsx';

type AdminUserSearchForm = {
  username?: string;
  realName?: string;
  role?: string;
  status?: string;
};

type AdminUserListParams = {
  page: number;
  pageSize: number;
  username?: string;
  realName?: string;
  role?: string;
  status?: string | number;
};

/**
 * 表格数据请求：适配后端返回结构
 * GET /api/v1/admin/user/list?page=1&pageSize=10&username=...&realName=...&role=...&status=...
 */
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

  // 列表筛选条件（只保存在本地，由我们手动调用 submit 触发 useAntdTable）
  const [filters, setFilters] = useState<AdminUserSearchForm>({
    username: '',
    realName: '',
    role: 'ALL',
    status: 'ALL',
  });

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
  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  const total = pagination.total ?? 0;
  const totalPage = Math.max(1, Math.ceil(total / pageSize));

  const dataSource = (tableProps.dataSource || []) as AdminUser[];

  // -------------------- 列表操作 --------------------

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      const newStatus = admin.status === 1 ? 0 : 1;
      // await userApi.updateAdminStatus(admin.id, newStatus);
      addToast(
        'success',
        `Admin ${admin.username} ${
          newStatus === 1 ? 'activated' : 'disabled'
        }.`,
      );
      refresh();
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to update status.');
    }
  };

  const handleOpenResetPwd = (admin: AdminUser) => {
    setResetPwdAdmin(admin);
    setIsResetPwdModalOpen(true);
  };
  // 提交筛选
  const handleSearch = () => {
    run(
      { current: 1, pageSize },
      {
        username: filters?.username?.trim() ?? '',
        realName: filters?.realName?.trim() ?? '',
        role: filters.role ?? '',
        status: filters.status ?? '',
      },
    );
  };

  // 重置筛选
  const handleResetFilters = () => {
    const initial = {
      username: '',
      realName: '',
      role: 'ALL',
      status: 'ALL',
    };
    setFilters(initial);
    reset();
  };

  // -------------------- TanStack Table 列定义 --------------------

  const columnHelper = createColumnHelper<AdminUser>();

  const columns = [
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
            <UserIcon size={14} className="text-gray-500 dark:text-gray-400" />
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

  const table = useReactTable({
    data: dataSource,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // -------------------- Render --------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage system administrators and permissions
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Add New Admin
        </Button>
      </div>

      <Card>
        {/* Filter Bar */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Username"
              placeholder="Search username"
              value={filters.username}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, username: e.target.value }))
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <Input
              label="Real Name"
              placeholder="Search real name"
              value={filters.realName}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, realName: e.target.value }))
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <Select
              label="Role"
              value={filters.role}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, role: e.target.value }))
              }
              options={[
                { label: 'All Roles', value: 'ALL' },
                { label: 'Viewer', value: 'VIEWER' },
                { label: 'Editor', value: 'EDITOR' },
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Super Admin', value: 'SUPER_ADMIN' },
              ]}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              options={[
                { label: 'All Status', value: 'ALL' },
                { label: 'Active', value: '1' },
                { label: 'Disabled', value: '0' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
          <table className="w-full text-left">
            <thead className="bg-gray-50/60 dark:bg-white/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-black/20">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {dataSource.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-8 text-center text-gray-500"
                  >
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div>
            Total{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {total}
            </span>{' '}
            items
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange?.(current - 1, pageSize)}
              disabled={current <= 1}
            >
              Previous
            </Button>
            <span>
              Page{' '}
              <span className="font-semibold">
                {current} / {totalPage}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onChange?.(current + 1, pageSize)}
              disabled={current >= totalPage}
            >
              Next
            </Button>
          </div>
        </div>
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
