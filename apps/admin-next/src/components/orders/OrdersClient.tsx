'use client';

/**
 * OrdersClient — Client Component
 * Phase 3: URL searchParams 驱动 filter
 */
import React, { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, XCircle, Trash2, Eye } from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { Order, OrderSearchForm } from '@/type/types';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm';
import { useRequest } from 'ahooks';
import { orderApi } from '@/api';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '@lucky/shared';
import { BaseTable } from '@/components/scaffold/BaseTable';
import { ModalManager } from '@repo/ui';
import dayjs from 'dayjs';
import { ORDER_STATUS_COLORS } from '@/consts';
import {
  buildOrdersListParams,
  ordersListQueryKey,
  parseOrdersUrlSearchParams,
} from '@/lib/cache/orders-cache';

export function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  // ── URL → 查询参数（分页 + filter）───────────────────────────
  const queryInput = useMemo(
    () => parseOrdersUrlSearchParams(searchParams),
    [searchParams],
  );

  // ── filter 变化 → 更新 URL ──────────────────────────────────
  const handleParamsChange = useCallback(
    (formData: OrderSearchForm) => {
      const qs = new URLSearchParams();
      if (formData.keyword) qs.set('keyword', formData.keyword);
      if (formData.orderStatus && formData.orderStatus !== 'All') {
        qs.set('orderStatus', formData.orderStatus);
      }
      qs.set('page', '1');
      qs.set('pageSize', String(queryInput.pageSize));
      router.replace(`/orders?${qs.toString()}`, { scroll: false });
    },
    [queryInput.pageSize, router],
  );

  const {
    data: ordersRes,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ordersListQueryKey(queryInput),
    queryFn: () => orderApi.getList(buildOrdersListParams(queryInput)),
    staleTime: 15_000,
  });

  const orders = ordersRes?.list ?? [];
  const total = ordersRes?.total ?? 0;

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 1. API Hooks for Actions
  const { runAsync: updateStatusApi } = useRequest(orderApi.updateState, {
    manual: true,
  });
  const { runAsync: deleteOrderApi } = useRequest(orderApi.delete, {
    manual: true,
  });

  // Orders 写操作后失效（orders:list + dashboard:orders）
  const invalidateOrdersCache = useCallback(async () => {
    const { revalidateOrdersList } =
      await import('@/lib/actions/orders-revalidate');
    await revalidateOrdersList();
  }, []);

  // 2. Logic: Handle Status Updates
  const handleUpdateStatus = useCallback(
    async (
      orderId: string,
      status: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _extraData: Record<string, unknown> = {},
    ) => {
      try {
        await updateStatusApi(orderId, status);
        addToast(
          'success',
          `Order status updated to ${ORDER_STATUS_LABEL[status]}`,
        );
        await refresh();
        void invalidateOrdersCache();
      } catch (error) {
        addToast('error', 'Failed to update status');
      }
    },
    [addToast, updateStatusApi, refresh, invalidateOrdersCache],
  );

  // 3. Logic: Handle Delete
  const handleDelete = useCallback(
    async (orderId: string) => {
      if (
        ModalManager.open({
          title: 'Confirm Deletion',
          renderChildren: ({ close }) => (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete this order? This action cannot
                be undone.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await deleteOrderApi(orderId);
                      addToast('success', 'Order deleted successfully');
                      await refresh();
                      void invalidateOrdersCache();
                      close();
                    } catch (error) {
                      addToast('error', 'Failed to delete order');
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ),
        })
      )
        return;
      try {
        await deleteOrderApi(orderId);
        addToast('success', 'Order deleted successfully');
        await refresh();
        void invalidateOrdersCache();
      } catch (error) {
        addToast('error', 'Failed to delete order');
      }
    },
    [addToast, deleteOrderApi, refresh, invalidateOrdersCache],
  );

  // 4. Interaction: Open Shipping Modal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openShippingModal = (_orderId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let _trackingNumber = '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let _courierName = '';

    ModalManager.open({
      title: 'Ship Order',
      renderChildren: ({ close }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Courier Name</label>
            <Input
              onChange={(e) => (_courierName = e.target.value)}
              placeholder="e.g. J&T, Lalamove"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tracking Number</label>
            <Input
              onChange={(e) => (_trackingNumber = e.target.value)}
              placeholder="e.g. 982173..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button>Confirm Shipment</Button>
          </div>
        </div>
      ),
    });
  };

  // 5. Interaction: Order Details View
  const handleOrderDetails = useCallback(
    (data: Order) => {
      ModalManager.open({
        title: `Order Details: ${data.orderNo}`,
        size: 'lg',
        renderChildren: ({ close }) => (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Status: {ORDER_STATUS_LABEL[data.orderStatus]}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-500">Customer Info</h4>
                <p>Name: {data.user.nickname}</p>
                <p>Phone: {data.user.phone}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-500">Order Info</h4>
                <p>Product: {data.treasure.treasureName}</p>
                <p>Qty: {data.buyQuantity}</p>
                <p>Total: ₱{data.originalAmount.toLocaleString()}</p>
                <p>
                  Date: {dayjs(data.createdAt).format('MMM DD, YYYY HH:mm')}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
              <Button variant="ghost" onClick={close}>
                Close
              </Button>

              {data.orderStatus === ORDER_STATUS.PAID && (
                <Button
                  onClick={() => {
                    close();
                    openShippingModal(data.orderId);
                  }}
                >
                  <Truck size={16} className="mr-2" /> Ship Order
                </Button>
              )}

              {[ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID].includes(
                data.orderStatus,
              ) && (
                <Button
                  onClick={() =>
                    handleUpdateStatus(data.orderId, ORDER_STATUS.CANCELED)
                  }
                >
                  <XCircle size={16} className="mr-2" /> Cancel Order
                </Button>
              )}
            </div>
          </div>
        ),
      });
    },
    [handleUpdateStatus],
  );

  // 7. Table Configuration
  const columns = useMemo(() => {
    const columnsHelper = createColumnHelper<Order>();
    return [
      columnsHelper.accessor('orderNo', {
        header: 'Order No.',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnsHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {dayjs(info.getValue()).format('YYYY-MM-DD HH:mm')}
          </span>
        ),
      }),
      columnsHelper.accessor('user.nickname', {
        header: 'Customer',
        cell: (info) => (
          <div className="flex flex-col">
            <span>{info.getValue()}</span>
            <span className="text-xs text-gray-400">
              {info.row.original.user.phone}
            </span>
          </div>
        ),
      }),
      columnsHelper.accessor('treasure.treasureName', {
        header: 'Product',
      }),
      columnsHelper.accessor('originalAmount', {
        header: 'Total',
        cell: (info) => (
          <span className="font-mono font-bold">
            ₱{info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnsHelper.accessor('orderStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const color = ORDER_STATUS_COLORS[status] || 'gray';
          return <Badge color={color}>{ORDER_STATUS_LABEL[status]}</Badge>;
        },
      }),
      columnsHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOrderDetails(info.row.original)}
            >
              <Eye size={16} />
            </Button>
            {[ORDER_STATUS.CANCELED, ORDER_STATUS.REFUNDED].includes(
              info.row.original.orderStatus,
            ) && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(info.row.original.orderId)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ),
      }),
    ] as ColumnDef<Order>[];
  }, [handleDelete, handleOrderDetails]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="Track, update, and manage customer orders."
      />
      <Card>
        <div className="mb-6">
          <SchemaSearchForm<OrderSearchForm>
            initialValues={{
              keyword: queryInput.keyword ?? '',
              orderStatus: queryInput.orderStatus
                ? String(queryInput.orderStatus)
                : 'All',
            }}
            schema={[
              {
                type: 'input',
                key: 'keyword',
                label: 'Search',
                placeholder: 'Order No, Nickname, Phone',
              },
              {
                type: 'select',
                key: 'orderStatus',
                label: 'Status',
                defaultValue: 'All',
                options: [
                  { label: 'All', value: 'All' },
                  ...Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => ({
                    label: v,
                    value: k,
                  })),
                ],
              },
            ]}
            onSearch={handleParamsChange}
            onReset={() => {
              handleParamsChange({ keyword: '', orderStatus: 'All' });
            }}
            loading={isFetching}
          />
        </div>
        <BaseTable
          columns={columns}
          data={orders}
          loading={isFetching}
          rowKey="orderId"
          pagination={{
            current: queryInput.page,
            pageSize: queryInput.pageSize,
            total,
            onChange: (p, s) => {
              const qs = new URLSearchParams();
              if (queryInput.keyword) qs.set('keyword', queryInput.keyword);
              if (queryInput.orderStatus) {
                qs.set('orderStatus', String(queryInput.orderStatus));
              }
              qs.set('page', String(p));
              qs.set('pageSize', String(s));
              router.replace(`/orders?${qs.toString()}`, { scroll: false });
            },
          }}
        />
      </Card>
    </div>
  );
}
