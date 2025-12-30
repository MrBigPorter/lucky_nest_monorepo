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
  FormDateField,
  FormRichTextField,
} from '@repo/ui';
// 如果 @repo/ui index 没导出，就用相对路径:

import { useRequest } from 'ahooks';

// ... 类型定义保持不变 ...
type ProductFormInputs = z.infer<typeof createProductSchema> & {
  bonusItemName?: string;
  bonusItemImg?: string | File;
  bonusWinnerCount?: number;
};

export const CreateProductFormModal = (
  categories: Category[],
  confirm: () => void,
) => {
  const addToast = useToastStore((s) => s.addToast);

  // 创建商品请求
  const { run: createProduct, loading } = useRequest(productApi.createProduct, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Product created successfully');
      confirm();
    },
  });

  // 上传请求
  const upload = useRequest(uploadApi.uploadMedia, {
    manual: true,
  });

  // 2. 定义给富文本编辑器用的上传函数
  // 这个函数会作为 prop 传给组件
  const handleEditorUpload = async (file: File): Promise<string> => {
    try {
      const res = await upload.runAsync(file);
      return res.url; // 必须返回图片 URL 字符串
    } catch (error) {
      addToast('error', 'Failed to upload editor image');
      throw error;
    }
  };

  const form = useForm<ProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      treasureName: '',
      seqShelvesQuantity: 0,
      unitAmount: 0,
      costAmount: 0,
      categoryIds: undefined,
      desc: '', // 富文本内容会绑定到这里
      treasureCoverImg: '',
      shippingType: 1,
      weight: 0,
      groupSize: 5,
      groupTimeLimit: 86400,
      salesStartAt: undefined,
      salesEndAt: undefined,
      bonusItemName: '',
      bonusItemImg: '',
      bonusWinnerCount: 1,
    },
  });

  const onSubmit = async (values: ProductFormInputs) => {
    // ... 保持原有提交逻辑不变 ...
    try {
      let coverUrl: string = '';
      if (values.treasureCoverImg instanceof File) {
        const res = await upload.runAsync(values.treasureCoverImg);
        coverUrl = res.url;
      } else {
        coverUrl = values.treasureCoverImg as string;
      }

      let bonusImgUrl: string = '';
      if (values.bonusItemImg instanceof File) {
        const res = await upload.runAsync(values.bonusItemImg);
        bonusImgUrl = res.url;
      } else if (typeof values.bonusItemImg === 'string') {
        bonusImgUrl = values.bonusItemImg;
      }

      const payload: CreateProduct = {
        treasureName: values.treasureName,
        seqShelvesQuantity: Number(values.seqShelvesQuantity),
        unitAmount: Number(values.unitAmount),
        costAmount: Number(values.costAmount),
        categoryIds: [Number(values.categoryIds)],
        treasureCoverImg: coverUrl,

        // desc 字段现在包含了 HTML 字符串
        desc: values.desc,

        shippingType: Number(values.shippingType),
        weight: Number(values.weight),
        groupSize: Number(values.groupSize),
        groupTimeLimit: Number(values.groupTimeLimit),
        salesStartAt: values.salesStartAt
          ? new Date(values.salesStartAt).getTime()
          : undefined,
        salesEndAt: values.salesEndAt
          ? new Date(values.salesEndAt).getTime()
          : undefined,
        bonusConfig: values.bonusItemName
          ? {
              bonusItemName: values.bonusItemName,
              bonusItemImg: bonusImgUrl,
              winnerCount: Number(values.bonusWinnerCount || 1),
              allowRobot: true,
            }
          : undefined,
      };

      createProduct(payload);
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to save product');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 h-[600px] overflow-y-auto px-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          <div className="space-y-6">
            {/* Basic Info Block */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-sm text-gray-900">
                📦 Basic Information
              </h3>
              <FormTextField
                required
                name="treasureName"
                label="Product Name"
                placeholder="e.g. Lucky Badge"
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelectField
                  required
                  name="categoryIds"
                  label="Category"
                  options={categories.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                />
                <FormTextField
                  required
                  name="seqShelvesQuantity"
                  label="Stock (Shares)"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormTextField
                  required
                  name="unitAmount"
                  label="Selling Price"
                  type="number"
                  renderRight={() => (
                    <span className="text-xs text-gray-500">₱</span>
                  )}
                />
                <FormTextField
                  name="costAmount"
                  label="Cost"
                  type="number"
                  renderRight={() => (
                    <span className="text-xs text-gray-500">₱</span>
                  )}
                />
              </div>
            </div>

            {/* Sales Duration Block */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
              <h3 className="font-semibold text-sm text-gray-900">
                ⏰ Sales Duration (Pre-sale)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDateField
                  name="salesStartAt"
                  label="Start Time"
                  placeholder="Immediate"
                />
                <FormDateField
                  name="salesEndAt"
                  label="End Time"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Logistics Block */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-sm text-gray-900">
                🚚 Logistics & Group Rules
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

            {/* Bonus Block */}
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

            {/* 3. [替换] 将原来的 FormTextareaField 替换为 FormRichTextField */}
            {/* 记得传入 onUpload 方法 */}
            <FormRichTextField
              name="desc"
              label="Product Description"
              placeholder="Enter details, insert images..."
              onUpload={handleEditorUpload}
            />
          </div>

          {/* 右侧：主图上传区 */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-0">
              <FormMediaUploaderField
                name="treasureCoverImg"
                label="Product Cover Image"
                maxFileCount={1}
              />
              <p className="text-xs text-gray-500 mt-2">
                This image will be displayed as the main product card.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 z-10">
          <Button isLoading={loading || upload.loading} type="submit">
            Confirm Update
          </Button>
        </div>
      </form>
    </Form>
  );
};
