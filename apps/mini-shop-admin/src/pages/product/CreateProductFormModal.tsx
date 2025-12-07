import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore';
import { productApi, uploadApi } from '@/api';
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
import { FormTextareaField } from '@repo/ui/form/FormTextareaField.tsx';
import { useRequest } from 'ahooks';

type ProductFormInputs = z.infer<typeof createProductSchema>;

export const CreateProductFormModal = (
  categories: Category[],
  close: () => void,
) => {
  const addToast = useToastStore((s) => s.addToast);

  const { run: createProduct, loading } = useRequest(productApi.createProduct, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Product created successfully');
      close();
    },
  });

  const form = useForm<ProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      treasureName: '',
      seqShelvesQuantity: 0,
      unitAmount: 0,
      costAmount: 0,
      categoryIds: undefined,
      desc: '',
      treasureCoverImg: '',
    },
  });

  const onSubmit = async (values: ProductFormInputs) => {
    try {
      let coverUrl: string;
      if (values.treasureCoverImg instanceof File) {
        const { url } = await uploadApi.uploadMedia(values.treasureCoverImg);
        coverUrl = url;
      } else {
        coverUrl = values.treasureCoverImg;
      }

      const payload: CreateProduct = {
        treasureName: values.treasureName,
        seqShelvesQuantity: values.seqShelvesQuantity,
        unitAmount: values.unitAmount,
        costAmount: values.costAmount,
        categoryIds: [values.categoryIds],
        treasureCoverImg: coverUrl,
        desc: values.desc,
      };

      createProduct(payload);
    } catch (e) {
      addToast('error', 'Failed to save product');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <FormTextField
              required
              autoComplete="off"
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

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button isLoading={loading} type="submit">
            Create Product
          </Button>
        </div>
      </form>
    </Form>
  );
};
