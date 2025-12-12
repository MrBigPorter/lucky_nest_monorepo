import { z } from 'zod';

export const CreateCouponSchema = z.object({
  couponName: z
    .string()
    .min(1, 'Coupon name is required')
    .max(200, 'Coupon name must be at most 200 characters'),
  couponCode: z
    .string()
    .max(50, 'Coupon code must be at most 50 characters')
    .optional(),
  couponType: z.enum(['1', '2', '3'], {
    errorMap: () => ({
      message:
        'Coupon type must be one of: 1 (Full Reduction), 2 (Discount), 3 (No Threshold)',
    }),
  }),
  discountType: z.enum(['1', '2'], {
    errorMap: () => ({
      message: 'Discount type must be one of: 1 (Amount), 2 (Percentage)',
    }),
  }),
  discountValue: z.coerce
    .number()
    .min(0.01, 'Discount value must be at least 0.01'),
  minPurchase: z.coerce.number().min(0, 'Minimum purchase must be at least 0'),
  maxDiscount: z.coerce
    .number()
    .min(0, 'Max discount must be at least 0')
    .optional(),
  issueType: z.enum(['1', '2', '3', '4'], {
    errorMap: () => ({
      message:
        'Issue type must be one of: 1 (System), 2 (Claim), 3 (Redeem Code), 4 (Invite)',
    }),
  }),
  totalQuantity: z
    .number()
    .int()
    .min(-1, 'Total quantity must be -1 (unlimited) or greater'),
  perUserLimit: z.number().int().min(1, 'Per user limit must be at least 1'),
  validType: z.enum(['1', '2'], {
    errorMap: () => ({
      message:
        'Valid type must be one of: 1 (Fixed Date Range), 2 (Days After Claim)',
    }),
  }),
  validDays: z
    .number()
    .int()
    .min(1, 'Valid days must be at least 1')
    .optional(),
  validStartAt: z.date({ required_error: 'Valid start date is required' }),
  validEndAt: z.date({ required_error: 'Valid end date is required' }),
});

export type CreateCouponSchemaFormInput = z.infer<typeof CreateCouponSchema>;
