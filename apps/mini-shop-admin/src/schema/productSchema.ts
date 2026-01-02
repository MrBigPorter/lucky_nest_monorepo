import { z } from 'zod';
import { imageFileSchema } from '@/schema/index.ts';

export const createProductSchema = z.object({
  // --- 1. 基础信息 ---
  treasureName: z.string().min(1, 'Product name is required'),

  // 库存 (stockQuantity)
  seqShelvesQuantity: z.coerce
    .number()
    .min(1, 'Stock quantity must be at least 1'),

  unitAmount: z.coerce.number().min(0.01, 'Unit price must be at least 0.01'),

  costAmount: z.coerce.number().min(0, 'Total cost must be at least 0'),

  categoryIds: z.coerce
    .number({
      required_error: 'Category is required',
      invalid_type_error: 'Category must be a number',
    })
    .min(1, 'Category is required'), // 确保选了分类

  desc: z.string().optional(),
  ruleContent: z.string().optional(),

  treasureCoverImg: imageFileSchema,

  // --- 2. [新增] 物流与拼团配置 ---
  shippingType: z.coerce.number().default(1),

  weight: z.coerce.number().optional(),

  groupSize: z.coerce
    .number()
    .min(2, 'Group size must be at least 2')
    .default(5),

  groupTimeLimit: z.coerce
    .number()
    .min(60, 'Time limit must be at least 60 seconds')
    .default(86400),

  // --- 3. [新增] 销售时间 (Pre-sale) ---
  // 表单里的时间可能是 Date 对象、字符串或空值，用 union 兼容性最好
  salesStartAt: z
    .union([z.date(), z.string(), z.null(), z.undefined()])
    .optional(),
  salesEndAt: z
    .union([z.date(), z.string(), z.null(), z.undefined()])
    .optional(),

  // --- 4. [新增] 赠品配置 (Bonus - Flattened) ---
  // 这些字段在表单里是扁平的，提交时才组装成 JSON
  bonusItemName: z.string().optional(),

  bonusWinnerCount: z.coerce.number().min(1, 'At least 1 winner').optional(),

  bonusItemImg: imageFileSchema.optional().or(z.literal('')), // 允许不传或空字符串
});
