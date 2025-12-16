import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseTable } from '@/components/scaffold/BaseTable';
import { Button } from '@repo/ui';
import { RefreshCw, Download } from 'lucide-react';
import { SmartColumn, RequestData } from './types';
import { Badge } from '@/components/UIComponents';
import { NumHelper, TimeHelper } from '@lucky/shared';
import get from 'lodash/get';

interface SmartTableProps<T extends Record<string, any>> {
  rowKey: keyof T;
  headerTitle?: React.ReactNode;
  columns: SmartColumn<T>[];

  // 数据源：二选一
  request?: RequestData<T>;
  dataSource?: T[];

  // 外部参数（通常来自搜索表单）
  params?: Record<string, any>;

  // 工具栏扩展
  toolBarRender?: () => React.ReactNode[];
  onExport?: (params: any) => void;

  defaultPageSize?: number;
}

export const SmartTable = <T extends Record<string, any>>({
  columns,
  request,
  dataSource,
  params = {}, // 外部传入的搜索参数
  rowKey,
  headerTitle,
  toolBarRender,
  onExport,
  defaultPageSize = 10,
}: SmartTableProps<T>) => {
  // --- 1. 状态管理 ---
  const [data, setData] = useState<T[]>(dataSource || []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
  });

  // --- 2. 核心：请求调度器 ---
  const fetchData = useCallback(async () => {
    // 如果没有 request 函数，说明是纯展示组件，直接忽略
    if (!request) return;

    setLoading(true);
    try {
      // 合并 分页参数 + 外部搜索参数
      const requestParams = {
        current: pagination.current,
        pageSize: pagination.pageSize,
        ...params,
      };

      const result = await request(requestParams);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('SmartTable request failed:', error);
    } finally {
      setLoading(false);
    }
  }, [
    request,
    pagination.current,
    pagination.pageSize,
    JSON.stringify(params),
  ]);

  // 当分页或外部参数变化时，自动触发请求
  useEffect(() => {
    if (request) {
      fetchData();
    } else if (dataSource) {
      setData(dataSource);
    }
  }, [fetchData, dataSource, request]);

  // --- 3. 核心：列渲染引擎 (Render Engine) ---
  const processedColumns = useMemo(() => {
    return columns
      .filter((col) => !col.hideInTable)
      .map((col) => {
        return {
          header: col.title, // 适配 BaseTable/TanStack 的 header
          // 适配 BaseTable/TanStack 的 accessorKey (支持 'user.name' 嵌套)
          accessorKey: col.dataIndex as string,
          size: col.width,

          // 魔法在这里：拦截 cell 渲染
          cell: ({ row }: any) => {
            const rowData = row.original;
            // 获取原始值 (处理嵌套路径)
            const rawValue = col.dataIndex
              ? get(rowData, col.dataIndex as string)
              : undefined;

            // A. 计算默认显示 (Default DOM)
            let dom: React.ReactNode = rawValue;

            if (rawValue === null || rawValue === undefined) {
              dom = <span className="text-gray-300">-</span>;
            } else {
              switch (col.valueType) {
                case 'money':
                  dom = (
                    <span className="font-mono">
                      {NumHelper.formatMoney(rawValue)}
                    </span>
                  );
                  break;
                case 'date':
                  dom = (
                    <span className="text-gray-500 text-xs">
                      {TimeHelper.formatDate(rawValue)}
                    </span>
                  );
                  break;
                case 'dateTime':
                  dom = (
                    <span className="text-gray-500 text-xs">
                      {TimeHelper.formatDateTime(rawValue)}
                    </span>
                  );
                  break;
                case 'select':
                  if (col.valueEnum && col.valueEnum[rawValue]) {
                    const { text, status } = col.valueEnum[rawValue];
                    // 自动映射到 Badge 组件
                    dom = <Badge color={status as any}>{text}</Badge>;
                  }
                  break;
                case 'option':
                  dom = null; // 操作列默认没有任何显示，必须靠 render
                  break;
              }
            }

            // B. 如果用户定义了 render，将控制权移交 (Inversion of Control)
            if (col.render) {
              return col.render(dom, rowData, row.index);
            }

            return dom;
          },
        };
      });
  }, [columns]);

  // --- 4. 渲染工具栏 ---
  const renderToolbar = () => {
    if (!headerTitle && !toolBarRender && !onExport && !request) return null;

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 px-1">
        {headerTitle && (
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {headerTitle}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {toolBarRender?.()}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport({ ...params, ...pagination })}
            >
              <Download size={14} className="mr-1.5" /> Export
            </Button>
          )}

          {request && (
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="smart-table-container">
      {renderToolbar()}

      <BaseTable
        data={data}
        columns={processedColumns}
        loading={loading}
        rowKey={rowKey as string}
        pagination={
          request
            ? {
                current: pagination.current,
                pageSize: pagination.pageSize,
                total,
                onChange: (p, ps) =>
                  setPagination({ current: p, pageSize: ps }),
              }
            : undefined
        }
      />
    </div>
  );
};
