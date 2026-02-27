'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AptTrade } from '@/lib/types';
import { getApartmentSummary } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

type SortMode = 'avg' | 'max';

const INITIAL_COUNT = 20;

interface ApartmentListProps {
  trades: AptTrade[];
  selectedApt?: string | null;
  onSelectApt?: (aptName: string | null) => void;
}

export default function ApartmentList({ trades, selectedApt, onSelectApt }: ApartmentListProps) {
  const [sortMode, setSortMode] = useState<SortMode>('avg');
  const [showAll, setShowAll] = useState(false);
  const rawApartments = getApartmentSummary(trades);

  const apartments = useMemo(() => {
    return [...rawApartments].sort((a, b) =>
      sortMode === 'max' ? b.maxPrice - a.maxPrice : b.avgPrice - a.avgPrice
    );
  }, [rawApartments, sortMode]);

  if (apartments.length === 0) return null;

  const displayed = showAll ? apartments : apartments.slice(0, INITIAL_COUNT);
  const hasMore = apartments.length > INITIAL_COUNT;

  const handleClick = (aptName: string) => {
    if (!onSelectApt) return;
    onSelectApt(selectedApt === aptName ? null : aptName);
  };

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex gap-1 mb-4 px-5">
        {(['avg', 'max'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors cursor-pointer ${
              sortMode === mode
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {mode === 'avg' ? '평균시세순' : '최고가순'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {displayed.map((apt, i) => {
          const isSelected = selectedApt === apt.아파트;
          return (
            <div
              key={`${apt.아파트}_${apt.pyeong}`}
              onClick={() => handleClick(apt.아파트)}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors cursor-pointer relative ${
                isSelected
                  ? 'bg-primary-50/60'
                  : 'hover:bg-slate-50/60'
              }`}
            >
              {/* Selected indicator bar */}
              {isSelected && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary-500" />
              )}

              <span className="text-[14px] font-semibold text-slate-300 tabular-nums w-6 text-center flex-shrink-0">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-semibold truncate ${
                  isSelected ? 'text-primary-700' : 'text-slate-800'
                }`}>
                  {apt.아파트}
                  <span className="text-[13px] text-slate-400 font-normal ml-2">
                    {apt.법정동}
                  </span>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-slate-400">
                  <span>{apt.pyeong}평</span>
                  <span className="text-slate-200">·</span>
                  <span>{apt.건축년도}년</span>
                  <span className="text-slate-200">·</span>
                  <span>{apt.count}건</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[16px] font-bold text-slate-900 tabular-nums">
                  {formatPrice(sortMode === 'max' ? apt.maxPrice : apt.avgPrice)}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {sortMode === 'max' ? '최고가' : '평균'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 py-2.5 flex items-center justify-center gap-1 text-[14px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          {apartments.length - INITIAL_COUNT}개 더보기
          <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}
