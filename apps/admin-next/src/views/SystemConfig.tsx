'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Settings, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { systemConfigApi } from '@/api';
import type { SystemConfigItem } from '@/type/types';

/** 常见 key 的可读标签与说明 */
const CONFIG_META: Record<string, { label: string; description?: string }> = {
  exchange_rate_usd_php: {
    label: 'Exchange Rate (USD → PHP)',
    description: 'Used for balance display conversion',
  },
  exchange_rate_php_usd: {
    label: 'Exchange Rate (PHP → USD)',
    description: 'Reverse rate',
  },
  min_withdraw_amount: {
    label: 'Min Withdrawal Amount (PHP)',
    description: 'Minimum amount per withdrawal request',
  },
  max_withdraw_amount: {
    label: 'Max Withdrawal Amount (PHP)',
    description: 'Maximum amount per withdrawal request',
  },
  withdraw_fee_rate: {
    label: 'Withdrawal Fee Rate (%)',
    description: 'e.g. 0.02 = 2%',
  },
  platform_name: { label: 'Platform Name' },
  platform_email: { label: 'Support Email' },
  kyc_required: {
    label: 'KYC Required',
    description: '1 = required, 0 = optional',
  },
};

function ConfigRow({
  item,
  onSave,
}: {
  item: SystemConfigItem;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);
  const [saving, setSaving] = useState(false);
  const meta = CONFIG_META[item.key];

  const handleSave = async () => {
    if (draft === item.value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(item.key, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {meta?.label ?? item.key}
          </p>
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-mono">
            {item.key}
          </code>
        </div>
        {meta?.description && (
          <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSave();
                if (e.key === 'Escape') {
                  setDraft(item.value);
                  setEditing(false);
                }
              }}
              className="w-48 px-3 py-1.5 text-sm rounded-xl border border-teal-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
            </button>
            <button
              onClick={() => {
                setDraft(item.value);
                setEditing(false);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl min-w-24 text-right">
              {item.value}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Edit2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function SystemConfig() {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);

  const { loading, run: refresh } = useRequest(() => systemConfigApi.getAll(), {
    onSuccess: (data) => setConfigs(data.list),
  });

  const handleSave = async (key: string, value: string) => {
    await systemConfigApi.update(key, value);
    setConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Config"
        description="Platform-wide KV configuration — click any value to edit inline"
      />

      <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Settings size={16} className="text-teal-500" />
            {configs.length} config item{configs.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5">
          {loading && configs.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              Loading…
            </div>
          )}
          {!loading && configs.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              <Settings size={32} className="mx-auto mb-2 opacity-30" />
              No config items found
            </div>
          )}
          {configs.map((item) => (
            <ConfigRow key={item.key} item={item} onSave={handleSave} />
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 px-1">
        💡 Press{' '}
        <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">
          Enter
        </kbd>{' '}
        to save,{' '}
        <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">
          Esc
        </kbd>{' '}
        to cancel.
      </div>
    </div>
  );
}
