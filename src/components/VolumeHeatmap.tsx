'use client';

import { useMemo } from 'react';
import type { AptTrade } from '@/lib/types';

interface VolumeHeatmapProps {
  trades: AptTrade[];
}

const COLORS = [
  { bg: '#F1F5F9', text: '#94A3B8' },
  { bg: '#CCFBF1', text: '#0F766E' },
  { bg: '#99F6E4', text: '#0F766E' },
  { bg: '#2DD4BF', text: '#FFFFFF' },
  { bg: '#0D9488', text: '#FFFFFF' },
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function VolumeHeatmap({ trades }: VolumeHeatmapProps) {
  const { grid, years, maxCount } = useMemo(() => {
    const countMap: Record<string, number> = {};
    const yearSet = new Set<number>();

    for (const t of trades) {
      const key = `${t.년}-${t.월}`;
      countMap[key] = (countMap[key] || 0) + 1;
      yearSet.add(t.년);
    }

    const years = [...yearSet].sort();
    const maxCount = Math.max(...Object.values(countMap), 1);

    const grid: { year: number; month: number; count: number }[][] = [];
    for (const year of years) {
      const row: { year: number; month: number; count: number }[] = [];
      for (let month = 1; month <= 12; month++) {
        row.push({ year, month, count: countMap[`${year}-${month}`] || 0 });
      }
      grid.push(row);
    }

    return { grid, years, maxCount };
  }, [trades]);

  if (years.length === 0) return null;

  const getColorIdx = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900">
            거래량 히트맵
          </h2>
          <p className="text-[14px] text-slate-400 mt-0.5">연월별 거래 건수</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <span>적음</span>
          {COLORS.map((c, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: c.bg }}
            />
          ))}
          <span>많음</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
          <thead>
            <tr>
              <th className="w-10" />
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="text-[11px] text-slate-400 font-normal pb-1.5 text-center"
                >
                  {m}월
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, yi) => (
              <tr key={years[yi]}>
                <td className="text-[12px] text-slate-400 font-medium pr-1 text-right whitespace-nowrap">
                  {years[yi]}
                </td>
                {row.map((cell) => {
                  const ci = getColorIdx(cell.count);
                  return (
                    <td
                      key={cell.month}
                      className="text-center rounded-md transition-transform hover:scale-110"
                      style={{
                        backgroundColor: COLORS[ci].bg,
                        height: 32,
                        minWidth: 32,
                      }}
                      title={`${cell.year}년 ${cell.month}월 · ${cell.count}건`}
                    >
                      <span
                        className="text-[11px] font-semibold tabular-nums leading-none"
                        style={{ color: COLORS[ci].text }}
                      >
                        {cell.count}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
