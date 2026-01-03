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
  FormDateField,
  FormRichTextField, // ✨ 别忘了引入这个
} from '@repo/ui';
import { useRequest } from 'ahooks';
import { SmartImage } from '@/components/ui/SmartImage.tsx';

// 扩展类型以包含临时表单字段
type ProductFormInputs = z.infer<typeof createProductSchema> & {
  bonusItemName?: string;
  bonusItemImg?: string | File;
  bonusWinnerCount?: number;
};

export const EditProductFormModal = (
  categories: Category[],
  confirm: () => void,
  product: Product,
) => {
  const addToast = useToastStore((s) => s.addToast);

  const { run: updateProduct, loading } = useRequest(productApi.updateProduct, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Product updated successfully');
      confirm();
    },
  });

  const upload = useRequest(uploadApi.uploadMedia, {
    manual: true,
  });

  // 解析 bonusConfig (后端存的是 JSON，可能是对象，也可能是 null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bonusConfig = product.bonusConfig as any;

  const form = useForm<ProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      // --- 1. 基础信息回填 ---
      treasureName: product.treasureName,
      seqShelvesQuantity: product.seqShelvesQuantity, // 映射库存
      unitAmount: product.unitAmount,
      costAmount: product.costAmount,
      categoryIds: product.categories?.[0]?.categoryId, // 取第一个分类ID
      treasureCoverImg: product.treasureCoverImg,
      desc: product.desc,
      ruleContent: product.ruleContent,

      // --- 2. 物流与拼团回填 ---
      shippingType: product.shippingType ?? 1,
      weight: product.weight ?? 0,
      groupSize: product.groupSize ?? 5,
      groupTimeLimit: product.groupTimeLimit ?? 86400,

      // --- 3. 时间回填 (Timestamp -> Date) ---
      salesStartAt: product.salesStartAt
        ? new Date(product.salesStartAt)
        : undefined,
      salesEndAt: product.salesEndAt ? new Date(product.salesEndAt) : undefined,

      // --- 4. 赠品回填 (Flattening) ---
      bonusItemName: bonusConfig?.bonusItemName || '',
      bonusItemImg: bonusConfig?.bonusItemImg || '',
      bonusWinnerCount: bonusConfig?.winnerCount || 1,
    },
  });

  const handleEditorUpload = async (file: File): Promise<string> => {
    try {
      const res = await upload.runAsync(file);
      return res.url;
    } catch (error) {
      addToast('error', 'Editor image upload failed');
      throw error;
    }
  };

  const onSubmit = async (values: ProductFormInputs) => {
    try {
      // 1. 处理主图上传 (如果没有变，它就是 string url；如果变了，是 File)
      let coverUrl: string;
      if (values.treasureCoverImg instanceof File) {
        const { url } = await upload.runAsync(values.treasureCoverImg);
        coverUrl = url;
      } else {
        coverUrl = values.treasureCoverImg as string;
      }

      // 2. 处理赠品图上传
      let bonusImgUrl: string = '';
      if (values.bonusItemImg instanceof File) {
        const { url } = await upload.runAsync(values.bonusItemImg);
        bonusImgUrl = url;
      } else {
        bonusImgUrl = (values.bonusItemImg as string) || '';
      }

      console.log(values.categoryIds);

      // 3. 组装 Payload
      const payload: CreateProduct = {
        treasureName: values.treasureName,
        seqShelvesQuantity: Number(values.seqShelvesQuantity), // 映射回 stockQuantity
        unitAmount: Number(values.unitAmount),
        costAmount: Number(values.costAmount),
        categoryIds: [Number(values.categoryIds)],
        treasureCoverImg: coverUrl,
        desc: values.desc,
        ruleContent: values.ruleContent,

        // 新增字段
        shippingType: Number(values.shippingType),
        weight: Number(values.weight),
        groupSize: Number(values.groupSize),
        groupTimeLimit: Number(values.groupTimeLimit),

        // 时间转换: Date -> Timestamp
        salesStartAt: values.salesStartAt
          ? new Date(values.salesStartAt).getTime()
          : undefined,
        salesEndAt: values.salesEndAt
          ? new Date(values.salesEndAt).getTime()
          : undefined,

        // 组装 Bonus Config
        bonusConfig: values.bonusItemName
          ? {
              bonusItemName: values.bonusItemName,
              bonusItemImg: bonusImgUrl,
              winnerCount: Number(values.bonusWinnerCount || 1),
              allowRobot: true,
            }
          : undefined,
      };

      updateProduct(product.treasureId, payload);
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to update product');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 h-[600px] overflow-y-auto px-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          {/* 左侧：表单字段 */}
          <div className="space-y-6">
            {/* --- Block 1: Basic Info --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-sm text-gray-900">
                📦 Basic Information
              </h3>
              <FormTextField
                required
                autoComplete="off"
                name="treasureName"
                label="Product Name"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormTextField
                  required
                  name="seqShelvesQuantity"
                  label="Stock (Shares)"
                  type="number"
                />
                <FormTextField
                  required
                  name="unitAmount"
                  label="Unit Price"
                  type="number"
                  renderRight={() => (
                    <span className="text-xs text-gray-500">₱</span>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormTextField
                  required
                  name="costAmount"
                  label="Total Cost"
                  type="number"
                  renderRight={() => (
                    <span className="text-xs text-gray-500">₱</span>
                  )}
                />
                <FormSelectField
                  required
                  name="categoryIds"
                  label="Category"
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id.toString(),
                  }))}
                />
              </div>
            </div>

            {/* --- Block 2: Sales Duration --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
              <h3 className="font-semibold text-sm text-gray-900">
                ⏰ Sales Duration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDateField name="salesStartAt" label="Start Time" />
                <FormDateField name="salesEndAt" label="End Time" />
              </div>
            </div>

            {/* --- Block 3: Logistics --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-sm text-gray-900">
                🚚 Logistics & Group
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormSelectField
                  name="shippingType"
                  label="Shipping Type"
                  options={[
                    { label: 'Physical Shipping', value: '1' },
                    { label: 'No Shipping', value: '2' },
                  ]}
                />
                <FormTextField
                  name="weight"
                  label="Weight (kg)"
                  type="number"
                  renderRight={() => (
                    <span className="text-xs text-gray-500">0.01</span>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormTextField
                  name="groupSize"
                  label="Group Size"
                  type="number"
                />
                <FormTextField
                  name="groupTimeLimit"
                  label="Time Limit (Sec)"
                  type="number"
                />
              </div>
            </div>

            {/* --- Block 4: Bonus Config --- */}
            <div className="space-y-4 p-4 border rounded-lg border-yellow-200 bg-yellow-50/30">
              <h3 className="font-semibold text-sm text-yellow-800">
                🎁 Bonus Prize Config
              </h3>
              <FormTextField name="bonusItemName" label="Bonus Item Name" />
              <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                <div className="flex-1">
                  <FormTextField
                    name="bonusWinnerCount"
                    label="Winners Count"
                    type="number"
                  />
                </div>
              </div>
              <FormMediaUploaderField
                name="bonusItemImg"
                label="Gift Img"
                maxFileCount={1}
              />
            </div>

            <FormRichTextField
              name="desc"
              label="Product Description"
              onUpload={handleEditorUpload}
              // 这里的 className 可以帮助我们通过 CSS 限制高度
              className="min-h-[300px]"
            />

            <FormRichTextField
              name="ruleContent"
              label="Rules Content"
              onUpload={handleEditorUpload}
              className="min-h-[200px]"
              placeholder="Write the lucky draw rules or prize details here..."
            />
          </div>

          {/* 右侧：主图上传 */}
          <div className="flex flex-col">
            <div className="sticky top-0">
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
              <p className="text-xs text-gray-500 mt-2">
                Main product image displayed on the card.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3  sticky bottom-0 z-10">
          <Button isLoading={loading || upload.loading} type="submit">
            Confirm Update
          </Button>
        </div>
      </form>
    </Form>
  );
};
