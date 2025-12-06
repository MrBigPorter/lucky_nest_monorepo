import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const imageFileSchema = z.any().refine(
  (v) => {
    if (!v) return false;
    // 已有 URL 字符串
    if (typeof v === 'string') return v.trim().length > 0;
    // 新上传文件
    if (v instanceof File) {
      const isImage = v.type.startsWith('image/');
      const under5M = v.size <= 5 * 1024 * 1024;
      return isImage && under5M;
    }
    return false;
  },
  { message: 'Please upload an image (max 5MB)' },
);
