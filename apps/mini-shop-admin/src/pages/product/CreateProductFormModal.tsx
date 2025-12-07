import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore';
import { productApi } from '@/api';
import { z } from 'zod';
import { createProductSchema } from '@/schema/productSchema.ts';
import { Category, CreateProduct } from '@/type/types.ts';
import {
  Button,
  Form,
  FormMediaUploaderField,
  FormSelectField,
  FormTextField,
} from '@repo/ui';
import { FormTextarea } from '@repo/ui/form/FormTextarea.tsx';
import { FormTextareaField } from '@repo/ui/form/FormTextareaField.tsx';

type ProductFormInputs = z.infer<typeof createProductSchema>;

export const CreateProductFormModal = (
  categories: Category[],
  close: () => void,
) => {
  const addToast = useToastStore((s) => s.addToast);

  const form = useForm<ProductFormInputs>({
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

  /*const unitAmount = watch('unitAmount');
  const seqShelvesQuantity = watch('seqShelvesQuantity');
  const costAmount = watch('costAmount');*/

  /*const totalRevenue = unitAmount * seqShelvesQuantity;
  const profit = totalRevenue - costAmount;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;*/

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <FormTextField
              required
              name="treasureName"
              label="Product Name"
              placeholder="e.g. iPhone 15 Pro Max"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextField
                required
                name="seqShelvesQuantity"
                label="Total Shares"
                type="number"
              />
              <FormTextField
                required
                name="unitAmount"
                label="Unit Price"
                type="number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextField
                required
                name="costAmount"
                label="Total Cost"
                type="number"
              />
              <FormSelectField
                required
                name="categoryIds"
                label="Categories"
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </div>

            <FormTextareaField name="desc" label="Description" />
          </div>

          <div className="flex flex-col">
            <FormMediaUploaderField
              name="treasureCoverImg"
              label="Cover Image"
              maxFileCount={1}
            />
          </div>
        </div>

        {/* 底部按钮区域保持不变 */}
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit">Create Product</Button>
        </div>
      </form>
    </Form>
  );
};
