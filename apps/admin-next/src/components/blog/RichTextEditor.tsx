'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import type ReactQuillType from 'react-quill-new';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  onUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  label,
  required,
  error,
  className,
  onUpload,
}: RichTextEditorProps) => {
  // 懒加载 ReactQuill：useEffect 只在客户端执行，避免 SSR 崩溃
  const [ReactQuill, setReactQuill] = useState<typeof ReactQuillType | null>(
    null,
  );
  const quillRef = useRef<ReactQuillType>(null);

  useEffect(() => {
    import('react-quill-new').then((mod) => setReactQuill(() => mod.default));
  }, []);

  // 自定义图片处理逻辑
  const imageHandler = useCallback(() => {
    // 1. 如果没传 onUpload 方法，就报错或者什么都不做
    if (!onUpload) {
      alert(
        'Image upload configuration is missing! Please implement onUpload prop.',
      );
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 简单的大小检查
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large (max 5MB)');
        return;
      }

      try {
        // 2. 调用父组件传进来的方法
        const url = await onUpload(file);

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1, 0);
        }
      } catch (error) {
        console.error('Upload failed in component:', error);
        alert('Failed to upload image');
      }
    };
  }, [onUpload]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler, // 绑定处理器
        },
      },
    }),
    [imageHandler],
  );

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className || ''}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`group flex flex-col bg-gray-50 dark:bg-black/20 border rounded-lg overflow-hidden transition-all ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* ReactQuill 未加载前显示骨架屏占位 */}
        {!ReactQuill ? (
          <div className="h-[340px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
        ) : (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            modules={modules}
            style={{
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
            }}
            className="flex-1"
          />
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}

      {!onUpload && (
        <div className="text-xs text-amber-600 mt-1">
          Note: Image upload is not configured. Please implement onUpload prop
          to enable image upload.
        </div>
      )}
    </div>
  );
};
