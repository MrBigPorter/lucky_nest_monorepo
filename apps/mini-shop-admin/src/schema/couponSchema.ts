import { z } from 'zod';
import { COUPON_TYPE, ISSUE_TYPE, VALID_TYPE } from '@lucky/shared';

export const CreateCouponSchema = z
  .object({
    couponName: z
      .string()
      .min(1, 'Coupon name is required')
      .max(200, 'Coupon name must be at most 200 characters'),
    couponCode: z
      .string()
      .max(50, 'Coupon code must be at most 50 characters')
      .optional(),
    couponType: z.coerce
      .number()
      .int()
      .refine((v) => [1, 2, 3].includes(v), {
        message:
          'Coupon type must be one of: 1 (Full Reduction), 2 (Discount), 3 (No Threshold)',
      }),
    discountType: z.coerce
      .number()
      .int()
      .refine((v) => [1, 2].includes(v), {
        message: 'Discount type must be one of: 1 (Amount), 2 (Percentage)',
      }),
    discountValue: z.coerce
      .number()
      .min(0.01, 'Discount value must be at least 0.01'),
    minPurchase: z.coerce
      .number()
      .min(0, 'Minimum purchase must be at least 0'),
    maxDiscount: z.coerce
      .number()
      .min(0, 'Max discount must be at least 0')
      .optional(),
    issueType: z.coerce
      .number()
      .int()
      .refine((v) => [1, 2, 3, 4].includes(v), {
        message:
          'Issue type must be one of: 1 (System), 2 (Claim), 3 (Redeem Code), 4 (Invite)',
      }),
    totalQuantity: z.coerce
      .number()
      .int()
      .min(-1, 'Total quantity must be -1 (unlimited) or greater'),
    perUserLimit: z.coerce
      .number()
      .int()
      .min(1, 'Per user limit must be at least 1'),
    validType: z.coerce
      .number()
      .int()
      .refine((v) => [1, 2].includes(v), {
        message:
          'Valid type must be one of: 1 (Fixed Date Range), 2 (Days After Claim)',
      }),
    validDays: z.coerce
      .number()
      .int()
      .min(1, 'Valid days must be at least 1')
      .optional(),
    validStartAt: z
      .date({ required_error: 'Valid start date is required' })
      .optional(),
    validEndAt: z
      .date({ required_error: 'Valid end date is required' })
      .optional(),
    subTitle: z
      .string()
      .max(200, 'Subtitle must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // 1. issueType = 3 时，couponCode 必填
    if (+data.issueType === ISSUE_TYPE.REDEEM_CODE) {
      if (!data.couponCode || data.couponCode.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['couponCode'],
          message: 'Coupon code is required when issue type is Redeem Code',
        });
      }
    }
    // 2. couponType = 2 时，discountType 和 maxDiscount 必填
    if (+data.couponType === COUPON_TYPE.DISCOUNT) {
      if (data.maxDiscount === undefined || data.maxDiscount === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxDiscount'],
          message: 'Max discount is required when coupon type is Discount',
        });
      }
    }
    // 3. validType = 2 时，validDays 必填
    if (+data.validType === VALID_TYPE.DAYS_AFTER_RECEIVE) {
      if (!data.validDays || data.validDays <= 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['validDays'],
          message: 'Valid days is required when valid type is Days After Claim',
        });
      }
    }

    // 4. validType = 1 时，validStartAt 和 validEndAt 必填，且 validEndAt 要晚于 validStartAt
    if (+data.validType === VALID_TYPE.RANGE) {
      if (!data.validStartAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['validStartAt'],
          message:
            'Valid start date is required when valid type is Fixed Date Range',
        });
      }
      if (!data.validEndAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['validEndAt'],
          message:
            'Valid end date is required when valid type is Fixed Date Range',
        });
      }

      if (data.validStartAt && data.validEndAt) {
        if (data.validEndAt.getTime() < data.validStartAt.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['validEndAt'],
            message: 'Valid end date must be after valid start date',
          });
        }
      }
    }
    // 5. totalQuantity != -1 时，totalQuantity >= perUserLimit
    if (data.totalQuantity !== -1 && data.totalQuantity < data.perUserLimit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalQuantity'],
        message:
          'Total quantity must be greater than or equal to per user limit',
      });
    }
  });

export type CreateCouponSchemaFormInput = z.infer<typeof CreateCouponSchema>;
