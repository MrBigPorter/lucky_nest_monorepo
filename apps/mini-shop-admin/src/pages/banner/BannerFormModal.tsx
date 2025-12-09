import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequest } from 'ahooks';
import { bannerApi, productApi, uploadApi } from '@/api'; // 假设你有这些API
import {
  Button,
  Form,
  FormTextField,
  FormSelectField,
  FormDateField,
  FormCheckboxField,
  FormMediaUploaderField,
} from '@repo/ui';
import { useToastStore } from '@/store/useToastStore';
import { JUMP_CATE, BANNER_CATE } from '@lucky/shared';
import { Link, Package, X } from 'lucide-react';
import { Product } from '@/type/types';
import { BannerFormInputs, BannerShema } from '@/schema/bannerShema.ts';

interface Props {
  close: () => void;
  confirm: () => void;
  editingData?: any; // 实际是 Banner 类型
  defaultCate?: number; // 当前所在的 Tab
}

export const BannerFormModal: React.FC<Props> = ({
  close,
  confirm,
  editingData,
}) => {
  const addToast = useToastStore((s) => s.addToast);
  const [showProductSelector, setShowProductSelector] = useState(false);
  // 用来展示已选产品的详情（因为表单里只存了 ID）
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<BannerFormInputs>({
    resolver: zodResolver(BannerShema),
    defaultValues: {
      title: '',
      bannerImgUrl: '',
      fileType: 1,
      bannerCate: 0,
      jumpCate: 0,
      sortOrder: 0,
      activityAtStart: undefined,
      activityAtEnd: undefined,
    },
  });

  // 👀 监听跳转类型变化，实现联动
  const jumpCate = useWatch({ control: form.control, name: 'jumpCate' });
  const bannerCate = useWatch({ control: form.control, name: 'bannerCate' });
  const relatedId = useWatch({ control: form.control, name: 'relatedTitleId' });

  // 如果是编辑模式，且有关联产品ID，查一下产品详情用于回显
  useRequest(
    async () => {
      if (
        editingData?.relatedTitleId &&
        editingData.jumpCate === JUMP_CATE.TREASURE
      ) {
        return productApi.getDetail(editingData.relatedTitleId);
      }
    },
    {
      ready: !!editingData,
      onSuccess: (data) => setSelectedProduct(data),
    },
  );

  const { run: submit, loading } = useRequest(
    async (values) => {
      let bannerImgUrl: string;

      if (values.bannerImgUrl instanceof File) {
        const { url } = await uploadApi.uploadMedia(values.bannerImgUrl);
        bannerImgUrl = url;
      } else {
        bannerImgUrl = values.bannerImgUrl;
      }

      const payload = {
        ...values,
        bannerImgUrl,
      };

      if (editingData) {
        console.log(payload);
        return bannerApi.update(editingData.id, payload);
      }
      return bannerApi.create(payload);
    },
    {
      manual: true,
      onSuccess: () => {
        addToast(
          'success',
          `Banner ${editingData ? 'updated' : 'created'} successfully`,
        );
        confirm();
      },
    },
  );

  useEffect(() => {
    if (editingData) {
      console.log('editingData:', editingData);
      form.reset({
        ...editingData,
        activityAtStart: editingData.activityAtStart
          ? new Date(editingData.activityAtStart)
          : undefined,
        activityAtEnd: editingData.activityAtEnd
          ? new Date(editingData.activityAtEnd)
          : undefined,
        jumpCate: editingData.jumpCate,
        bannerCate: editingData.bannerCate,
      });
    }
  }, [editingData, form, form.reset]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          {/* 1. 基础视觉区 */}
          <div className="grid grid-cols-1 gap-4">
            <FormTextField
              name="title"
              label="Internal Title"
              placeholder="e.g. 11.11 Main Banner"
              required
            />
            <FormMediaUploaderField
              maxFileCount={1}
              name="bannerImgUrl"
              label="Creative Asset (16:9)"
            />
          </div>

          {/* 2. 位置与排期 */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              key={bannerCate} // 强制刷新，避免编辑时位置错误
              name="bannerCate"
              label="Display Position"
              numeric={true}
              options={[
                { label: 'Home', value: '1' },
                { label: 'Activity', value: '2' },
                { label: 'Product', value: '3' },
              ]}
            />
            <FormTextField name="sortOrder" label="Sort Order" type="number" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormDateField name="activityAtStart" label="Start Time" />
            <FormDateField name="activityAtEnd" label="End Time" />
          </div>

          {/* 3. 智能跳转配置区 (核心) */}
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10 space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click Action
            </div>

            <FormSelectField
              key={jumpCate}
              name="jumpCate"
              label="Navigation Type"
              numeric={true}
              options={[
                {
                  label: 'No Action (Just Display)',
                  value: String(JUMP_CATE.NONE),
                },
                {
                  label: 'Open Product Detail',
                  value: String(JUMP_CATE.TREASURE),
                },
                {
                  label: 'Open External Web',
                  value: String(JUMP_CATE.EXTERNAL),
                },
              ]}
            />

            {/* 条件渲染：外链输入框 */}
            {Number(jumpCate) === JUMP_CATE.EXTERNAL && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <FormTextField
                  name="jumpUrl"
                  label="Target URL"
                  placeholder="https://..."
                  renderLeft={() => (
                    <Link size={16} className="mr-2 text-gray-400" />
                  )}
                />
              </div>
            )}

            {/* 条件渲染：产品选择器 */}
            {Number(jumpCate) === JUMP_CATE.TREASURE && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <label className="text-sm font-medium">Target Product</label>
                {selectedProduct || relatedId ? (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 rounded border border-blue-200">
                    <img
                      src={selectedProduct?.treasureCoverImg}
                      className="w-10 h-10 rounded bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {selectedProduct?.treasureName || relatedId}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {relatedId}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        form.setValue('relatedTitleId', '');
                        setSelectedProduct(null);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setShowProductSelector(true)}
                  >
                    <Package size={16} className="mr-2" /> Select a Product
                  </Button>
                )}
                <input type="hidden" {...form.register('relatedTitleId')} />
              </div>
            )}
          </div>

          <div className="flex justify-end items-center pt-2">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                Save Banner
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
