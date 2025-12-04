import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  MousePointer,
} from 'lucide-react';
import { Card, Badge, DateRangePicker } from '../components/UIComponents.tsx';
import {
  MOCK_FUNNEL_DATA,
  MOCK_PRODUCT_METRICS,
  MOCK_COHORT_DATA,
} from '../constants.ts';

// --- SUB-COMPONENT: CONVERSION FUNNEL ---
const ConversionFunnel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-lg text-white">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Visits
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                15,000
              </h3>
            </div>
          </div>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-lg text-white">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Paying Users
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                1,850
              </h3>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conversion Rate
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                12.3%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card title="User Journey Funnel">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={MOCK_FUNNEL_DATA}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#374151"
                opacity={0.2}
              />
              <XAxis
                type="number"
                stroke="#9ca3af"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="stage"
                type="category"
                stroke="#9ca3af"
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: '#1e1e2e',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="users"
                fill="#d68a29"
                radius={[0, 4, 4, 0]}
                barSize={40}
              >
                {MOCK_FUNNEL_DATA.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fillOpacity={1 - index * 0.15}
                    fill="#d68a29"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs">
          {MOCK_FUNNEL_DATA.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="font-bold text-gray-900 dark:text-white mb-1">
                {step.rate}%
              </div>
              <div className="text-gray-500">Retention</div>
              {idx < MOCK_FUNNEL_DATA.length - 1 && (
                <ArrowRight
                  className="absolute top-1/2 -right-3 -translate-y-1/2 text-gray-300 dark:text-gray-700"
                  size={16}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: PRODUCT MATRIX (BCG) ---
const ProductMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            BCG Matrix Analysis
          </h3>
          <p className="text-sm text-gray-500">
            Sales Volume vs. Profit Margin
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>Star
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>Cash Cow
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>Dog
          </div>
        </div>
      </div>

      <Card className="relative">
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.2}
              />
              <XAxis
                type="number"
                dataKey="salesVolume"
                name="Sales Volume"
                unit=" units"
                stroke="#9ca3af"
                label={{
                  value: 'Sales Volume',
                  position: 'insideBottomRight',
                  offset: -10,
                  fill: '#9ca3af',
                }}
              />
              <YAxis
                type="number"
                dataKey="profitMargin"
                name="Profit Margin"
                unit="%"
                stroke="#9ca3af"
                label={{
                  value: 'Profit Margin (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9ca3af',
                }}
              />
              <ZAxis
                type="number"
                dataKey="revenue"
                range={[100, 1000]}
                name="Revenue"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as any;
                    return (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-white/10 text-sm">
                        <div className="font-bold mb-1">{data.name}</div>
                        <div className="text-gray-400">{data.category}</div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          <span>Sales:</span>{' '}
                          <span className="text-right font-mono">
                            {data.salesVolume}
                          </span>
                          <span>Margin:</span>{' '}
                          <span className="text-right font-mono">
                            {data.profitMargin}%
                          </span>
                          <span>Rev:</span>{' '}
                          <span className="text-right font-mono text-emerald-400">
                            ${data.revenue}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Products"
                data={MOCK_PRODUCT_METRICS}
                fill="#d68a29"
              >
                {MOCK_PRODUCT_METRICS.map((entry, index) => {
                  let color = '#ef4444'; // Dog
                  if (entry.salesVolume > 300 && entry.profitMargin > 20)
                    color = '#10b981'; // Star
                  else if (entry.salesVolume > 300)
                    color = '#3b82f6'; // Cash Cow
                  else if (entry.profitMargin > 20) color = '#a855f7'; // Question Mark
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Labels */}
        <div className="absolute top-6 left-16 text-xs font-bold text-purple-500 opacity-50">
          QUESTION MARK
        </div>
        <div className="absolute top-6 right-6 text-xs font-bold text-green-500 opacity-50">
          STAR
        </div>
        <div className="absolute bottom-16 left-16 text-xs font-bold text-red-500 opacity-50">
          DOG
        </div>
        <div className="absolute bottom-16 right-6 text-xs font-bold text-blue-500 opacity-50">
          CASH COW
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: RETENTION COHORTS ---
const RetentionCohorts: React.FC = () => {
  const getBgColor = (value: number) => {
    if (value >= 80) return 'bg-primary-500 text-white';
    if (value >= 50) return 'bg-primary-400/80 text-white';
    if (value >= 30) return 'bg-primary-300/50 text-gray-800 dark:text-white';
    if (value >= 10)
      return 'bg-primary-200/30 text-gray-800 dark:text-gray-200';
    return 'bg-gray-100 dark:bg-white/5 text-gray-400';
  };

  return (
    <Card title="User Retention Cohorts" action={<DateRangePicker />}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-400 text-xs font-semibold uppercase">
              <th className="pb-4 pl-4 min-w-[120px]">Cohort</th>
              <th className="pb-4 min-w-[100px]">Users</th>
              <th className="pb-4 text-center">Month 0</th>
              <th className="pb-4 text-center">Month 1</th>
              <th className="pb-4 text-center">Month 2</th>
              <th className="pb-4 text-center">Month 3</th>
              <th className="pb-4 text-center">Month 4</th>
              <th className="pb-4 text-center">Month 5</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {MOCK_COHORT_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="py-4 pl-4 font-bold text-gray-900 dark:text-white">
                  {row.date}
                </td>
                <td className="py-4 text-sm text-gray-500">
                  {row.users.toLocaleString()}
                </td>
                {row.retention.map((val, i) => (
                  <td key={i} className="py-2 px-1 text-center">
                    <div
                      className={`w-full py-2 rounded text-xs font-bold ${getBgColor(val)}`}
                    >
                      {val}%
                    </div>
                  </td>
                ))}
                {/* Fill empty cells */}
                {Array.from({ length: 6 - row.retention.length }).map(
                  (_, i) => (
                    <td key={`empty-${i}`} className="py-2 px-1 text-center">
                      <div className="w-full py-2 bg-transparent text-gray-700 dark:text-gray-600 text-xs">
                        -
                      </div>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const DataAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'product' | 'retention'
  >('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Data Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Business intelligence and growth insights
        </p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'overview' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <TrendingUp size={16} /> Overview & Funnel
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'product' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <MousePointer size={16} /> Product Analysis
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'retention' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <Activity size={16} /> Retention
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'overview' && <ConversionFunnel />}
        {activeTab === 'product' && <ProductMatrix />}
        {activeTab === 'retention' && <RetentionCohorts />}
      </div>
    </div>
  );
};
