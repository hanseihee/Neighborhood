'use client';

import { useState, useMemo } from 'react';
import type { AptTrade } from '@/lib/types';

interface VolumeHeatmapProps {
  trades: AptTrade[];
}

const COLORS = ['#F1F5F9', '#CCFBF1', '#99F6E4', '#2DD4BF', '#0D9488'];

export default function VolumeHeatmap({ trades }: VolumeHeatmapProps) {
  const [hovered, setHovered] = useState<{
    year: number;
    month: number;
    count: number;
  } | null>(null);

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

  const getColor = (count: number) => {
    if (count === 0) return COLORS[0];
    const ratio = count / maxCount;
    if (ratio <= 0.25) return COLORS[1];
    if (ratio <= 0.5) return COLORS[2];
    if (ratio <= 0.75) return COLORS[3];
    return COLORS[4];
  };

  const cellSize = 36;
  const gap = 3;
  const labelW = 44;
  const monthLabelH = 22;
  const totalW = labelW + 12 * (cellSize + gap) - gap;
  const totalH = monthLabelH + years.length * (cellSize + gap) - gap;

  return (
    <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-[17px] font-semibold text-slate-900">거래량 히트맵</h2>
        <p className="text-[14px] text-slate-400 mt-0.5">연월별 거래 건수</p>
      </div>

      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="w-full"
          onMouseLeave={() => setHovered(null)}
        >
          {/* 월 라벨 */}
          {Array.from({ length: 12 }, (_, i) => (
            <text
              key={i}
              x={labelW + i * (cellSize + gap) + cellSize / 2}
              y={14}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="11"
              fontFamily="inherit"
            >
              {i + 1}월
            </text>
          ))}

          {/* 그리드 */}
          {grid.map((row, yi) => (
            <g key={years[yi]}>
              <text
                x={0}
                y={monthLabelH + yi * (cellSize + gap) + cellSize / 2 + 4}
                fill="#94A3B8"
                fontSize="12"
                fontFamily="inherit"
                fontWeight="500"
              >
                {years[yi]}
              </text>

              {row.map((cell, mi) => (
                <rect
                  key={mi}
                  x={labelW + mi * (cellSize + gap)}
                  y={monthLabelH + yi * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={6}
                  fill={getColor(cell.count)}
                  className="transition-opacity duration-150"
                  opacity={
                    hovered &&
                    (hovered.year !== cell.year || hovered.month !== cell.month)
                      ? 0.4
                      : 1
                  }
                  onMouseEnter={() => setHovered(cell)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </g>
          ))}

          {/* 호버된 셀의 건수 표시 */}
          {hovered &&
            (() => {
              const yi = years.indexOf(hovered.year);
              if (yi === -1) return null;
              const cx =
                labelW + (hovered.month - 1) * (cellSize + gap) + cellSize / 2;
              const cy = monthLabelH + yi * (cellSize + gap) + cellSize / 2 + 4;
              return (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fill={hovered.count > 0 ? '#0F766E' : '#94A3B8'}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="inherit"
                  className="pointer-events-none"
                >
                  {hovered.count}
                </text>
              );
            })()}
        </svg>

        {/* 툴팁 */}
        {hovered && (
          <div
            className="absolute pointer-events-none bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-[13px] z-10"
            style={{
              left: `${((labelW + (hovered.month - 1) * (cellSize + gap) + cellSize / 2) / totalW) * 100}%`,
              top: `${((monthLabelH + years.indexOf(hovered.year) * (cellSize + gap)) / totalH) * 100 - 6}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold">
              {hovered.year}년 {hovered.month}월
            </p>
            <p className="text-slate-400 text-[12px]">{hovered.count}건</p>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[12px] text-slate-400">
        <span>적음</span>
        {COLORS.map((color, i) => (
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-[3px]"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>많음</span>
      </div>
    </section>
  );
}
