import React, { useState } from 'react';
import {
  AlertTriangle,
  Edit2,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ImageUpload,
  Input,
  Modal,
  Select,
  Switch,
  Textarea,
} from '@/components/UIComponents';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, TRANSLATIONS } from '@/constants';
import { useMockData } from '@/hooks/useMockData';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import { Category, Product } from '@/types';

export const ProductManagement: React.FC = () => {
  const { lang } = useAppStore();
  const t = TRANSLATIONS[lang];
  const addToast = useToastStore((state) => state.addToast);

  const {
    data: products,
    add,
    remove,
    update,
  } = useMockData<Product>(MOCK_PRODUCTS);
  const [editingItem, setEditingItem] = useState<Partial<Product> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);

  const defaultProduct: Partial<Product> = {
    name: '',
    price: 0,
    cost: 0,
    category: 'Electronics',
    totalShares: 100,
    soldShares: 0,
    status: 'draft',
    image: '',
    lotteryMode: 1,
    sortOrder: 0,
    description: '',
    purchaseLimit: 0,
    tags: [],
    autoRestart: false,
  };
  const [formData, setFormData] = useState<Partial<Product>>(defaultProduct);

  const totalRevenue = (formData.price || 0) * (formData.totalShares || 0);
  const profit = totalRevenue - (formData.cost || 0);
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingItem(product);
      setFormData(product);
    } else {
      setEditingItem(null);
      setFormData(defaultProduct);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem && editingItem.id) {
      update(editingItem.id, formData);
      addToast('success', 'Product updated successfully');
    } else {
      add({
        ...formData,
        id: Date.now().toString(),
        seq: `TRE${Date.now()}`,
        sortOrder: products.length + 1,
      } as Product);
      addToast('success', 'Product created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (product: Product) => {
    if (product.status === 'active') {
      addToast(
        'error',
        'Action Blocked: Cannot delete an active product. Please deactivate it first.',
      );
      return;
    }
    if (product.soldShares > 0) {
      addToast(
        'error',
        `Action Blocked: This product has sold ${product.soldShares} shares. Archive it instead.`,
      );
      return;
    }
    setDeleteItem(product);
  };

  const confirmDelete = () => {
    if (deleteItem) {
      remove(deleteItem.id, false); // Skip native confirm
      addToast('success', 'Product deleted permanently.');
      setDeleteItem(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newProducts = [...products];
    const draggedItem = newProducts[draggedItemIndex];

    newProducts.splice(draggedItemIndex, 1);
    newProducts.splice(index, 0, draggedItem);

    newProducts.forEach((p, i) => {
      p.sortOrder = i + 1;
      update(p.id, { sortOrder: i + 1 });
    });

    setDraggedItemIndex(null);
  };

  const filteredProducts = products
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

  const categories = Array.from(new Set(MOCK_CATEGORIES.map((c) => c.name)));

  const commonTags = ['Hot', 'New', 'Best Seller', 'Limited', 'Instant'];
  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter((t) => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.products}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage treasure hunt items & inventory
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="shadow-xl shadow-primary-500/20"
        >
          <Plus size={18} /> {t.add}
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary-500">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 flex-1 transition-all focus-within:ring-2 focus-within:ring-primary-500/50">
            <Search size={20} className="text-gray-400 ml-2" />
            <input
              type="text"
              placeholder={t.search}
              className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/50"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="w-12 text-center pb-4">Sort</th>
                <th className="pb-4 pl-4">Product</th>
                <th className="pb-4">Category</th>
                <th className="pb-4">Shares (Sold/Total)</th>
                <th className="pb-4">Price/Share</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200 ${draggedItemIndex === index ? 'opacity-50 bg-gray-100 dark:bg-white/10' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                >
                  <td className="py-4 text-center cursor-move text-gray-300 hover:text-gray-500 active:text-primary-500">
                    <div className="flex justify-center">
                      <GripVertical size={16} />
                    </div>
                  </td>
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {product.seq}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col w-32">
                      <div className="flex justify-between text-xs mb-1 text-gray-500">
                        <span>
                          {Math.round(
                            (product.soldShares / product.totalShares) * 100,
                          )}
                          %
                        </span>
                        <span>
                          {product.soldShares}/{product.totalShares}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(product.soldShares / product.totalShares) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-gray-700 dark:text-gray-300 font-medium">
                    ₱{product.price}
                  </td>
                  <td className="py-4">
                    <Badge
                      color={
                        product.status === 'active'
                          ? 'green'
                          : product.status === 'ended'
                            ? 'gray'
                            : 'yellow'
                      }
                    >
                      {product.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-2 hover:bg-primary-500/10 text-gray-400 hover:text-primary-500 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
