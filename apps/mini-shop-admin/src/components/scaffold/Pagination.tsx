import React from 'react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui';
interface PaginationProps {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 翻页回调 */
  onChange: (page: number, pageSize: number) => void;
  /** 额外的样式类 */
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  className,
}) => {
  // 计算总页数，防止除以0或向上取整错误
  const totalPage = Math.max(1, Math.ceil(total / pageSize));

  // 是否是第一页或最后一页
  const isFirstPage = current <= 1;
  const isLastPage = current >= totalPage;

  console.log('Pagination Render:', { current, pageSize, total, totalPage });

  return (
    <div
      className={cn(
        'flex justify-between items-center mt-4 text-sm text-gray-500',
        className,
      )}
    >
      {/* 左侧：总数显示 */}
      <div>
        Total{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {total}
        </span>{' '}
        items
      </div>

      {/* 右侧：翻页操作 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(current - 1, pageSize)}
          disabled={isFirstPage}
          className="h-8 px-3"
        >
          Previous
        </Button>

        <span className="mx-2 text-xs font-medium">
          Page <span className="text-gray-900 dark:text-white">{current}</span>{' '}
          of {totalPage}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(current + 1, pageSize)}
          disabled={isLastPage}
          className="h-8 px-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
