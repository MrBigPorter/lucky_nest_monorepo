import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Input,
  Textarea,
  Button,
  Select,
  ImageUpload,
  Switch,
  Badge,
} from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { productApi } from '@/api';
import { z } from 'zod';
import { createProductSchema } from '@/pages/product/productSchema.ts';
import { Category, CreateProduct } from '@/type/types.ts';
import { BaseSelect } from '@repo/ui';

type ProductFormInputs = z.infer<typeof createProductSchema>;

export const CreateProductFormModal = (categories: Category[]) => {
  const addToast = useToastStore((s) => s.addToast);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      treasureName: '',
      seqShelvesQuantity: 0,
      unitAmount: 0,
      costAmount: 0,
      categoryIds: [],
      desc: '',
      treasureCoverImg: '',
    },
  });

  const unitAmount = watch('unitAmount');
  const seqShelvesQuantity = watch('seqShelvesQuantity');
  const costAmount = watch('costAmount');

  const totalRevenue = unitAmount * seqShelvesQuantity;
  const profit = totalRevenue - costAmount;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const onSubmit = async (values: ProductFormInputs) => {
    try {
      let coverUrl: string;
      if (values.treasureCoverImg instanceof File) {
        coverUrl = '11111';
      } else {
        coverUrl = values.treasureCoverImg;
      }

      const payload: CreateProduct = {
        treasureName: values.treasureName,
        seqShelvesQuantity: values.seqShelvesQuantity,
        unitAmount: values.unitAmount,
        costAmount: values.costAmount,
        categoryIds: values.categoryIds,
        treasureCoverImg: coverUrl,
        desc: values.desc,
      };

      await productApi.createProduct(payload);
      addToast('success', 'Product created successfully');
    } catch (e) {
      addToast('error', e?.message || 'Failed to save product');
    }
  };

  return (
    <form
      className="space-y-5 max-h-[70vh] overflow-y-auto pr-1"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="treasureName"
          control={control}
          render={({ field }) => (
            <Input
              label="Product Name"
              placeholder="e.g. iPhone 15 Pro Max"
              error={errors.treasureName?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="seqShelvesQuantity"
          control={control}
          render={({ field }) => (
            <Input
              label="Total Shares"
              type="number"
              min={1}
              error={errors.seqShelvesQuantity?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="unitAmount"
          control={control}
          render={({ field }) => (
            <Input
              label="Unit Price"
              type="number"
              min={0}
              step="0.01"
              error={errors.unitAmount?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="costAmount"
          control={control}
          render={({ field }) => (
            <Input
              label="Total Cost"
              type="number"
              min={0}
              step="0.01"
              error={errors.costAmount?.message}
              {...field}
            />
          )}
        />
      </div>

      {/* 分类 + 封面 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="categoryIds"
          control={control}
          render={({ field }) => (
            <BaseSelect
              label="Categories"
              multiple
              value={field.value}
              onChange={field.onChange}
              options={categories.map((c) => ({
                label: c.name,
                value: String(c.id),
              }))}
              error={errors.categoryIds?.message as string | undefined}
            />
          )}
        />

        <Controller
          name="treasureCoverImg"
          control={control}
          render={({ field }) => (
            <ImageUpload
              label="Cover Image"
              value={field.value}
              onChange={field.onChange}
              error={errors.treasureCoverImg?.message}
            />
          )}
        />
      </div>

      {/* 描述 */}
      <Controller
        name="desc"
        control={control}
        render={({ field }) => (
          <Textarea
            label="Description"
            rows={4}
            placeholder="Describe this treasure..."
            error={errors.desc?.message}
            {...field}
          />
        )}
      />

      {/* 状态 / 预览统计 */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                checked={field.value === 1}
                onChange={(checked) => field.onChange(checked ? 1 : 0)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {field.value === 1 ? 'Online / Active' : 'Offline'}
              </span>
            </div>
          )}
        />

        <div className="flex gap-3 text-xs md:text-sm">
          <Badge color={profit >= 0 ? 'green' : 'red'}>
            Revenue: ₱{totalRevenue.toFixed(2)}
          </Badge>
          <Badge color={profit >= 0 ? 'green' : 'red'}>
            Profit: ₱{profit.toFixed(2)}
          </Badge>
          <Badge color={profit >= 0 ? 'green' : 'red'}>
            Margin: {margin.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button">
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Product
        </Button>
      </div>
    </form>
  );
};
