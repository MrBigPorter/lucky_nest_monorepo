import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import get from 'lodash/get';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@repo/ui';

import { BaseTable } from '@/components/scaffold/BaseTable';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm';
import { Badge } from '@/components/UIComponents';
import { NumHelper, TimeHelper } from '@lucky/shared';

import type { ProColumns, RequestData, ActionType, ValueType } from './types';
import { FormSchema } from '@/type/search.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SmartTableProps<T extends Record<string, any>> {
  rowKey: keyof T;
  headerTitle?: React.ReactNode;

  // 表格列定义 (主要负责展示)
  columns: ProColumns<T>[];

  // 独立的搜索表单配置 (如果有它，就不从 columns 生成搜索项)
  searchSchema?: FormSchema[];

  request?: RequestData<T>;
  dataSource?: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  toolBarRender?: () => React.ReactNode[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExport?: (params: any) => void;
  defaultPageSize?: number;
}

// ------------------------------------
// 渲染单元格内容
// ------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderSmartCell = (text: any, type?: ValueType, valueEnum?: any) => {
  if (text === null || text === undefined || text === '') return '-';

  switch (type) {
    case 'money':
      return <span className="font-mono">{NumHelper.formatMoney(text)}</span>;
    case 'date':
      return (
        <span className="text-gray-500 text-xs">
          {TimeHelper.formatDate(text)}
        </span>
      );
    case 'dateTime':
      return (
        <span className="text-gray-500 text-xs">
          {TimeHelper.formatDateTime(text)}
        </span>
      );
    case 'select':
      if (valueEnum && valueEnum[text]) {
        const { text: label, status, color } = valueEnum[text];
        const badgeColor = color || status || 'default';
        return <Badge color={badgeColor}>{label}</Badge>;
      }
      return text;
    default:
      return text;
  }
};

// ------------------------------------
// Columns -> Search Schema (默认生成逻辑)
// ------------------------------------
const transformColumnsToSchema = (columns: ProColumns[]): FormSchema[] => {
  return columns
    .filter(
      (col) =>
        col.search !== false && !col.hideInSearch && col.valueType !== 'option',
    )
    .map((col) => {
      let type = 'input';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let options: any[] | undefined = undefined;

      const searchConfig = typeof col.search === 'object' ? col.search : {};
      const valueType = searchConfig.valueType || col.valueType;

      if (valueType === 'select' && col.valueEnum) {
        type = 'select';
        options = Object.entries(col.valueEnum).map(([k, v]) => ({
          label: (v as typeof v).text,
          value: k,
        }));
        options.unshift({ label: 'All', value: 'ALL' });
      } else if (valueType === 'date' || valueType === 'dateTime') {
        type = 'date';
      } else if (valueType === 'dateRange') {
        type = 'date';
      }

      return {
        key: (col.dataIndex as string) || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (searchConfig as any).title || col.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
        options,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        placeholder: (searchConfig as any).formItemProps?.placeholder
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (searchConfig as any).formItemProps?.placeholder
          : `Search ${col.title}`,
        // 透传给 FormItem 的属性
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(searchConfig as any).formItemProps,
        // dateRange 强制 range
        ...(valueType === 'dateRange' ? { mode: 'range' } : {}),
      };
    });
};

// ------------------------------------
// 内部组件
// ------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SmartTableInner = <T extends Record<string, any>>(
  props: SmartTableProps<T>,
  ref: React.Ref<ActionType>,
) => {
  const {
    columns,
    searchSchema: explicitSearchSchema, // ✨ 获取显式传入的 searchSchema
    request,
    dataSource,
    rowKey,
    headerTitle,
    toolBarRender,
    onExport,
    defaultPageSize = 10,
    params,
  } = props;

  // ✅ 引用锁定，防止死循环
  const externalParams = useMemo(() => params || {}, [params]);

  const [data, setData] = useState<T[]>(dataSource || []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: defaultPageSize,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formParams, setFormParams] = useState<Record<string, any>>({});

  const onPageChange = useCallback((p: number, ps: number) => {
    setPagination((prev) => {
      if (prev.page === p && prev.pageSize === ps) return prev;
      return { page: p, pageSize: ps };
    });
  }, []);

  const paginationProps = useMemo(() => {
    if (!request) return undefined;
    return {
      current: pagination.page,
      pageSize: pagination.pageSize,
      total,
      onChange: onPageChange,
    };
  }, [request, pagination, total, onPageChange]);

  const fetchData = useCallback(
    async (pageParams = pagination, searchParams = formParams) => {
      if (!request) return;
      setLoading(true);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedParams: Record<string, any> = { ...searchParams };

        // 只有在没有使用独立 searchSchema 时，才尝试从 columns 里自动转换参数
        // 如果使用了 explicitSearchSchema，建议在 request 函数里手动处理转换
        if (!explicitSearchSchema) {
          columns.forEach((col) => {
            const searchConfig =
              typeof col.search === 'object' ? col.search : {};
            const key = col.dataIndex as string;
            if (searchConfig.transform && transformedParams[key]) {
              const transformed = searchConfig.transform(
                transformedParams[key],
              );
              delete transformedParams[key];
              Object.assign(transformedParams, transformed);
            }
          });
        }

        Object.keys(transformedParams).forEach((key) => {
          if (transformedParams[key] === 'ALL') delete transformedParams[key];
        });

        const res = await request({
          page: pageParams.page,
          pageSize: pageParams.pageSize,
          ...externalParams,
          ...transformedParams,
        });

        setData(res.data);
        setTotal(res.total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [
      request,
      columns,
      externalParams,
      pagination,
      formParams,
      explicitSearchSchema,
    ],
  );

  useEffect(() => {
    if (request) fetchData().catch();
    else if (dataSource) setData(dataSource);
  }, [request, dataSource, fetchData]);

  useImperativeHandle(
    ref,
    () => ({
      reload: (resetPage = false) => {
        if (resetPage) {
          setPagination((p) => {
            if (p.page === 1) return p;
            return { ...p, page: 1 };
          });
          fetchData({ ...pagination, page: 1 }, formParams).catch();
          return;
        }
        fetchData(pagination, formParams).catch();
      },
      reset: () => {
        setFormParams({});
        setPagination((p) => ({ ...p, page: 1 }));
      },
    }),
    [fetchData, pagination, formParams],
  );

  //  核心逻辑：优先使用传入的 searchSchema，否则从 columns 生成
  const finalSearchSchema = useMemo(
    () => explicitSearchSchema || transformColumnsToSchema(columns),
    [columns, explicitSearchSchema],
  );

  const tableColumns = useMemo(() => {
    return columns
      .filter((col) => !col.hideInTable)
      .map((col) => ({
        header: col.title,
        accessorKey: col.dataIndex as string,
        size: col.width,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: (info: any) => {
          const rawValue = col.dataIndex
            ? get(info.row.original, col.dataIndex as string)
            : undefined;

          const dom = renderSmartCell(rawValue, col.valueType, col.valueEnum);

          if (col.render) {
            return col.render(
              dom,
              info.row.original,
              info.row.index,
              undefined,
            );
          }
          return dom;
        },
      }));
  }, [columns]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSearch = useCallback((values: any) => {
    setPagination((p) => {
      if (p.page === 1) return p;
      return { ...p, page: 1 };
    });

    // 简单的清理逻辑
    for (const key in values) {
      if (
        values[key] === '' ||
        values[key] === undefined ||
        values[key] === null
      ) {
        delete values[key];
      }
      if (values[key] === 'ALL') {
        delete values[key];
      }
    }

    setFormParams(values);
  }, []);

  const handleReset = useCallback(() => {
    setPagination((p) => {
      if (p.page === 1) return p;
      return { ...p, page: 1 };
    });
    setFormParams({});
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData().catch();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {finalSearchSchema.length > 0 && (
        <SchemaSearchForm
          schema={finalSearchSchema}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      )}

      {(headerTitle || toolBarRender || onExport || request) && (
        <div className="flex justify-between items-center px-1">
          {headerTitle ? (
            <div className="text-lg font-bold">{headerTitle}</div>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            {toolBarRender?.()}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport({ ...formParams, ...externalParams })}
              >
                <Download size={14} className="mr-1.5" /> Export
              </Button>
            )}
            {request && (
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? 'animate-spin' : ''}
                />
              </Button>
            )}
          </div>
        </div>
      )}

      <BaseTable
        data={data}
        columns={tableColumns}
        loading={loading}
        rowKey={rowKey as string}
        pagination={paginationProps}
      />
    </div>
  );
};

export const SmartTable = forwardRef(SmartTableInner) as <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
>(
  props: SmartTableProps<T> & { ref?: React.Ref<ActionType> },
) => React.ReactElement;
