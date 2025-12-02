import React, { useState } from 'react';
import { Crown, Edit2, Plus, Check } from 'lucide-react';
import { Card, Button, Input, Modal } from '../components/UIComponents.tsx';
import { MOCK_VIP_TIERS } from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { VipTier } from '../../types.ts';

export const VipConfig: React.FC = () => {
  const { data: tiers, update } = useMockData<VipTier>(MOCK_VIP_TIERS);
  const [editingTier, setEditingTier] = useState<VipTier | null>(null);

  const handleSave = () => {
    if (editingTier) {
      update(editingTier.level.toString(), editingTier); // Mocking update logic
      setEditingTier(null);
    }
  };

  const updateBenefit = (index: number, value: string) => {
    if (!editingTier) return;
    const newBenefits = [...editingTier.benefits];
    newBenefits[index] = value;
    setEditingTier({ ...editingTier, benefits: newBenefits });
  };

  const addBenefit = () => {
    if (!editingTier) return;
    setEditingTier({
      ...editingTier,
      benefits: [...editingTier.benefits, 'New Benefit'],
    });
  };

  const removeBenefit = (index: number) => {
    if (!editingTier) return;
    setEditingTier({
      ...editingTier,
      benefits: editingTier.benefits.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          VIP System Configuration
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Define thresholds and privileges for user loyalty tiers
        </p>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-6 custom-scrollbar snap-x">
        {tiers.map((tier) => (
          <div key={tier.level} className="min-w-[300px] snap-center">
            <div
              className={`h-full rounded-2xl p-6 relative overflow-hidden flex flex-col ${tier.color} bg-opacity-20 dark:bg-opacity-10 border-2 border-transparent hover:border-primary-500/50 transition-all group`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown size={100} />
              </div>

              <div className="relative z-10 flex justify-between items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${tier.color.replace('bg-', 'bg-').replace('10', '500')}`}
                >
                  <span className="font-bold text-xl">{tier.level}</span>
                </div>
                <button
                  onClick={() => setEditingTier(tier)}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-gray-700 dark:text-white transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {tier.name}
              </h3>
              <p className="text-sm font-medium opacity-60 mb-6">
                Threshold: ${tier.threshold.toLocaleString()}
              </p>

              <div className="space-y-2 mt-auto">
                {tier.benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200"
                  >
                    <Check size={14} className="text-green-500" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!editingTier}
        onClose={() => setEditingTier(null)}
        title={`Edit VIP ${editingTier?.level} - ${editingTier?.name}`}
      >
        {editingTier && (
          <div className="space-y-4">
            <Input
              label="Tier Name"
              value={editingTier.name}
              onChange={(e) =>
                setEditingTier({ ...editingTier, name: e.target.value })
              }
            />
            <Input
              label="Threshold Amount ($)"
              type="number"
              value={editingTier.threshold}
              onChange={(e) =>
                setEditingTier({
                  ...editingTier,
                  threshold: Number(e.target.value),
                })
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Benefits
              </label>
              <div className="space-y-2">
                {editingTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                    />
                    <button
                      onClick={() => removeBenefit(index)}
                      className="text-red-500 hover:text-red-600 px-2"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addBenefit}
                  className="w-full mt-2"
                >
                  <Plus size={14} /> Add Benefit
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
              <Button variant="ghost" onClick={() => setEditingTier(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
