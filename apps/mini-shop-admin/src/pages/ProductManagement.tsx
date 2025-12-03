import React, { useContext, useState } from 'react';
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
} from '../components/UIComponents.tsx';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  TRANSLATIONS,
} from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { AppContext, useToast } from '../../App.tsx';
import { Category, Product } from '../../types.ts';

export const ProductManagement: React.FC = () => {
  const { lang } = useContext(AppContext);
  const t = TRANSLATIONS[lang];
  const toast = useToast();

  const {
    data: products,
    loading,
    add,
    remove,
    update,
  } = useMockData<Product>(MOCK_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Product> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Drag and Drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Delete State
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

  // Profit Calc
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
      toast.addToast('success', 'Product updated successfully');
    } else {
      add({
        ...formData,
        id: Date.now().toString(),
        seq: `TRE${Date.now()}`,
        sortOrder: products.length + 1,
      } as Product);
      toast.addToast('success', 'Product created successfully');
    }
    setIsModalOpen(false);
  };

  // Safe Delete Logic
  const handleDeleteClick = (product: Product) => {
    if (product.status === 'active') {
      toast.addToast(
        'error',
        'Action Blocked: Cannot delete an active product. Please deactivate it first.',
      );
      return;
    }
    if (product.soldShares > 0) {
      toast.addToast(
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
      toast.addToast('success', 'Product deleted permanently.');
      setDeleteItem(null);
    }
  };

  // DnD Handlers
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

      {/* CREATE/EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Product' : 'New Product'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <ImageUpload
              label="Product Image (Cover)"
              value={formData.image || ''}
              onChange={(val) => setFormData({ ...formData, image: val })}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Price per Share (₱)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
              <div className="h-4"></div>
              <Input
                label="Cost Price (₱)"
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: Number(e.target.value) })
                }
              />
            </div>

            {/* Profit Calculator Card */}
            <div
              className={`rounded-xl p-4 border flex flex-col justify-center transition-colors ${profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Estimated Profit
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {profit >= 0 ? '+' : ''}₱{profit.toLocaleString()}
                </span>
                {profit >= 0 ? (
                  <TrendingUp size={20} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={20} className="text-red-500" />
                )}
              </div>
              <div className="text-sm mt-2 flex justify-between text-gray-600 dark:text-gray-300">
                <span>
                  Margin:{' '}
                  <span className="font-bold">{margin.toFixed(1)}%</span>
                </span>
                <span>Rev: ₱{totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Input
            label="Total Shares"
            type="number"
            value={formData.totalShares}
            onChange={(e) =>
              setFormData({ ...formData, totalShares: Number(e.target.value) })
            }
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={categories.map((c) => ({ label: c, value: c }))}
          />

          <Select
            label="Lottery Mode"
            value={formData.lotteryMode}
            onChange={(e) =>
              setFormData({
                ...formData,
                lotteryMode: Number(e.target.value) as 1 | 2,
              })
            }
            options={[
              { label: 'Sold Out Mode (Auto)', value: 1 },
              { label: 'Timed Mode (Fixed)', value: 2 },
            ]}
          />

          {formData.lotteryMode === 2 && (
            <Input
              label="Draw Time"
              type="datetime-local"
              value={formData.lotteryTime}
              onChange={(e) =>
                setFormData({ ...formData, lotteryTime: e.target.value })
              }
            />
          )}

          <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <h4 className="font-bold text-gray-900 dark:text-white">
              Content & Risk Control
            </h4>
            <Textarea
              label="Product Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the product details, specs, etc."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Purchase Limit (0 = Unlimited)"
                type="number"
                value={formData.purchaseLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchaseLimit: Number(e.target.value),
                  })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marketing Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded text-xs border transition-all ${formData.tags?.includes(tag) ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-transparent hover:border-gray-300'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Restart Next Round
                </span>
              </div>
              <Switch
                checked={!!formData.autoRestart}
                onChange={(c) => setFormData({ ...formData, autoRestart: c })}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 h-[74px] mt-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Status
            </span>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs ${formData.status === 'active' ? 'text-primary-500 font-bold' : 'text-gray-400'}`}
              >
                {formData.status?.toUpperCase()}
              </span>
              <Switch
                checked={formData.status === 'active'}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? 'active' : 'draft',
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-white/5">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave}>{t.save}</Button>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-900/30">
            <AlertTriangle
              className="text-red-600 dark:text-red-400 shrink-0"
              size={24}
            />
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-400">
                Danger Zone
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You are about to delete <strong>{deleteItem?.name}</strong>.
                This action is irreversible.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const CategoryManagement: React.FC = () => {
  const {
    data: categories,
    loading,
    add,
    remove,
    update,
  } = useMockData<Category>(MOCK_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Category> | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    productCount: 0,
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingItem(category);
      setFormData(category);
    } else {
      setEditingItem(null);
      setFormData({ name: '', productCount: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem && editingItem.id) {
      update(editingItem.id, formData);
    } else {
      add({ ...formData, id: Date.now().toString() } as Category);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Organize your products structure
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="outline">
          <Plus size={18} /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            className="hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5 cursor-pointer group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <span className="text-lg font-bold">{cat.name.charAt(0)}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(cat);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-400 hover:text-primary-500"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(cat.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {cat.name}
            </h3>
            <p className="text-sm text-gray-500">
              {cat.productCount} Products linked
            </p>
          </Card>
        ))}
        <button
          onClick={() => handleOpenModal()}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-all cursor-pointer h-full min-h-[140px]"
        >
          <Plus size={24} className="mb-2" />
          <span className="font-medium">Create New</span>
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Category' : 'New Category'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Fashion"
          />
          <Input
            label="Initial Product Count"
            type="number"
            value={formData.productCount}
            onChange={(e) =>
              setFormData({ ...formData, productCount: Number(e.target.value) })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
