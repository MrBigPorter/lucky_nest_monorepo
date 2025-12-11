import React, { useState, useEffect } from 'react';
import { Image, ImageProps } from '@unpic/react';
import { ImageOff, Loader2 } from 'lucide-react';
import { cn } from '@repo/ui';

interface SmartImageProps extends Omit<ImageProps, 'cdn'> {
  /** 是否强制开启/关闭 CDN 优化 (默认读取环境变量 VITE_ENABLE_IMAGE_OPTIMIZATION) */
  enableOptimization?: boolean;
  /** 加载失败时的备用图片地址 (如果不传则显示图标) */
  fallbackSrc?: string;
  /** 容器的类名 (用于控制大小) */
  className?: string;
  /** 图片本身的类名 */
  imgClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  enableOptimization,
  fallbackSrc,
  className,
  imgClassName,
  alt = '',
  layout = 'constrained',
  loading = 'lazy',
  ...props
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  );

  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // 1. 判断是否为本地图片 (Blob URL 或 Base64)
  const isLocalImage = src?.startsWith('blob:') || src?.startsWith('data:');

  // 2. 计算是否使用 CDN
  // 规则：如果不强制指定，且不是本地图片，且环境变量开启，则使用 Cloudflare
  const shouldEnableCdn =
    !isLocalImage &&
    (enableOptimization ??
      import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION === 'true');

  // 监听 src 变化，重置状态 (防止表格复用组件时状态不更新)
  useEffect(() => {
    setStatus('loading');

    // 检查 ref 是否存在，以及图片是否已经“完成”了 (cached)
    if (imgRef.current && imgRef.current.complete) {
      // 如果浏览器说“我早就加载完了”，那我们手动触发 loaded
      // 这里的 .complete 是原生 DOM 属性，非常可靠
      if (imgRef.current.naturalWidth === 0) {
        // 加载完了但宽度是0，说明是张烂图 (Error)
        setStatus('error');
      } else {
        // 宽度正常，说明加载成功 (Loaded)
        setStatus('loaded');
      }
    }
  }, [src]);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
        className,
      )}
    >
      {/* --- 1. Loading 状态 (骨架屏/转圈) --- */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}

      {/* --- 2. Error 状态 (加载失败) --- */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800 z-20">
          {fallbackSrc ? (
            <img
              src={fallbackSrc}
              alt={alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff size={20} />
          )}
        </div>
      )}

      {/* --- 3. 正常图片 (@unpic) --- */}
      {src && (
        <Image
          ref={imgRef}
          src={src}
          // 智能开关：开启传 'cloudflare'，关闭传 undefined (加载原图)
          cdn={shouldEnableCdn ? 'cloudflare' : undefined}
          layout={layout}
          alt={alt}
          loading={loading}
          // 图片加载成功的回调
          onLoad={() => setStatus('loaded')}
          // 图片加载失败的回调
          onError={() => setStatus('error')}
          className={cn(
            'transition-opacity duration-500 ease-in-out', // 淡入动画
            // 加载完成前透明，加载完后显示
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName || 'w-full h-full object-cover',
          )}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(props as any)}
        />
      )}
    </div>
  );
};
