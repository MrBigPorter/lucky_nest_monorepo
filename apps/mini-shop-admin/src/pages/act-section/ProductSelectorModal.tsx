import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToastStore } from '@/store/useToastStore';
import { actSectionApi } from '@/api';
import { z } from 'zod';
import {
  Button,
  Form,
  FormCheckboxField,
  FormDateField,
  FormSelectField,
  FormTextField,
} from '@repo/ui';
import { useRequest } from 'ahooks';
import { ActSectionSchema } from '@/schema/ActSectionSchema.ts';

type ActSectionFormInputs = z.infer<typeof ActSectionSchema>;

export const ProductSelectorModal = (
  close: () => void,
  confirm: () => void,
) => {
  const addToast = useToastStore((s) => s.addToast);

  const { run: creatActSection, loading } = useRequest(actSectionApi.create, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Section created successfully');
      confirm();
    },
  });

  const form = useForm<ActSectionFormInputs>({
    resolver: zodResolver(ActSectionSchema),
    defaultValues: {
      title: '',
      key: '',
      imgStyleType: 0,
      limit: 0,
      startAt: undefined,
      endAt: undefined,
      status: 1,
    },
  });

  const onSubmit = async (values: ActSectionFormInputs) => {
    try {
      creatActSection(values);
    } catch (e) {
      addToast('error', 'Failed to save product');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextField
              required
              autoComplete="off"
              name="title"
              label="Title"
              placeholder="e.g. New Arrival"
            />
            <FormTextField
              required
              name="key"
              label="Key (Unique)"
              autoComplete="off"
              placeholder="e.g. Weekly Best"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelectField
              required
              name="imgStyleType"
              label="Style Type"
              options={[
                { label: 'Carousel (0)', value: '0' },
                { label: 'Grid 2 Columns (1)', value: '1' },
                { label: 'Grid 3 Columns (2)', value: '2' },
              ]}
            />
            <FormTextField required name="limit" label="Limit" type="number" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDateField name="startAt" label="Start Time" />
            <FormDateField name="endAt" label="End Time" />
          </div>

          <div className="flex flex-col">
            <FormCheckboxField name="status" label="Enable this section" />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button isLoading={loading} type="submit">
              Confirm Add
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
