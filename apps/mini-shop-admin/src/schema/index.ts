// schema/imageFileSchema.ts
import { z } from 'zod';

export const imageFileSchema = z
  .union([
    // 编辑场景：已经有的 URL
    z.string().url().min(1, 'Invalid image URL'),

    // 创建/编辑：用户新上传的 File
    z.instanceof(File),
  ])
  .refine(
    (value) => {
      // 已有 URL：不做更多限制，前面 url().min(1) 已经校验过
      if (typeof value === 'string') return true;

      // File：类型 + 大小限制
      const isImage = value.type.startsWith('image/');
      const under5M = value.size <= 5 * 1024 * 1024; // 5MB

      return isImage && under5M;
    },
    { message: 'Please upload an image (max 5MB)' },
  );
