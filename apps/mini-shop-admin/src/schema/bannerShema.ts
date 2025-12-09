import { z } from 'zod';
import { imageFileSchema } from '@/schema/index.ts';

export const BannerShema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  bannerImgUrl: imageFileSchema,
  fileType: z.coerce.number().int().default(1), // 1 image 2 video
  bannerCate: z.number().min(1), // 1 home 2 activity 3 product 4 custom
  jumpCate: z.number(), // 0 none 1 treasure 2 category 3 external link
  jumpUrl: z.string().optional().or(z.literal('')),

  //relatedTitleId: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),

  activityAtStart: z.date().optional().nullable(),
  activityAtEnd: z.date().optional().nullable(),
  //state: z.number().int().default(1), // 0 inactive 1 active
});

export type BannerFormInputs = z.infer<typeof BannerShema>;
