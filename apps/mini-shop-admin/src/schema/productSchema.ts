import { z } from 'zod';
import { imageFileSchema } from '@/schema/index.ts';

export const createProductSchema = z.object({
  treasureName: z.string().min(1, 'Product name is required'),
  seqShelvesQuantity: z.coerce
    .number()
    .min(1, 'Total shares must be at least 1'),
  unitAmount: z.coerce.number().min(0.01, 'Unit price must be at least 0.01'),
  costAmount: z.coerce.number().min(0, 'Total cost must be at least 0'),
  categoryIds: z.coerce.number({
    required_error: 'Category is required',
    invalid_type_error: 'Category must be a number',
  }),
  desc: z.string().optional(),

  treasureCoverImg: imageFileSchema,
});
