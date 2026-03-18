'use client';

import React, { useState } from 'react';
import { useRequest } from 'ahooks';

import {
  Sparkles,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Save,
  Gift,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import type {
  LuckyDrawActivity,
  LuckyDrawPrize,
  LuckyDrawPrizeType,
  LuckyDrawResult,
  CreateLuckyDrawActivityPayload,
  CreateLuckyDrawPrizePayload,
  QueryLuckyDrawResultsParams,
} from '@/type/types';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { luckyDrawApi } from '@/api';
import { PageHeader } from '@/components/scaffold/PageHeader';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIZE_TYPE_LABELS: Record<LuckyDrawPrizeType, string> = {
  1: 'Coupon',
  2: 'Coins',
  3: 'Cash',
  4: 'No Prize',
};

const PRIZE_TYPE_COLORS: Record<LuckyDrawPrizeType, string> = {
  1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  3: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  4: 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

// ─── Activity Modal ───────────────────────────────────────────────────────────

const activitySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  treasureId: z.string(),
  status: z.number(),
  startAt: z.string(),
  endAt: z.string(),
});
type ActivityForm = z.infer<typeof activitySchema>;

function ActivityModal({
  activity,
  onClose,
  onSaved,
}: {
  activity: LuckyDrawActivity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!activity;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityForm>({
    defaultValues: {
      title: activity?.title ?? '',
      description: activity?.description ?? '',
      treasureId: activity?.treasureId ?? '',
      status: activity?.status ?? 1,
      startAt: activity?.startAt
        ? format(new Date(activity.startAt), "yyyy-MM-dd'T'HH:mm")
        : '',
      endAt: activity?.endAt
        ? format(new Date(activity.endAt), "yyyy-MM-dd'T'HH:mm")
        : '',
    },
  });

  const onSubmit = async (values: ActivityForm) => {
    setSaving(true);
    try {
      const payload: CreateLuckyDrawActivityPayload = {
        title: values.title,
        description: values.description || undefined,
        treasureId: values.treasureId || undefined,
        status: values.status,
        startAt: values.startAt || undefined,
        endAt: values.endAt || undefined,
      };
      if (isEdit) {
        await luckyDrawApi.updateActivity(activity.id, payload);
      } else {
        await luckyDrawApi.createActivity(payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Activity' : 'New Activity'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Title *</label>
            <input
              {...register('title')}
              placeholder="e.g. Spring Lucky Draw"
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            {errors.title && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Treasure ID{' '}
              <span className="text-gray-400">
                (leave empty = all products)
              </span>
            </label>
            <input
              {...register('treasureId')}
              placeholder="treasure_xxx"
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Start Time</label>
              <input
                type="datetime-local"
                {...register('startAt')}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">End Time</label>
              <input
                type="datetime-local"
                {...register('endAt')}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <select
              {...register('status', { valueAsNumber: true })}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Prize Modal ──────────────────────────────────────────────────────────────

const prizeSchema = z.object({
  prizeType: z.number().min(1).max(4),
  prizeName: z.string().min(1),
  couponId: z.string(),
  prizeValue: z.string(),
  probability: z.string().min(1),
  stock: z.string(),
  sortOrder: z.string(),
});
type PrizeForm = z.infer<typeof prizeSchema>;

function PrizeModal({
  activityId,
  prize,
  onClose,
  onSaved,
}: {
  activityId: string;
  prize: LuckyDrawPrize | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!prize;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PrizeForm>({
    defaultValues: {
      prizeType: prize?.prizeType ?? 4,
      prizeName: prize?.prizeName ?? '',
      couponId: prize?.couponId ?? '',
      prizeValue: prize?.prizeValue != null ? String(prize.prizeValue) : '',
      probability: prize?.probability != null ? String(prize.probability) : '',
      stock: prize?.stock != null ? String(prize.stock) : '-1',
      sortOrder: prize?.sortOrder != null ? String(prize.sortOrder) : '0',
    },
  });

  const prizeType = watch('prizeType');

  const onSubmit = async (values: PrizeForm) => {
    setSaving(true);
    try {
      const payload: CreateLuckyDrawPrizePayload = {
        activityId,
        prizeType: Number(values.prizeType) as LuckyDrawPrizeType,
        prizeName: values.prizeName,
        couponId: values.couponId || undefined,
        prizeValue: values.prizeValue ? Number(values.prizeValue) : undefined,
        probability: Number(values.probability),
        stock: values.stock !== '' ? Number(values.stock) : -1,
        sortOrder: values.sortOrder !== '' ? Number(values.sortOrder) : 0,
      };
      if (isEdit) {
        await luckyDrawApi.updatePrize(prize.id, payload);
      } else {
        await luckyDrawApi.createPrize(payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Prize' : 'Add Prize'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Prize Type *</label>
            <select
              {...register('prizeType', { valueAsNumber: true })}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value={1}>1 — Coupon</option>
              <option value={2}>2 — Coins</option>
              <option value={3}>3 — Cash Balance</option>
              <option value={4}>4 — No Prize (Thanks)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Prize Name *</label>
            <input
              {...register('prizeName')}
              placeholder="e.g. $5 Coupon"
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            {errors.prizeName && (
              <p className="text-xs text-red-500">Required</p>
            )}
          </div>
          {Number(prizeType) === 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Coupon ID *</label>
              <input
                {...register('couponId')}
                placeholder="coupon_xxx"
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          )}
          {(Number(prizeType) === 2 || Number(prizeType) === 3) && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Amount *{' '}
                <span className="text-gray-400">
                  {Number(prizeType) === 2 ? '(coins)' : '(USD)'}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('prizeValue')}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Probability * <span className="text-gray-400">(0-100)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('probability')}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              {errors.probability && (
                <p className="text-xs text-red-500">Required</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Stock <span className="text-gray-400">(-1 = unlimited)</span>
              </label>
              <input
                type="number"
                min="-1"
                {...register('stock')}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sort Order</label>
            <input
              type="number"
              min="0"
              {...register('sortOrder')}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {isEdit ? 'Save' : 'Add Prize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Prizes Panel ─────────────────────────────────────────────────────────────

function PrizesPanel({
  activity,
  onBack,
}: {
  activity: LuckyDrawActivity;
  onBack: () => void;
}) {
  const [prizeModal, setPrizeModal] = useState<LuckyDrawPrize | null | false>(
    false,
  );

  const { data, loading, refresh } = useRequest(
    () => luckyDrawApi.listPrizes(activity.id),
    { refreshDeps: [activity.id] },
  );

  const prizes = data?.list ?? [];
  const totalProbability = prizes.reduce((s, p) => s + p.probability, 0);

  const handleDelete = async (prizeId: string) => {
    if (!confirm('Delete this prize?')) return;
    await luckyDrawApi.deletePrize(prizeId);
    refresh();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            ←
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {activity.title}
            </p>
            <p className="text-xs text-gray-400">
              Prize pool — total probability:{' '}
              <span
                className={
                  totalProbability === 100
                    ? 'text-green-500 font-medium'
                    : 'text-orange-500 font-medium'
                }
              >
                {totalProbability}%
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setPrizeModal(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors"
          >
            <Plus size={13} />
            Add Prize
          </button>
        </div>
      </div>

      {loading && prizes.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={18} className="animate-spin mr-2" />
          Loading…
        </div>
      ) : prizes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <Gift size={32} className="opacity-30" />
          <p className="text-sm">No prizes configured yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prizes.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIZE_TYPE_COLORS[p.prizeType]}`}
                >
                  {PRIZE_TYPE_LABELS[p.prizeType]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {p.prizeName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.probability}% probability ·{' '}
                    {p.stock === -1 ? '∞ stock' : `${p.stock} left`}
                    {p.prizeValue != null &&
                      ` · ${p.prizeType === 2 ? `${p.prizeValue} coins` : `$${p.prizeValue}`}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPrizeModal(p)}
                  className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => void handleDelete(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {prizeModal !== false && (
        <PrizeModal
          activityId={activity.id}
          prize={prizeModal}
          onClose={() => setPrizeModal(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel() {
  const [params, setParams] = useState<QueryLuckyDrawResultsParams>({
    page: 1,
    pageSize: 20,
  });

  const { data, loading, refresh } = useRequest(
    () => luckyDrawApi.listResults(params),
    { refreshDeps: [params] },
  );

  const results: LuckyDrawResult[] = data?.list ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Draw Results{' '}
          <span className="text-gray-400 font-normal">({total})</span>
        </h3>
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/8 text-xs text-gray-400 uppercase">
              <th className="pb-2 text-left font-medium">Time</th>
              <th className="pb-2 text-left font-medium">User</th>
              <th className="pb-2 text-left font-medium">Activity</th>
              <th className="pb-2 text-left font-medium">Prize</th>
              <th className="pb-2 text-left font-medium">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {results.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 text-xs text-gray-400">
                  {format(new Date(r.createdAt), 'MM/dd HH:mm')}
                </td>
                <td className="py-2.5">
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {r.userNickname ?? r.userId.slice(0, 8)}
                  </span>
                </td>
                <td className="py-2.5 text-xs text-gray-500 truncate max-w-[120px]">
                  {r.activityTitle ?? r.activityId.slice(0, 8)}
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${PRIZE_TYPE_COLORS[r.prizeType]}`}
                  >
                    {r.prizeName}
                  </span>
                </td>
                <td className="py-2.5 text-xs text-gray-400 font-mono">
                  {r.orderId.slice(0, 8)}…
                </td>
              </tr>
            ))}
            {!loading && results.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-sm text-gray-400"
                >
                  No draw results yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total > params.pageSize! && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={params.page === 1}
            onClick={() =>
              setParams((p: QueryLuckyDrawResultsParams) => ({
                ...p,
                page: (p.page ?? 1) - 1,
              }))
            }
            className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-xs text-gray-500">
            {params.page} / {Math.ceil(total / params.pageSize!)}
          </span>
          <button
            disabled={
              (params.page ?? 1) >= Math.ceil(total / params.pageSize!)
            }
            onClick={() =>
              setParams((p: QueryLuckyDrawResultsParams) => ({
                ...p,
                page: (p.page ?? 1) + 1,
              }))
            }
            className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'activities' | 'results';

export function LuckyDrawManagement() {
  const [tab, setTab] = useState<Tab>('activities');
  const [activityModal, setActivityModal] = useState<
    LuckyDrawActivity | null | false
  >(false);
  const [selectedActivity, setSelectedActivity] =
    useState<LuckyDrawActivity | null>(null);

  const { data, loading, refresh } = useRequest(luckyDrawApi.listActivities);
  const activities: LuckyDrawActivity[] = data?.list ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity and all its prizes?')) return;
    await luckyDrawApi.deleteActivity(id);
    if (selectedActivity?.id === id) setSelectedActivity(null);
    refresh();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Lucky Draw"
        description="Manage lucky draw activities and prize pools"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-white/5 rounded-xl p-1 w-fit">
        {(['activities', 'results'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedActivity(null);
            }}
            className={`px-4 py-1.5 text-sm rounded-lg capitalize transition-colors font-medium ${
              tab === t
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t === 'activities' ? (
              <span className="flex items-center gap-1.5">
                <Gift size={13} />
                Activities
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Trophy size={13} />
                Results
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'results' ? (
        <ResultsPanel />
      ) : selectedActivity ? (
        <PrizesPanel
          activity={selectedActivity}
          onBack={() => setSelectedActivity(null)}
        />
      ) : (
        <>
          {/* Activity list toolbar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <RefreshCw
                  size={14}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
              <button
                onClick={() => setActivityModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors"
              >
                <Plus size={13} />
                New Activity
              </button>
            </div>
          </div>

          {/* Activity list */}
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw size={18} className="animate-spin mr-2" />
              Loading…
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Sparkles size={32} className="opacity-30" />
              <p className="text-sm">No activities yet</p>
              <button
                onClick={() => setActivityModal(null)}
                className="mt-2 px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors"
              >
                Create First Activity
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="relative flex flex-col p-4 rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-gray-900/50 shadow-xs hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => setSelectedActivity(a)}
                >
                  {/* Status badge */}
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      a.status === 1
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    {a.status === 1 ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex items-center gap-2 mb-2 pr-16">
                    <Sparkles size={15} className="text-teal-500 shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {a.title}
                    </p>
                  </div>
                  {a.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {a.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-auto text-xs text-gray-400">
                    <span>{a.prizes.length} prizes</span>
                    {a.treasureName && (
                      <span className="truncate">· {a.treasureName}</span>
                    )}
                    {a.startAt && (
                      <span>
                        · {format(new Date(a.startAt), 'MMM dd')}
                        {a.endAt && ` – ${format(new Date(a.endAt), 'MMM dd')}`}
                      </span>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div
                    className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedActivity(a)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                    >
                      <ChevronRight size={12} />
                      Prizes
                    </button>
                    <button
                      onClick={() => setActivityModal(a)}
                      className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => void handleDelete(a.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Activity create/edit modal */}
      {activityModal !== false && (
        <ActivityModal
          activity={activityModal}
          onClose={() => setActivityModal(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
