import React, { useState, useContext } from 'react';
import { Users, Timer, ChevronRight, PlayCircle, XCircle } from 'lucide-react';
import { Card, Button, Badge, Modal, Input } from '../components/UIComponents.tsx';
import { MOCK_GROUPS, TRANSLATIONS } from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { AppContext } from '../../App.tsx';
import { TreasureGroup } from '../../types.ts';

export const GroupManagement: React.FC = () => {
  const { lang } = useContext(AppContext);
  const t = TRANSLATIONS[lang];
  const { data: groups, update } = useMockData<TreasureGroup>(MOCK_GROUPS);

  const [selectedGroup, setSelectedGroup] = useState<TreasureGroup | null>(
    null,
  );

  const handleStatusChange = (id: string, status: 'completed' | 'failed') => {
    update(id, { status });
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage > 50) return 'bg-primary-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Group Buying
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage open groups and team status
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-lg text-sm text-gray-500 shadow-sm border border-gray-100 dark:border-white/5">
            Active:{' '}
            <strong className="text-gray-900 dark:text-white">
              {groups.filter((g) => g.status === 'active').length}
            </strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="relative overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={group.creator.avatar}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-800 shadow-sm"
                />
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    {group.creator.name}'s Team
                  </div>
                  <div className="text-xs text-gray-500">ID: {group.id}</div>
                </div>
              </div>
              <Badge
                color={
                  group.status === 'active'
                    ? 'blue'
                    : group.status === 'completed'
                      ? 'green'
                      : 'red'
                }
              >
                {group.status.toUpperCase()}
              </Badge>
            </div>

            <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-3 mb-4 flex items-center gap-3">
              <img
                src={group.product.image}
                className="w-12 h-12 rounded bg-white"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate text-gray-900 dark:text-white">
                  {group.product.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Timer size={10} /> Expires: {group.expiresAt.split(' ')[1]}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>
                  {group.currentSize} / {group.targetSize} Members
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(group.currentSize, group.targetSize)}`}
                  style={{
                    width: `${Math.min((group.currentSize / group.targetSize) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {group.status === 'active' && (
              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleStatusChange(group.id, 'failed')}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-500/10 border-green-200 dark:border-green-500/20"
                  onClick={() => handleStatusChange(group.id, 'completed')}
                >
                  Complete
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
