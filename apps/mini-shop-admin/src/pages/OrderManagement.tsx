import React, { useState } from 'react';
import {
  Search,
  MoreVertical,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Modal,
  Badge,
  Select,
} from '@/components/UIComponents';
import { MOCK_ORDERS } from '@/constants';
import { useMockData } from '@/hooks/useMockData';
import { useToastStore } from '@/store/useToastStore';
import { Order } from '@/type/types.ts';

export const OrderManagement: React.FC = () => {
  const { data: orders, update } = useMockData<Order>(MOCK_ORDERS);
  const addToast = useToastStore((state) => state.addToast);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleUpdateStatus = (status: 'shipped' | 'delivered') => {
    if (selectedOrder) {
      update(selectedOrder.id, { deliveryStatus: status });
      addToast('success', `Order status updated to ${status}`);
      setSelectedOrder(null);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      (o.orderNo.includes(searchTerm) ||
        o.user.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'all' || o.status === filterStatus),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track, update, and manage all customer orders.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 flex-1 transition-all focus-within:ring-2 focus-within:ring-primary-500/50">
            <Search size={20} className="text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search by Order No or Customer..."
              className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Pending', value: 'pending' },
                { label: 'Refunded', value: 'refunded' },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-4">Order No.</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4">Product</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Delivery</th>
                <th className="pb-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <td className="py-4 pl-4 font-mono text-sm">
                    {order.orderNo}
                  </td>
                  <td className="py-4 font-medium">{order.user.name}</td>
                  <td className="py-4 text-sm">{order.product.name}</td>
                  <td className="py-4 font-bold">
                    ₱{order.amount.toLocaleString()}
                  </td>
                  <td className="py-4">
                    <Badge color={order.status === 'paid' ? 'green' : 'yellow'}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Badge
                      color={
                        order.deliveryStatus === 'delivered' ? 'blue' : 'gray'
                      }
                    >
                      {order.deliveryStatus || 'N/A'}
                    </Badge>
                  </td>
                  <td className="py-4 text-right pr-6">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.orderNo}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p>
              <strong>Customer:</strong> {selectedOrder.user.name}
            </p>
            <p>
              <strong>Product:</strong> {selectedOrder.product.name}
            </p>
            <p>
              <strong>Amount:</strong> ₱{selectedOrder.amount.toLocaleString()}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateStatus('shipped')}>
                <Truck size={16} /> Mark as Shipped
              </Button>
              <Button onClick={() => handleUpdateStatus('delivered')}>
                <CheckCircle size={16} /> Mark as Delivered
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
