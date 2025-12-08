import { z } from 'zod';

export const ActSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  key: z.string().min(1, 'Key is required'),
  imgStyleType: z.coerce
    .number({
      required_error: 'Image Style Type is required',
      invalid_type_error: 'Image Style Type must be a number',
    })
    .int('Image Style Type must be an integer')
    .refine((val) => [1, 2, 3].includes(val), {
      message: 'Image Style Type must be one of 1, 2, or 3',
    }),
  status: z.coerce
    .number({
      required_error: 'Status is required',
      invalid_type_error: 'Status must be a number',
    })
    .int('Status must be an integer')
    .refine((val) => [0, 1].includes(val), {
      message: 'Status must be either 0 (INACTIVE) or 1 (ACTIVE)',
    }),
  limit: z.coerce
    .number({
      required_error: 'Limit is required',
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .min(10, 'Limit must be at least 10'),
  startAt: z.date().optional(),
  endAt: z.date().optional(),
});
