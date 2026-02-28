'use client';

import type { MetroStatsResponse } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface MetroTableRow {
  code: string;
  label: string;
  color: string;
  data: MetroStatsResponse;
}

interface MetroTableProps {
  rows: MetroTableRow[];
  selectedCodes: Set<string>;
  onToggle: (code: string) => void;
}

export default function MetroTable({
  rows,
  selectedCodes,
  onToggle,
}: MetroTableProps) {
  if (rows.length === 0) return null;

  // 평균가 내림차순 정렬
  const sorted = [...rows].sort(
    (a, b) => b.data.latestAvgPrice - a.data.latestAvgPrice
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-slate-400 font-medium">
              시도
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">
              최근 평균가
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">
              전월대비
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">
              총 거래건수
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const latest =
              row.data.stats.length > 0
                ? row.data.stats[row.data.stats.length - 1]
                : null;
            const isSelected = selectedCodes.has(row.code);

            return (
              <tr
                key={row.code}
                onClick={() => onToggle(row.code)}
                className={`border-b border-slate-50 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-50 hover:bg-slate-100'
                    : 'hover:bg-slate-50 opacity-50'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-medium text-slate-700">
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800 tabular-nums">
                  {formatPrice(row.data.latestAvgPrice)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {latest?.changeRate != null ? (
                    <span
                      className={`font-medium ${
                        latest.changeRate > 0
                          ? 'text-up'
                          : latest.changeRate < 0
                            ? 'text-down'
                            : 'text-slate-400'
                      }`}
                    >
                      {latest.changeRate > 0 ? '+' : ''}
                      {latest.changeRate}%
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                  {row.data.totalCount.toLocaleString()}건
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
