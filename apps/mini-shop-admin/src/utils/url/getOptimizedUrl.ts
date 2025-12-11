interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  /** Cloudflare 的 fit 模式: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad' */
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad';
  /** 强制格式，通常设为 auto 让 CF 自动决定 (avif/webp) */
  format?: 'auto' | 'avif' | 'webp' | 'json';
  /** 是否强制开启优化 (默认读取环境变量) */
  enableOptimization?: boolean;
}

/**
 * 手动生成 Cloudflare Image Resizing URL
 * 模仿 @unpic/react 的核心逻辑
 */
export const getOptimizedUrl = (src: string, options: ImageOptions = {}) => {
  // 1. 安全检查
  if (!src) return '';

  // 2. 检查环境变量开关
  const useCdn =
    options.enableOptimization ??
    import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION === 'true';

  // 如果开关关闭，或者 src 已经是 base64/blob，直接返回原图
  if (!useCdn || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // 3. 组装参数列表
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);

  // 默认为 cover (裁剪填满)
  params.push(`fit=${options.fit || 'cover'}`);

  // 默认为 auto (自动选择 avif/webp)
  params.push(`f=${options.format || 'auto'}`);

  // 4. 拼接最终 URL
  // 格式: /cdn-cgi/image/<逗号分隔的参数>/<原图URL>
  const paramString = params.join(',');
  console.log('Optimized Image URL Params:', paramString);

  // 注意：Cloudflare 要求原图 URL 必须是绝对路径或同域路径
  // 这里我们生成相对路径，依靠浏览器自动补全域名，或者配合 Vite 代理
  return `/cdn-cgi/image/${paramString}/${src}`;
};
