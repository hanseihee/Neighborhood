'use client';

import type { PriceChangeItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface PriceChangeProps {
  up: PriceChangeItem[];
  down: PriceChangeItem[];
  onSelectApt?: (aptName: string) => void;
}

export default function PriceChange({ up, down, onSelectApt }: PriceChangeProps) {
  if (up.length === 0 && down.length === 0) return null;

  const renderItem = (item: PriceChangeItem, type: 'up' | 'down') => (
    <div
      key={`${item.아파트}_${item.pyeong}`}
      onClick={() => onSelectApt?.(item.아파트)}
      className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-slate-800 truncate">
          {item.아파트}
        </p>
        <p className="text-[12px] text-slate-400">
          {item.pyeong}평 · {item.법정동}
        </p>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <span
          className={`text-[14px] font-bold tabular-nums ${
            type === 'up' ? 'text-up' : 'text-down'
          }`}
        >
          {type === 'up' ? '+' : ''}
          {item.changeRate}%
        </span>
        <p className="text-[12px] text-slate-400 tabular-nums">
          {formatPrice(item.recentAvg)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {up.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-up" />
            <h3 className="text-[15px] font-semibold text-slate-900">
              급등 TOP {up.length}
            </h3>
          </div>
          <div className="space-y-0.5">
            {up.map((item) => renderItem(item, 'up'))}
          </div>
        </div>
      )}
      {down.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-down" />
            <h3 className="text-[15px] font-semibold text-slate-900">
              급락 TOP {down.length}
            </h3>
          </div>
          <div className="space-y-0.5">
            {down.map((item) => renderItem(item, 'down'))}
          </div>
        </div>
      )}
    </div>
  );
}
