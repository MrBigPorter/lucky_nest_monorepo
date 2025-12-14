import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequest } from 'ahooks';
import {
  CreateCouponSchema,
  CreateCouponSchemaFormInput,
} from '@/schema/couponSchema.ts';
import {
  Button,
  Form,
  FormDateField,
  FormSelectField,
  FormTextField,
} from '@repo/ui';
import { FormTextareaField } from '@repo/ui/form/FormTextareaField.tsx';
import {
  DISCOUNT_TYPE_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  VALID_TYPE_OPTIONS,
  COUPON_TYPE_OPTIONS,
  DISCOUNT_TYPE,
  VALID_TYPE,
} from '@lucky/shared';
import { couponApi } from '@/api';
import { Coupon, CreateCouponPayload } from '@/type/types.ts'; // 假设你的完整 Coupon 类型在这里

interface CouponFormModalProps {
  close: () => void;
  confirm: () => void;
  editingData?: Coupon;
}

const transformFormToPayload = (
  values: CreateCouponSchemaFormInput,
): CreateCouponPayload => {
  const payload: CreateCouponPayload = {
    ...values,
    discountValue: Number(values.discountValue),
    minPurchase: Number(values.minPurchase),
    totalQuantity: Number(values.totalQuantity),
    perUserLimit: Number(values.perUserLimit),
    couponType: Number(values.couponType) as CreateCouponPayload['couponType'],
    discountType: Number(
      values.discountType,
    ) as CreateCouponPayload['discountType'],
    maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : undefined,
    issueType: Number(values.issueType) as CreateCouponPayload['issueType'],
    validType: Number(values.validType) as CreateCouponPayload['validType'],
    validStartAt: values.validStartAt
      ? new Date(values.validStartAt)
      : undefined,
    validEndAt: values.validEndAt ? new Date(values.validEndAt) : undefined,
    validDays: values.validDays ? Number(values.validDays) : undefined,
  };

  if (payload.couponCode === '') {
    payload.couponCode = undefined;
  }

  if (payload.discountType !== DISCOUNT_TYPE.PERCENTAGE) {
    payload.maxDiscount = undefined;
  }

  if (payload.validType === VALID_TYPE.DAYS_AFTER_RECEIVE) {
    payload.validStartAt = undefined;
    payload.validEndAt = undefined;
  }

  return payload;
};

const transformPayloadToForm = (
  payload: Coupon,
): Partial<CreateCouponSchemaFormInput> => {
  return {
    ...payload,
    discountValue: Number(payload.discountValue),
    minPurchase: Number(payload.minPurchase),
    totalQuantity: Number(payload.totalQuantity),
    perUserLimit: Number(payload.perUserLimit),
    couponType: Number(payload.couponType),
    couponCode: payload.couponCode || undefined,
    discountType: Number(payload.discountType),
    maxDiscount: payload.maxDiscount ? Number(payload.maxDiscount) : undefined,
    issueType: Number(payload.issueType),
    validType: Number(payload.validType),
    validEndAt: payload.validEndAt ? new Date(payload.validEndAt) : undefined,
    validStartAt: payload.validStartAt
      ? new Date(payload.validStartAt)
      : undefined,
    validDays: payload.validDays ? Number(payload.validDays) : undefined,
  };
};

export const CouponModal: React.FC<CouponFormModalProps> = ({
  close,
  confirm,
  editingData,
}) => {
  const isEditMode = !!editingData;

  const isCriticalDisabled = !!editingData?.issuedQuantity;

  const form = useForm<CreateCouponSchemaFormInput>({
    resolver: zodResolver(CreateCouponSchema),
    defaultValues: {
      couponName: '',
      couponCode: undefined,
      issueType: 1,
      couponType: 1,
      discountType: 1,
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: undefined,
      totalQuantity: 0,
      perUserLimit: 1,
      validType: 1,
      validDays: 7,
      validStartAt: undefined,
      validEndAt: undefined,
      subTitle: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!editingData) return;
    const formData = transformPayloadToForm(editingData);
    form.reset(formData);
  }, [editingData, form]);

  // 核心改动：统一处理提交逻辑
  const { run, loading } = useRequest(
    async (values: CreateCouponSchemaFormInput) => {
      const data: CreateCouponPayload = transformFormToPayload(values);

      if (isEditMode && editingData) {
        // 编辑接口
        return couponApi.update(editingData.id, data);
      } else {
        // 创建接口
        return couponApi.create(data);
      }
    },
    {
      manual: true,
      onSuccess: () => {
        // 可以根据模式不同显示不同的 toast
        console.log(isEditMode ? 'Updated' : 'Created');
        confirm();
      },
    },
  );

  const discountType = form.watch('discountType');
  const validType = form.watch('validType');

  const discountTypeNum = Number(discountType || DISCOUNT_TYPE.FIXED_AMOUNT);
  const validTypeNum = Number(validType || VALID_TYPE.RANGE);

  const onSubmit = (values: CreateCouponSchemaFormInput) => {
    run(values);
  };

  return (
    <div className="space-y-6">
      {/* 可以在这里加个标题区分 */}
      <div className="text-lg font-semibold">
        {isEditMode ? 'Edit Coupon' : 'Create Coupon'}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              required
              name="couponName"
              label="Coupon name"
              placeholder="e.g. New user ₱100-₱10"
            />

            {/* Coupon Code 通常创建后也不建议随便改，看你业务需求，这里假设可以改 */}
            <FormTextField
              disabled={!!editingData?.couponCode}
              name="couponCode"
              label="Coupon code (optional)"
              placeholder="VIP666"
            />

            <FormSelectField
              required
              label="Issue type"
              name="issueType"
              // 假设 IssueType 也是关键字段，不能改
              disabled={isCriticalDisabled}
              options={ISSUE_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            {/* 🔥 关键字段开始锁定 */}
            <FormSelectField
              required
              label="Coupon type"
              name="couponType"
              disabled={isCriticalDisabled}
              options={COUPON_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            <FormSelectField
              required
              label="Discount type"
              name="discountType"
              disabled={isCriticalDisabled}
              options={DISCOUNT_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value.toString(),
              }))}
            />

            <FormTextField
              required
              name="discountValue"
              type="number"
              disabled={isCriticalDisabled}
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
              disabled={isCriticalDisabled}
            />

            {discountTypeNum === DISCOUNT_TYPE.PERCENTAGE && (
              <FormTextField
                required
                label="Max discount (₱)"
                type="number"
                name="maxDiscount"
                // Max discount 通常也属于关键金额信息
                disabled={isCriticalDisabled}
              />
            )}
            {/* 🔥 关键字段锁定结束 */}

            {/* Total Quantity 通常可以增加，但不建议减少，这里先不做特殊处理，或者允许修改 */}
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

            {/* Valid Type 也是关键字段 */}
            <FormSelectField
              required
              label="Valid type"
              name="validType"
              disabled={isCriticalDisabled}
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
                disabled={isCriticalDisabled}
              />
            )}

            {validTypeNum === VALID_TYPE.RANGE && (
              <>
                <FormDateField
                  required
                  label="Valid start date"
                  name="validStartAt"
                  // 日期范围通常也不让大改，看业务
                  disabled={isCriticalDisabled}
                />
                <FormDateField
                  required
                  label="Valid end date"
                  name="validEndAt"
                  disabled={isCriticalDisabled}
                />
              </>
            )}

            <div className="sm:col-span-2">
              <FormTextareaField
                name="subTitle"
                label="Subtitle (optional)"
                placeholder="e.g. Valid on orders over ₱100"
              />
            </div>

            <div className="sm:col-span-2">
              <FormTextareaField
                name="description"
                label="Description (optional)"
                placeholder="e.g. This is a coupon for new users only"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button isLoading={loading} type="submit" variant="primary">
              {isEditMode ? 'Save changes' : 'Create coupon'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
