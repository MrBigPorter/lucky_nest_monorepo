import React, { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequest } from 'ahooks';
import { bannerApi, uploadApi } from '@/api'; // 假设你有这些API
import {
  Button,
  Form,
  FormTextField,
  FormSelectField,
  FormDateField,
  FormMediaUploaderField,
} from '@repo/ui';
import { useToastStore } from '@/store/useToastStore';
import { JUMP_CATE } from '@lucky/shared';
import { Link } from 'lucide-react';
import { BannerFormInputs, BannerShema } from '@/schema/bannerShema.ts';
import { BannerBindProduct } from '@/pages/banner/BannerBindProduct.tsx';
import { Banner } from '@/type/types.ts';

interface Props {
  close: () => void;
  confirm: () => void;
  editingData?: Banner;
  defaultCate?: number; // 当前所在的 Tab
}

export const BannerFormModal: React.FC<Props> = ({
  close,
  confirm,
  editingData,
}) => {
  const addToast = useToastStore((s) => s.addToast);

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
      relatedTitleId: undefined,
    },
  });

  //  监听跳转类型变化，实现联动
  const jumpCate = useWatch({ control: form.control, name: 'jumpCate' });

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
      form.reset({
        ...editingData,
        activityAtStart: editingData.activityAtStart
          ? new Date(editingData.activityAtStart)
          : undefined,
        activityAtEnd: editingData.activityAtEnd
          ? new Date(editingData.activityAtEnd)
          : undefined,
        jumpCate: editingData.jumpCate,
        jumpUrl: editingData.jumpUrl || '',
        bannerCate: editingData.bannerCate,
        relatedTitleId: editingData.relatedTitleId || undefined,
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
              <Controller
                name="relatedTitleId"
                render={({ field, fieldState }) => (
                  <div>
                    <BannerBindProduct
                      value={field.value}
                      onChange={field.onChange}
                    />
                    {fieldState.error && (
                      <div className="mt-1 text-sm text-red-500">
                        {fieldState.error.message}
                      </div>
                    )}
                  </div>
                )}
              />
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
