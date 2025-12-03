import React, { useState } from 'react';
import { Bell, Send, Users, Clock, CheckCircle } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
} from '../components/UIComponents.tsx';
import { MOCK_NOTIFICATIONS } from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { SystemNotification } from '../../types.ts';

export const NotificationCenter: React.FC = () => {
  const { data: notifications, add } =
    useMockData<SystemNotification>(MOCK_NOTIFICATIONS);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all',
    schedule: '',
  });

  const handleSend = () => {
    add({
      id: Date.now().toString(),
      ...formData,
      sentCount: 0,
      date: new Date().toLocaleDateString(),
      status: formData.schedule ? 'scheduled' : 'sent',
    } as SystemNotification);
    setFormData({ title: '', message: '', target: 'all', schedule: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Push messages to user devices and in-app inbox
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Area */}
        <div className="lg:col-span-1">
          <Card title="Compose Message" className="h-full">
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="e.g. Special Offer"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Message Content
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all dark:text-white placeholder-gray-400 min-h-[120px]"
                  placeholder="Enter your message here..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <Select
                label="Target Audience"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                options={[
                  { label: 'All Users', value: 'all' },
                  { label: 'VIP Members Only', value: 'vip' },
                  { label: 'Individual User (ID)', value: 'individual' },
                ]}
              />

              <Input
                label="Schedule (Optional)"
                type="datetime-local"
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
              />

              <Button
                className="w-full mt-4"
                onClick={handleSend}
                disabled={!formData.title || !formData.message}
              >
                <Send size={18} /> Send Notification
              </Button>
            </div>
          </Card>
        </div>

        {/* History List */}
        <div className="lg:col-span-2">
          <Card title="History">
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notif.target === 'all' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}
                  >
                    {notif.target === 'all' ? (
                      <Users size={20} />
                    ) : (
                      <Bell size={20} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {notif.title}
                      </h4>
                      <Badge color={notif.status === 'sent' ? 'green' : 'gray'}>
                        {notif.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {notif.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} /> {notif.sentCount} recipients
                      </span>
                      <span className="uppercase tracking-wider border border-gray-200 dark:border-white/10 px-1.5 py-0.5 rounded text-[10px]">
                        {notif.target}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
