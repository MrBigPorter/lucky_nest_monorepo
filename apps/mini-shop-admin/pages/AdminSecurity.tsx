import React, { useState } from 'react';
import {
  Shield,
  UserCog,
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Key,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Modal,
  Badge,
  Select,
} from '../components/UIComponents';
import {
  MOCK_ADMIN_USERS,
  MOCK_ROLES,
  MOCK_OPERATION_LOGS,
} from '../constants';
import { useMockData } from '../hooks/useMockData';
import { AdminUser, Role, OperationLog } from '../types';

// --- SUB-COMPONENT: ADMIN USERS ---
const AdminUsers: React.FC = () => {
  const {
    data: users,
    add,
    update,
    remove,
  } = useMockData<AdminUser>(MOCK_ADMIN_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminUser>>({});

  const handleSave = () => {
    if (formData.id) {
      update(formData.id, formData);
    } else {
      add({
        ...formData,
        id: Date.now().toString(),
        status: 'active',
        lastLogin: 'Never',
      } as AdminUser);
    }
    setIsModalOpen(false);
  };

  const openModal = (user?: AdminUser) => {
    setFormData(user || { username: '', roleId: '2', roleName: 'Finance' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openModal()}>
          <Plus size={16} /> Add Admin
        </Button>
      </div>
      <Card>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase">
              <th className="pb-4 pl-4">Username</th>
              <th className="pb-4">Role</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Last Login</th>
              <th className="pb-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {users.map((u) => (
              <tr
                key={u.id}
                className="group hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="py-4 pl-4 font-medium text-gray-900 dark:text-white">
                  {u.username}
                </td>
                <td className="py-4">
                  <Badge color="blue">{u.roleName}</Badge>
                </td>
                <td className="py-4">
                  <Badge color={u.status === 'active' ? 'green' : 'red'}>
                    {u.status}
                  </Badge>
                </td>
                <td className="py-4 text-sm text-gray-500">{u.lastLogin}</td>
                <td className="py-4 text-right pr-6 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openModal(u)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => remove(u.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" title="Reset Password">
                    <Key size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Admin User"
      >
        <div className="space-y-4">
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          {!formData.id && <Input label="Initial Password" type="password" />}
          <Select
            label="Role"
            value={formData.roleId}
            onChange={(e) => {
              const role = MOCK_ROLES.find((r) => r.id === e.target.value);
              setFormData({
                ...formData,
                roleId: e.target.value,
                roleName: role?.name || '',
              });
            }}
            options={MOCK_ROLES.map((r) => ({ label: r.name, value: r.id }))}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- SUB-COMPONENT: ROLES & PERMISSIONS ---
const RoleMatrix: React.FC = () => {
  const { data: roles } = useMockData<Role>(MOCK_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);

  const PERMISSION_GROUPS = {
    'User Management': ['user.read', 'user.write', 'user.ban', 'user.kyc'],
    Finance: [
      'finance.read',
      'finance.deposit',
      'finance.withdraw_audit',
      'finance.report',
    ],
    Product: [
      'product.read',
      'product.create',
      'product.edit',
      'product.delete',
    ],
    System: ['system.config', 'admin.manage', 'logs.read'],
  };

  const togglePermission = (perm: string) => {
    // Mock implementation for visual feedback
    const has =
      selectedRole.permissions.includes(perm) ||
      selectedRole.permissions.includes('*.*');
    if (has) {
      // Remove logic would go here
    } else {
      // Add logic would go here
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      {/* Role List */}
      <div className="w-full md:w-1/4 space-y-2">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRole.id === role.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <div className="font-bold">{role.name}</div>
            <div className="text-xs opacity-70 mt-1">{role.description}</div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-4">
          <Plus size={16} /> New Role
        </Button>
      </div>

      {/* Permission Matrix */}
      <Card className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedRole.name} Permissions
            </h3>
            <p className="text-sm text-gray-500">
              Configure access rights for this role
            </p>
          </div>
          <Button>Save Changes</Button>
        </div>

        <div className="space-y-8">
          {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
            <div key={group}>
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-l-4 border-primary-500 pl-3">
                {group}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((perm) => {
                  const isChecked =
                    selectedRole.permissions.includes(perm) ||
                    selectedRole.permissions.includes('*.*');
                  return (
                    <div
                      key={perm}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30' : 'border-gray-100 dark:border-white/5'}`}
                      onClick={() => togglePermission(perm)}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} className="text-green-500" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                      <span
                        className={`text-sm ${isChecked ? 'font-medium text-green-700 dark:text-green-400' : 'text-gray-500'}`}
                      >
                        {perm}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: AUDIT LOGS ---
const AuditLogs: React.FC = () => {
  const { data: logs } = useMockData<OperationLog>(MOCK_OPERATION_LOGS);

  return (
    <Card>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase">
            <th className="pb-4 pl-4">Time</th>
            <th className="pb-4">Admin</th>
            <th className="pb-4">Action</th>
            <th className="pb-4">Target</th>
            <th className="pb-4">IP Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
              <td className="py-3 pl-4 text-sm text-gray-500">{log.date}</td>
              <td className="py-3 font-medium text-gray-900 dark:text-white">
                {log.adminName}
              </td>
              <td className="py-3 text-sm text-gray-800 dark:text-gray-200">
                {log.action}
              </td>
              <td className="py-3 text-xs font-mono text-gray-500">
                {log.target}
              </td>
              <td className="py-3 text-xs text-gray-400">{log.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export const AdminSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admins' | 'roles' | 'logs'>(
    'admins',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin & Security
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage staff access, roles, and audit trails
        </p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-white/10">
        {[
          { id: 'admins', label: 'Admin Users', icon: <UserCog size={16} /> },
          {
            id: 'roles',
            label: 'Roles & Permissions',
            icon: <Shield size={16} />,
          },
          { id: 'logs', label: 'Audit Logs', icon: <FileText size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'admins' && <AdminUsers />}
        {activeTab === 'roles' && <RoleMatrix />}
        {activeTab === 'logs' && <AuditLogs />}
      </div>
    </div>
  );
};
