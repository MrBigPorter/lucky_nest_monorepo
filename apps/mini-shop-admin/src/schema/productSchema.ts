import { z } from 'zod';
import { imageFileSchema } from '@/schema/index.ts';

export const createProductSchema = z.object({
  treasureName: z.string().min(1, 'Product name is required'),
  seqShelvesQuantity: z.coerce
    .number()
    .min(1, 'Total shares must be at least 1'),
  unitAmount: z.coerce.number().min(0, 'Unit price must be at least 0'),
  costAmount: z.coerce.number().min(0, 'Total cost must be at least 0'),
  categoryIds: z
    .array(z.coerce.number())
    .min(1, 'Please select at least 1 category'),
  desc: z.string().optional(),
  treasureCoverImg: z.union([
    z.string().min(1, 'Cover image is required').url('Invalid image URL'),
    imageFileSchema,
  ]),
});
