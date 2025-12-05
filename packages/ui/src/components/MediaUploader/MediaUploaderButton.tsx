import React from 'react';
import { UploadCloud } from 'lucide-react';
import { useMediaUploaderContext } from './context.ts';
import { cn } from '@/lib/utils'; // 假设您的 cn 工具函数在这里

export const MediaUploaderButton: React.FC = () => {
  const { dropzone } = useMediaUploaderContext();
  const { isDragActive } = dropzone;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-500'
          : 'border-gray-300 dark:border-white/10 text-gray-400 hover:border-primary-500 hover:text-primary-500'
      )}
    >
      <UploadCloud className="w-12 h-12 mb-3" />
      <p className="text-sm font-medium">
        {isDragActive ? 'Drop files here...' : 'Click or drag files to upload'}
      </p>
      <p className="text-xs mt-1">PNG, JPG, GIF up to 5MB</p>
    </div>
  );
};
