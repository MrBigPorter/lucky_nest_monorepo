import React, { useContext } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DollarSign, Users, ShoppingCart, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../components/UIComponents.tsx';
import { MOCK_STATS, MOCK_ORDERS, TRANSLATIONS } from '../../constants.ts';
import { AppContext } from '../../App.tsx';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}> = ({ title, value, icon, trend, color }) => (
  <Card className="relative overflow-hidden group h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-transparent hover:border-t-primary-500">
    <div
      className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { size: 60 })}
    </div>
    <div className="relative z-10">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} bg-opacity-10 dark:bg-opacity-20`}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: color.replace('bg-', 'text-'),
          size: 24,
        })}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
        {title}
      </p>
      <h4 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        {value}
      </h4>
      {trend && (
        <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full mt-3 inline-block">
          {trend}
        </span>
      )}
    </div>
  </Card>
);

const data = [
  { name: 'Jan', uv: 4000, pv: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398 },
  { name: 'Mar', uv: 2000, pv: 9800 },
  { name: 'Apr', uv: 2780, pv: 3908 },
  { name: 'May', uv: 1890, pv: 4800 },
  { name: 'Jun', uv: 2390, pv: 3800 },
  { name: 'Jul', uv: 3490, pv: 4300 },
];

export const Dashboard: React.FC = () => {
  const { lang } = useContext(AppContext);
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.revenue}
          value={`$${MOCK_STATS.totalRevenue.toLocaleString()}`}
          icon={<DollarSign />}
          trend="+12.5% vs last mo"
          color="bg-emerald-500"
        />
        <StatCard
          title={t.users}
          value={MOCK_STATS.activeUsers}
          icon={<Users />}
          trend="+5.2% new users"
          color="bg-blue-500"
        />
        <StatCard
          title={t.orders}
          value={MOCK_STATS.newOrders}
          icon={<ShoppingCart />}
          trend="+18% surge"
          color="bg-primary-500"
        />
        <StatCard
          title="Pending Issues"
          value={MOCK_STATS.pendingIssues}
          icon={<AlertCircle />}
          trend="-2 resolved today"
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full" title="Revenue Overview">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d68a29" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#d68a29" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#374151"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#11111b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                    }}
                    itemStyle={{ color: '#dca449' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pv"
                    stroke="#dca449"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Traffic Source" className="h-full">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#374151"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      backgroundColor: '#11111b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="uv" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Recent Orders">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 dark:border-white/5 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-2">Order ID</th>
                <th className="pb-4">Product</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {MOCK_ORDERS.slice(0, 5).map((order) => (
                <tr
                  key={order.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 pl-2 text-gray-500 font-mono text-sm">
                    {order.orderNo}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.product.image}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {order.product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-500 text-sm">
                    {order.user.name}
                  </td>
                  <td className="py-4 font-bold text-gray-900 dark:text-white">
                    ₱{order.amount.toLocaleString()}
                  </td>
                  <td className="py-4">
                    <Badge
                      color={
                        order.status === 'paid'
                          ? 'green'
                          : order.status === 'refunded'
                            ? 'red'
                            : 'yellow'
                      }
                    >
                      {order.status.toUpperCase()}
                    </Badge>
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
