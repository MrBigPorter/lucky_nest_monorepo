import React from 'react';
import { useForm } from 'react-hook-form';
import {
  CreateCouponSchema,
  CreateCouponSchemaFormInput,
} from '@/schema/couponSchema.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  FormDateField,
  FormSelectField,
  FormTextField,
} from '@repo/ui';
import {
  DISCOUNT_TYPE_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  VALID_TYPE_OPTIONS,
  COUPON_TYPE_OPTIONS,
  DISCOUNT_TYPE,
  VALID_TYPE,
} from '@lucky/shared';
import { useRequest } from 'ahooks';
import { couponApi } from '@/api';
import { CreateCouponPayload } from '@/type/types.ts';

interface CreateCouponModalProps {
  close: () => void;
  confirm: () => void;
}

export const CreateCouponModal: React.FC<CreateCouponModalProps> = ({
  close,
  confirm,
}) => {
  const form = useForm<CreateCouponSchemaFormInput>({
    resolver: zodResolver(CreateCouponSchema),
    defaultValues: {
      couponName: '',
      couponCode: '',
      issueType: '1',
      couponType: '1',
      discountType: '1',
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: undefined,
      totalQuantity: 0,
      perUserLimit: 1,
      validType: '1',
      validDays: 7,
      validStartAt: undefined,
      validEndAt: undefined,
    },
  });

  const { run, loading } = useRequest(couponApi.create, {
    manual: true,
    onSuccess: () => {
      console.log('Coupon created successfully');
      confirm();
    },
  });

  const discountType = form.watch('discountType');
  const validType = form.watch('validType');

  const discountTypeNum = Number(discountType || DISCOUNT_TYPE.FIXED_AMOUNT);
  const validTypeNum = Number(validType || VALID_TYPE.RANGE);

  const onSubmit = async (values: CreateCouponPayload) => {
    run(values);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              required
              name="couponName"
              label="Coupon name"
              placeholder="e.g. New user ₱100-₱10"
            />
            <FormTextField
              name="couponCode"
              label="Coupon code (optional)"
              placeholder="VIP666"
            />
            <FormSelectField
              required
              label="Issue type"
              name="issueType"
              options={ISSUE_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />
            <FormSelectField
              required
              label="Coupon type"
              name="couponType"
              options={COUPON_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            <FormSelectField
              required
              label="Discount type"
              name="discountType"
              options={DISCOUNT_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            <FormTextField
              required
              name="discountValue"
              type="number"
              label={
                discountTypeNum === DISCOUNT_TYPE.PERCENTAGE
                  ? 'Discount (%)'
                  : 'Discount amount (₱)'
              }
            />

            <FormTextField
              required
              label="Min. purchase (₱)"
              name="minPurchase"
              type="number"
            />

            {discountTypeNum === DISCOUNT_TYPE.PERCENTAGE && (
              <FormTextField
                label="Max discount (₱)"
                type="number"
                name="maxDiscount"
              />
            )}

            <FormTextField
              required
              label="Total quantity (-1 = unlimited)"
              type="number"
              name="totalQuantity"
            />
            <FormTextField
              required
              label="Per user limit"
              type="number"
              name="perUserLimit"
            />

            <FormSelectField
              required
              label="Valid type"
              name="validType"
              options={VALID_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            {validTypeNum === VALID_TYPE.DAYS_AFTER_RECEIVE && (
              <FormTextField
                required
                label="Valid days after claim"
                type="number"
                name="validDays"
              />
            )}

            {validTypeNum === VALID_TYPE.RANGE && (
              <>
                <FormDateField label="Valid start date" name="validStartAt" />
                <FormDateField label="Valid end date" name="validEndAt" />
              </>
            )}
          </div>

          {/* ========= 底部按钮 ========= */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button isLoading={loading} type="submit" variant="primary">
              Create coupon
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
