import React from 'react';
import { Button, cn } from '@repo/ui';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  /** 页面大标题 */
  title: string;
  /** 页面描述/副标题 */
  description?: string;
  /** 右侧操作区 (通常放按钮) */
  action?: React.ReactNode;
  /** 额外的容器样式 */
  className?: string;
  /** 可选按钮文本 */
  buttonText?: string;
  /** 可选按钮点击事件 */
  buttonOnClick?: () => void;
  /** 按钮前缀图标，默认为加号图标 */
  buttonPrefixIcon?: React.ReactNode;
  /** 是否显示按钮图标，默认为 true */
  showButtonIcon?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className,
  buttonText,
  buttonOnClick,
  buttonPrefixIcon = <Plus size={18} />,
  showButtonIcon = true,
}) => {
  return (
    <div className={cn('flex justify-between items-center mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        )}
      </div>

      {/* 只有传入了 action 才渲染右侧区域 */}
      {action && <div className="flex items-center gap-2">{action}</div>}
      {buttonText && buttonOnClick && (
        <Button onClick={buttonOnClick} className="gap-2.5">
          {showButtonIcon && buttonPrefixIcon}
          {buttonText}
        </Button>
      )}
    </div>
  );
};
