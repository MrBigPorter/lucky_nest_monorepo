import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCw,
  History,
  Hash,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UIComponents.tsx';
import { MOCK_LOTTERY_DRAWS } from '../../constants.ts';
import { useMockData } from '../hooks/useMockData.ts';
import { LotteryDraw } from '../../types.ts';

export const LotteryControl: React.FC = () => {
  const { data: draws, update } = useMockData<LotteryDraw>(MOCK_LOTTERY_DRAWS);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);
  const [simulatedHash, setSimulatedHash] = useState<string>('');

  const pendingDraws = draws.filter((d) => d.status === 'pending');
  const historyDraws = draws.filter((d) => d.status === 'completed');

  const handleDraw = (id: string) => {
    setCalculatingId(id);
    update(id, { status: 'calculating' });

    // Simulate Hash Calculation Effect
    const interval = setInterval(() => {
      setSimulatedHash(
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join(''),
      );
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setCalculatingId(null);
      // Determine a winner (Mock)
      const mockWinner = {
        id: '999',
        name: 'LuckyUser',
        code: Math.floor(10000 + Math.random() * 90000).toString(),
      };
      const finalHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');

      update(id, {
        status: 'completed',
        winner: mockWinner,
        hash: finalHash,
        drawTime: new Date().toLocaleString(),
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Lottery Control Center
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Monitor fill rates and execute fairness algorithms
        </p>
      </div>

      {/* Calculating Overlay */}
      {calculatingId && (
        <Card className="bg-gradient-to-r from-gray-900 to-black text-white border-primary-500/50 border animate-pulse">
          <div className="flex flex-col items-center py-8">
            <RotateCw
              className="animate-spin text-primary-500 mb-4"
              size={48}
            />
            <h2 className="text-2xl font-mono mb-2">CALCULATING WINNER</h2>
            <div className="font-mono text-xs md:text-sm text-primary-400 break-all max-w-2xl text-center px-4">
              {simulatedHash}
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Validating blockchain timestamp...
            </p>
          </div>
        </Card>
      )}

      {/* Pending Draws */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pendingDraws.map((draw) => (
          <Card key={draw.id} className="relative overflow-hidden">
            <div className="flex gap-4">
              <img
                src={draw.product.image}
                className="w-24 h-24 rounded-lg object-cover bg-gray-100 dark:bg-white/5"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {draw.product.name}
                    </h3>
                    <p className="text-xs text-gray-500">Draw ID: {draw.id}</p>
                  </div>
                  <Badge color={draw.fillRate >= 100 ? 'green' : 'yellow'}>
                    {draw.fillRate >= 100
                      ? 'Ready'
                      : `${draw.fillRate}% Filled`}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                    <span>Progress</span>
                    <span>{draw.totalShares} Shares</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${draw.fillRate >= 100 ? 'bg-primary-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(draw.fillRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => handleDraw(draw.id)}
                disabled={!!calculatingId || draw.fillRate < 100}
                className={
                  draw.fillRate < 100 ? 'opacity-50 cursor-not-allowed' : ''
                }
              >
                <Play size={16} /> Execute Draw
              </Button>
            </div>
          </Card>
        ))}
        {pendingDraws.length === 0 && !calculatingId && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
            <Clock size={48} className="mb-4 opacity-50" />
            <p>No pending draws at the moment.</p>
          </div>
        )}
      </div>

      {/* History */}
      <Card title="Draw History">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-4">Product</th>
                <th className="pb-4">Winner</th>
                <th className="pb-4">Winning Code</th>
                <th className="pb-4">Hash (Partial)</th>
                <th className="pb-4">Time</th>
                <th className="pb-4 text-right pr-6">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {historyDraws.map((draw) => (
                <tr
                  key={draw.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={draw.product.image}
                        className="w-8 h-8 rounded"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {draw.product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-bold text-primary-500">
                    {draw.winner?.name}
                  </td>
                  <td className="py-4 font-mono text-sm bg-gray-100 dark:bg-white/10 px-2 rounded w-fit">
                    {draw.winner?.code}
                  </td>
                  <td className="py-4 font-mono text-xs text-gray-500">
                    {draw.hash?.substring(0, 16)}...
                  </td>
                  <td className="py-4 text-xs text-gray-500">
                    {draw.drawTime}
                  </td>
                  <td className="py-4 text-right pr-6">
                    <button className="text-gray-400 hover:text-primary-500 transition-colors">
                      <CheckCircle size={18} />
                    </button>
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
