import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, GripVertical, Trash2, Plus } from 'lucide-react';
import { Button, BaseSelect } from '@repo/ui'; // 假设的基础组件
import { Input } from '@/components/UIComponents.tsx';
import { Product } from '@/type/types';
import { useToastStore } from '@/store/useToastStore';
import { ProductSelectorModal } from './ProductSelectorModal';
import { ActSection } from '@/type/types';

// Dnd Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { actSectionApi } from '@/api'; // 假设你使用 dayjs 处理日期

// --- 子组件：可拖拽的商品项 ---
const SortableItem = ({
  id,
  product,
  onRemove,
}: {
  id: string;
  product: Product;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg mb-2 group hover:border-blue-300 transition-all"
    >
      <div className="flex items-center gap-3">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 p-1"
        >
          <GripVertical size={16} />
        </div>
        {/* 商品图 */}
        <img
          src={product.treasureCoverImg}
          alt=""
          className="w-10 h-10 rounded bg-gray-100 object-cover"
        />
        {/* 信息 */}
        <div>
          <div className="text-sm font-medium text-gray-800 line-clamp-1">
            {product.treasureName}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            ID: {product.treasureId}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// --- 主编辑器 ---
interface EditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: ActSection | null; // 如果是 null 则为创建模式
}

export const ActSectionEditorModal: React.FC<EditorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingData,
}) => {
  const isEdit = !!editingData;
  const addToast = useToastStore((s) => s.addToast);

  // 1. 本地状态：管理已选商品 (用于拖拽排序)
  // 注意：这里我们存的是 Product 对象，方便展示。提交时再提取 ID。
  const [items, setItems] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // 2. 表单初始化
  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: {
      title: '',
      key: '',
      imgStyleType: 0,
      status: 1,
      startAt: '',
      endAt: '',
      limit: 10,
    },
  });

  // 3. 当打开编辑时，填充数据
  useEffect(() => {
    if (isOpen && editingData) {
      // 填充表单
      setValue('title', editingData.title);
      setValue('key', editingData.key);
      setValue('imgStyleType', editingData.imgStyleType);
      setValue('status', editingData.status);
      setValue('limit', editingData.limit);

      // 处理日期：转为 input type="datetime-local" 格式 (YYYY-MM-DDTHH:mm)
      const fmt = 'YYYY-MM-DDTHH:mm';
      if (editingData.startAt)
        setValue('startAt', dayjs(editingData.startAt).format(fmt));
      if (editingData.endAt)
        setValue('endAt', dayjs(editingData.endAt).format(fmt));

      // 填充商品列表
      // 注意：后端返回的 items 是 ActSectionItem[]，里面包含 treasure。我们需要提取 treasure 出来。
      if (editingData.items) {
        // 按 sortOrder 排序
        const sorted = [...editingData.items].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        const products = sorted
          .map((item) => item.treasure)
          .filter(Boolean) as Product[];
        setItems(products);
      }
    } else if (isOpen && !editingData) {
      reset(); // 创建模式重置
      setItems([]);
    }
  }, [isOpen, editingData, setValue, reset]);

  // 4. DnD 逻辑
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex(
          (item) => item.treasureId === active.id,
        );
        const newIndex = prev.findIndex((item) => item.treasureId === over?.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // 5. 提交逻辑
  const onSubmit = async (data: any) => {
    try {
      // 构造 Payload
      const payload = {
        ...data,
        imgStyleType: Number(data.imgStyleType),
        limit: Number(data.limit),
        status: Number(data.status),
        // 日期处理：如果有值，转 ISO；空串转 null/undefined
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        // 商品 ID 列表 (按当前数组顺序)
        itemIds: items.map((p) => p.treasureId), // 假设后端支持接收 itemIds 数组自动创建关联
      };

      // 注意：如果你的后端 create/update 接口还不支持直接传 itemIds 来更新关联，
      // 你可能需要修改后端的 Service，或者这里分两步调用 (先更新 info，再调用 updateItems)。
      // 建议后端 DTO 增加 itemIds?: string[] 字段一次性处理。

      if (isEdit && editingData) {
        await actSectionApi.update(editingData.id, payload);
      } else {
        await actSectionApi.create(payload);
      }

      addToast('success', isEdit ? 'Section updated' : 'Section created');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // addToast('error', 'Operation failed');
    }
  };

  // 移除商品
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((p) => p.treasureId !== id));

  // 添加商品回调
  const handleAddProducts = (newProducts: Product[]) => {
    setItems((prev) => [...prev, ...newProducts]);
    setShowProductSelector(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-[2px]">
      {/* 侧边 Drawer 风格 */}
      <div className="w-[600px] h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-xl font-bold">
              {isEdit ? 'Edit Section' : 'Create Section'}
            </h2>
            <p className="text-sm text-gray-500">
              Configure content and layout
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Part A: Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">
              Basic Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                {...register('title', { required: true })}
                placeholder="e.g. Weekly Best"
              />
              <Input
                label="Key (Unique)"
                {...register('key', { required: true })}
                placeholder="e.g. weekly_best"
                disabled={isEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="imgStyleType"
                control={control}
                render={({ field }) => (
                  <BaseSelect
                    label="Style Type"
                    value={String(field.value)}
                    onChange={(val) => field.onChange(Number(val))}
                    options={[
                      { label: 'Carousel (0)', value: '0' },
                      { label: 'Grid 2 Columns (1)', value: '1' },
                      { label: 'Grid 3 Columns (2)', value: '2' },
                    ]}
                  />
                )}
              />
              <Input label="Limit" type="number" {...register('limit')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Start Time"
                {...register('startAt')}
              />
              <Input
                type="datetime-local"
                label="End Time"
                {...register('endAt')}
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="status"
                {...register('status')}
                className="w-4 h-4"
              />
              <label htmlFor="status" className="text-sm font-medium">
                Enable this section
              </label>
            </div>
          </section>

          {/* Part B: Items Management */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">
                Associated Products ({items.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowProductSelector(true)}
                className="gap-2"
              >
                <Plus size={14} /> Add Product
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 min-h-[200px] border border-dashed border-gray-300">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8">
                  <p>No products added yet.</p>
                  <p>Click "Add Product" to start.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.treasureId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((product) => (
                      <SortableItem
                        key={product.treasureId}
                        id={product.treasureId}
                        product={product}
                        onRemove={() => removeItem(product.treasureId)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={false}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Product Selector Modal Layer */}
      <ProductSelectorModal
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        existingIds={items.map((i) => i.treasureId)}
        onConfirm={handleAddProducts}
      />
    </div>
  );
};
