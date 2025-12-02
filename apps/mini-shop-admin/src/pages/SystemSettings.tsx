import React, { useState } from 'react';
import {
  Settings,
  Image as ImageIcon,
  Save,
  Upload,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Switch,
  Select,
} from '../components/UIComponents.tsx';
import { MOCK_BANNERS } from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { Banner } from '../../types.ts';

export const SystemSettings: React.FC = () => {
  const { data: banners, add, remove } = useMockData<Banner>(MOCK_BANNERS);
  const [config, setConfig] = useState({
    siteName: 'LuxeAdmin Pro',
    maintenanceMode: false,
    minWithdraw: 100,
    maxWithdraw: 10000,
    kycRequired: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        System Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Config */}
        <Card title="Global Configuration">
          <div className="space-y-5">
            <Input
              label="Site Name"
              value={config.siteName}
              onChange={(e) =>
                setConfig({ ...config, siteName: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Withdraw"
                type="number"
                value={config.minWithdraw}
                onChange={(e) =>
                  setConfig({ ...config, minWithdraw: Number(e.target.value) })
                }
              />
              <Input
                label="Max Withdraw"
                type="number"
                value={config.maxWithdraw}
                onChange={(e) =>
                  setConfig({ ...config, maxWithdraw: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Maintenance Mode
              </span>
              <Switch
                checked={config.maintenanceMode}
                onChange={(c) => setConfig({ ...config, maintenanceMode: c })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Force KYC for Withdrawals
              </span>
              <Switch
                checked={config.kycRequired}
                onChange={(c) => setConfig({ ...config, kycRequired: c })}
              />
            </div>

            <Button className="w-full mt-4">
              <Save size={18} /> Save Configurations
            </Button>
          </div>
        </Card>

        {/* Banner Management */}
        <Card
          title="Banner Management"
          action={
            <Button size="sm" variant="outline">
              <Upload size={14} /> Upload
            </Button>
          }
        >
          <div className="space-y-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10"
              >
                <img
                  src={banner.image}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="text-white font-bold">{banner.title}</div>
                  <div className="text-xs text-white/80 capitalize">
                    {banner.position} Banner
                  </div>
                  <button
                    onClick={() => remove(banner.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl aspect-[3/1] flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 transition-colors cursor-pointer">
              <PlusCircle size={24} className="mb-2" />
              <span className="text-sm">Add New Banner</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
