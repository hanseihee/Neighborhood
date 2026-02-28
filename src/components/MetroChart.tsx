'use client';

import { useState } from 'react';
import type { MonthlyStats } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export interface MetroSeries {
  label: string;
  data: MonthlyStats[];
  color: string;
}

interface MetroChartProps {
  series: MetroSeries[];
  height?: number;
  metric?: 'avgPrice' | 'count';
}

export default function MetroChart({ series, height = 340, metric = 'avgPrice' }: MetroChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (series.length === 0) return null;

  // 모든 시리즈의 월을 합산
  const allMonthsSet = new Set<string>();
  for (const s of series) {
    for (const d of s.data) {
      allMonthsSet.add(d.month);
    }
  }
  const allMonths = [...allMonthsSet].sort();
  if (allMonths.length < 2) return null;

  // 시리즈별 월 → 데이터 맵
  const seriesMaps = series.map((s) => new Map(s.data.map((d) => [d.month, d])));

  const getValue = (d: MonthlyStats) => metric === 'count' ? d.count : d.avgPrice;
  const formatValue = (v: number) =>
    metric === 'count' ? v.toLocaleString() + '건' : formatPrice(v);

  // 전체 값 범위
  const allValues: number[] = [];
  for (const s of series) {
    for (const d of s.data) {
      allValues.push(getValue(d));
    }
  }
  const minP = Math.min(...allValues);
  const maxP = Math.max(...allValues);
  const range = maxP - minP || 1;
  const yMin = minP - range * 0.1;
  const yMax = maxP + range * 0.1;

  const svgWidth = 700;
  const svgHeight = height;
  const pad = { top: 24, right: 20, bottom: 40, left: 68 };
  const chartW = svgWidth - pad.left - pad.right;
  const chartH = svgHeight - pad.top - pad.bottom;

  const getX = (i: number) =>
    pad.left + (i / (allMonths.length - 1)) * chartW;
  const getY = (price: number) =>
    pad.top + (1 - (price - yMin) / (yMax - yMin)) * chartH;

  const buildPath = (dataMap: Map<string, MonthlyStats>) => {
    const points: { x: number; y: number }[] = [];
    allMonths.forEach((m, i) => {
      const d = dataMap.get(m);
      if (d) points.push({ x: getX(i), y: getY(getValue(d)) });
    });
    if (points.length < 2) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  };

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * (4 - i)) / 4;
    return { val, y: getY(val) };
  });

  const hoveredMonth = hoveredIndex !== null ? allMonths[hoveredIndex] : null;

  // 툴팁 위치 계산 - 왼쪽/오른쪽 반 기준으로 방향 결정
  const tooltipOnRight =
    hoveredIndex !== null && hoveredIndex < allMonths.length / 2;

  return (
    <div className="w-full relative">
      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[13px] font-medium text-slate-600">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* 그리드 + Y 라벨 */}
        {yTicks.map(({ val, y }, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              y1={y}
              x2={svgWidth - pad.right}
              y2={y}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
            <text
              x={pad.left - 10}
              y={y + 4}
              textAnchor="end"
              fill="#94A3B8"
              fontSize="11"
              fontFamily="inherit"
            >
              {formatValue(Math.round(val))}
            </text>
          </g>
        ))}

        {/* 각 시리즈 라인 */}
        {series.map((s, si) => {
          const path = buildPath(seriesMaps[si]);
          if (!path) return null;
          return (
            <path
              key={s.label}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* 각 시리즈 데이터 포인트 */}
        {series.map((s, si) =>
          allMonths.map((m, i) => {
            const d = seriesMaps[si].get(m);
            if (!d) return null;
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={`${s.label}-${i}`}
                cx={getX(i)}
                cy={getY(getValue(d))}
                r={isHovered ? 4.5 : 2.5}
                fill="white"
                stroke={s.color}
                strokeWidth={isHovered ? 2 : 1.5}
                className="transition-all duration-150"
              />
            );
          })
        )}

        {/* 호버 영역 */}
        {allMonths.map((_, i) => (
          <rect
            key={`hover-${i}`}
            x={getX(i) - chartW / allMonths.length / 2}
            y={pad.top}
            width={chartW / allMonths.length}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            className="cursor-pointer"
          />
        ))}

        {/* X 라벨 */}
        {allMonths.map((m, i) => {
          const step = Math.max(1, Math.ceil(allMonths.length / 10));
          if (
            i !== 0 &&
            i !== allMonths.length - 1 &&
            i % step !== 0 &&
            hoveredIndex !== i
          )
            return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 10}
              textAnchor="middle"
              fill={hoveredIndex === i ? '#0D9488' : '#94A3B8'}
              fontSize="11"
              fontWeight={hoveredIndex === i ? '600' : '400'}
              fontFamily="inherit"
            >
              {m.slice(2, 4)}.{m.slice(4)}
            </text>
          );
        })}

        {/* 호버 수직선 */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={pad.top}
            x2={getX(hoveredIndex)}
            y2={pad.top + chartH}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.3"
          />
        )}
      </svg>

      {/* 툴팁 */}
      {hoveredIndex !== null && hoveredMonth && (
        <div
          className="absolute pointer-events-none bg-slate-800 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-[13px] z-10 min-w-[140px]"
          style={{
            left: tooltipOnRight
              ? `${(getX(hoveredIndex) / svgWidth) * 100 + 2}%`
              : `${(getX(hoveredIndex) / svgWidth) * 100 - 2}%`,
            top: `${((pad.top + 20) / svgHeight) * 100}%`,
            transform: tooltipOnRight
              ? 'translateY(0)'
              : 'translate(-100%, 0)',
          }}
        >
          <p className="text-slate-400 text-[11px] mb-1">
            {hoveredMonth.slice(0, 4)}.{hoveredMonth.slice(4)}
          </p>
          {series.map((s, si) => {
            const d = seriesMaps[si].get(hoveredMonth);
            if (!d) return null;
            return (
              <p key={s.label} className="leading-relaxed">
                <span style={{ color: s.color }}>●</span>{' '}
                <span className="text-slate-300">{s.label}</span>{' '}
                <span className="font-bold">{formatValue(getValue(d))}</span>
                {metric === 'avgPrice' && (
                  <span className="text-slate-400 ml-1">({d.count}건)</span>
                )}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
