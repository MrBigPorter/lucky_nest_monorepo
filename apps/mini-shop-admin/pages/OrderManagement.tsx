import React, { useState } from 'react';
import {
  Package,
  Truck,
  Award,
  Search,
  Eye,
  RefreshCcw,
  CheckCircle,
  Printer,
  FileText,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  ExportButton,
} from '../components/UIComponents';
import { MOCK_ORDERS } from '../constants';
import { useMockData } from '../hooks/useMockData';
import { useToast } from '../App';
import { Order } from '../types';

export const OrderManagement: React.FC = () => {
  const { data: orders, update } = useMockData<Order>(MOCK_ORDERS);
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'winning' | 'refunded'>('all');

  // Modals
  const [deliveryModal, setDeliveryModal] = useState<Order | null>(null);
  const [refundModal, setRefundModal] = useState<Order | null>(null);
  const [detailModal, setDetailModal] = useState<Order | null>(null);

  const [refundReason, setRefundReason] = useState('');

  const filteredOrders = orders.filter((o) =>
    filter === 'all'
      ? o.status !== 'refunded'
      : filter === 'winning'
        ? o.isWinning
        : filter === 'refunded'
          ? o.status === 'refunded'
          : true,
  );

  const handleDeliveryUpdate = () => {
    if (!deliveryModal) return;
    update(deliveryModal.id, { deliveryStatus: 'shipped' });
    toast.addToast(
      'success',
      `Order ${deliveryModal.orderNo} marked as shipped.`,
    );
    setDeliveryModal(null);
  };

  const handleRefund = () => {
    if (!refundModal) return;
    update(refundModal.id, { status: 'refunded' });
    toast.addToast(
      'success',
      `Order ${refundModal.orderNo} refunded successfully.`,
    );
    setRefundModal(null);
    setRefundReason('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track orders, lucky draws, and shipments
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton data={filteredOrders} filename="orders_export" />
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('winning')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'winning' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              Winning
            </button>
            <button
              onClick={() => setFilter('refunded')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'refunded' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              Refunded
            </button>
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-4">Order No.</th>
                <th className="pb-4">Product</th>
                <th className="pb-4">User</th>
                <th className="pb-4">Shares</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Result</th>
                <th className="pb-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 pl-4 font-mono text-sm text-gray-500">
                    {order.orderNo}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.product.image}
                        className="w-8 h-8 rounded bg-gray-100"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {order.product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.user.name}
                  </td>
                  <td className="py-4 text-sm">{order.shares}</td>
                  <td className="py-4">
                    <Badge
                      color={
                        order.status === 'paid'
                          ? 'green'
                          : order.status === 'refunded'
                            ? 'red'
                            : 'gray'
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-4">
                    {order.isWinning ? (
                      <div className="flex flex-col">
                        <Badge color="red">WINNER</Badge>
                        <span className="text-[10px] text-gray-400 mt-1">
                          Code: {order.luckyCode}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailModal(order)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>
                      {order.isWinning && order.status === 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => setDeliveryModal(order)}
                          className="shadow-none"
                        >
                          <Truck size={14} /> Ship
                        </Button>
                      )}
                      {order.status === 'paid' && !order.isWinning && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRefundModal(order)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <RefreshCcw size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DELIVERY MODAL */}
      <Modal
        isOpen={!!deliveryModal}
        onClose={() => setDeliveryModal(null)}
        title="Prize Delivery"
      >
        {deliveryModal && (
          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-500/20 flex items-start gap-3">
              <Award className="text-primary-500 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Winning Prize
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {deliveryModal.product.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Winner: {deliveryModal.user.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-2">
                Logistics Info
              </h4>
              <Input
                label="Receiver Name"
                value={deliveryModal.user.name}
                readOnly
                className="bg-gray-100"
              />
              <Input
                label="Address"
                defaultValue="123 Makati Ave, Manila, Philippines"
              />
              <Input label="Tracking Number" placeholder="Enter tracking ID" />
              <Select
                label="Carrier"
                options={[
                  { label: 'LBC Express', value: 'lbc' },
                  { label: 'J&T Express', value: 'jnt' },
                  { label: 'Grab Express', value: 'grab' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setDeliveryModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleDeliveryUpdate}>Confirm Shipment</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REFUND MODAL */}
      <Modal
        isOpen={!!refundModal}
        onClose={() => setRefundModal(null)}
        title="Process Refund"
      >
        {refundModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to refund order{' '}
              <strong>{refundModal.orderNo}</strong>? This will return{' '}
              <strong>${refundModal.amount}</strong> to user balance.
            </p>
            <Input
              label="Reason for Refund"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer Request, System Error"
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setRefundModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRefund}>
                Confirm Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ORDER DETAIL / INVOICE MODAL */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Order Details"
        size="lg"
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-white/5 pb-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Invoice Number</div>
                <div className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                  {detailModal.orderNo}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {detailModal.date}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  color={
                    detailModal.status === 'paid'
                      ? 'green'
                      : detailModal.status === 'refunded'
                        ? 'red'
                        : 'gray'
                  }
                >
                  {detailModal.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  Customer Info
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    Name:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {detailModal.user.name}
                    </span>
                  </p>
                  <p>
                    User ID:{' '}
                    <span className="font-mono">{detailModal.user.id}</span>
                  </p>
                  <p>Email: example@email.com</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  Payment Details
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Method: Balance Wallet</p>
                  <p>Transaction ID: TXN-{detailModal.id}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                Order Items
              </h4>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <img
                    src={detailModal.product.image}
                    className="w-16 h-16 rounded-lg bg-white object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {detailModal.product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Product ID: {detailModal.product.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {detailModal.shares} Shares
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      ₱{detailModal.amount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-6">
              <Button variant="outline" onClick={handlePrint}>
                <Printer size={16} /> Print Invoice
              </Button>
              <div className="text-right">
                <span className="text-gray-500 mr-4">Total Amount</span>
                <span className="text-2xl font-bold text-primary-500">
                  ₱{detailModal.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
