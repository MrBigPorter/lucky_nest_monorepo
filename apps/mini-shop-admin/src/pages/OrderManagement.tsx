import React, { useCallback, useMemo } from 'react';
import { MoreVertical, Truck, CheckCircle } from 'lucide-react';
import { Card, Button, Badge } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { Order, OrderListParams, OrderSearchForm } from '@/type/types.ts';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { useAntdTable, useRequest } from 'ahooks';
import { orderApi } from '@/api';
import { createColumnHelper } from '@tanstack/react-table';
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '@lucky/shared';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { ModalManager } from '@repo/ui';

export const OrderManagement: React.FC = () => {
  const OrderStatusOptions = useMemo(() => {
    return [
      { label: 'All Status', value: 'All' },
      ...Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => ({
        label,
        value: key,
      })),
    ];
  }, []);
  const addToast = useToastStore((state) => state.addToast);

  const handleUpdateStatus = (status: 'shipped' | 'delivered') => {};

  const handleOrder = useCallback((data: Order) => {
    ModalManager.open({
      title: `Order Details: ${data.orderNo}`,
      renderChildren: ({ close }) => (
        <div className="space-y-4">
          <p>
            <strong>Customer:</strong> {data.user.nickname}
          </p>
          <p>
            <strong>Product:</strong> {data.treasure.treasureName}
          </p>
          <p>
            <strong>Amount:</strong> ₱{data.originalAmount.toLocaleString()}
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
            <Button variant="ghost" onClick={() => close()}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateStatus('shipped')}>
              <Truck size={16} /> Mark as Shipped
            </Button>
            <Button onClick={() => handleUpdateStatus('delivered')}>
              <CheckCircle size={16} /> Mark as Delivered
            </Button>
          </div>
        </div>
      ),
    });
  }, []);
  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: OrderSearchForm,
  ) => {
    const params: OrderListParams = {
      page: current,
      pageSize,
    };
    if (formData?.keyword) {
      params.keyword = formData.keyword;
    }
    if (formData?.orderStatus && formData?.orderStatus !== 'All') {
      params.orderStatus = Number(formData.orderStatus);
    }
    const res = await orderApi.getList(params);

    return { list: res.list, total: res.total };
  };

  const {
    tableProps,
    run,
    refresh,
    search: { reset },
    mutate,
  } = useAntdTable(getTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        keyword: '',
        orderStatus: 'All',
      },
    ],
  });

  const handleSearch = (values: OrderSearchForm) => {
    run({ current: 1, pageSize: 10 }, values);
  };

  const { run: deleteOrder } = useRequest(orderApi.delete, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Deleted');
      refresh();
    },
  });

  const dataSource = useMemo(
    () => tableProps.dataSource || [],
    [tableProps.dataSource],
  );

  const orderStatusColors: Record<number, 'green' | 'yellow' | 'red'> =
    useMemo(() => {
      return {
        [ORDER_STATUS.PAID]: 'green',
        [ORDER_STATUS.CANCELED]: 'yellow',
        [ORDER_STATUS.PENDING_PAYMENT]: 'yellow',
        [ORDER_STATUS.REFUNDED]: 'red',
      };
    }, []);

  const columns = useMemo(() => {
    const columnsHelper = createColumnHelper<Order>();
    return [
      columnsHelper.accessor('orderNo', {
        header: 'Order No.',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
          </div>
        ),
      }),
      columnsHelper.accessor('user.nickname', {
        header: 'Customer',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
          </div>
        ),
      }),
      columnsHelper.accessor('treasure.treasureName', {
        header: 'Product',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
          </div>
        ),
      }),
      columnsHelper.accessor('originalAmount', {
        header: 'Amount',
        cell: (info) => (
          <div className="font-mono font-bold">
            ₱{info.getValue().toLocaleString()}
          </div>
        ),
      }),
      columnsHelper.accessor('orderStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const color = orderStatusColors[status] || 'yellow';
          return <Badge color={color}>{ORDER_STATUS_LABEL[status]}</Badge>;
        },
      }),
      columnsHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex  gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOrder(info.row.original)}
            >
              <MoreVertical size={16} />
            </Button>
          </div>
        ),
      }),
    ];
  }, [handleOrder, orderStatusColors]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="Track, update, and manage all customer orders."
      />
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SchemaSearchForm<OrderSearchForm>
            schema={[
              {
                type: 'input',
                key: 'keyword',
                label: 'Search Order',
                placeholder: 'Search by Order No or Customer...',
              },
              {
                type: 'select',
                key: 'orderStatus',
                label: 'Order Status',
                defaultValue: 'All',
                options: OrderStatusOptions,
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>
        <BaseTable
          columns={columns}
          data={dataSource}
          rowKey="orderId"
          pagination={{
            ...tableProps.pagination,
            onChange: (page, pageSize) => {
              tableProps.onChange?.({
                current: page,
                pageSize: pageSize,
              });
            },
          }}
        />
      </Card>
    </div>
  );
};
