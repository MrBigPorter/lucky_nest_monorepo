import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore';
import { productApi, uploadApi } from '@/api';
import { z } from 'zod';
import { createProductSchema } from '@/schema/productSchema.ts';
import { Category, CreateProduct, Product } from '@/type/types.ts';
import {
  Button,
  Form,
  FormMediaUploaderField,
  FormSelectField,
  FormTextField,
} from '@repo/ui';
import { FormTextareaField } from '@repo/ui/form/FormTextareaField.tsx';
import { useRequest } from 'ahooks';
import { SmartImage } from '@/components/ui/SmartImage.tsx';

type ProductFormInputs = z.infer<typeof createProductSchema>;

export const EditProductFormModal = (
  categories: Category[],
  close: () => void,
  confirm: () => void,
  product: Product,
) => {
  const addToast = useToastStore((s) => s.addToast);

  const { run: updateProduct, loading } = useRequest(productApi.updateProduct, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Product created successfully');
      confirm();
    },
  });

  const form = useForm<ProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      treasureName: product.treasureName,
      seqShelvesQuantity: product.seqShelvesQuantity,
      unitAmount: product.unitAmount,
      costAmount: product.costAmount,
      categoryIds: product.categories?.[0]?.categoryId,
      treasureCoverImg: product.treasureCoverImg,
      desc: product.desc,
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

      updateProduct(product.treasureId, payload);
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
                  value: c.id.toString(),
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
              renderImage={({ src, alt, className }) => (
                <SmartImage
                  src={src}
                  alt={alt}
                  width={400}
                  height={400}
                  className={className}
                  imgClassName="w-64 h-64 rounded-md object-cover"
                  layout="constrained"
                />
              )}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button isLoading={loading} type="submit">
            Confirm
          </Button>
        </div>
      </form>
    </Form>
  );
};
