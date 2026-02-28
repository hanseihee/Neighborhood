'use client';

import { useState } from 'react';
import type { MonthlyStats } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface ComparisonChartProps {
  data1: MonthlyStats[];
  data2: MonthlyStats[];
  label1: string;
  label2: string;
  height?: number;
}

const COLOR1 = '#14B8A6'; // teal
const COLOR2 = '#8B5CF6'; // violet

export default function ComparisonChart({
  data1,
  data2,
  label1,
  label2,
  height = 320,
}: ComparisonChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 양쪽 데이터의 월을 합산
  const allMonths = [
    ...new Set([...data1.map((d) => d.month), ...data2.map((d) => d.month)]),
  ].sort();

  if (allMonths.length < 2) return null;

  const map1 = new Map(data1.map((d) => [d.month, d]));
  const map2 = new Map(data2.map((d) => [d.month, d]));

  // 양쪽 데이터 전체의 가격 범위
  const allPrices = [
    ...data1.map((d) => d.avgPrice),
    ...data2.map((d) => d.avgPrice),
  ];
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const yMin = minP - range * 0.15;
  const yMax = maxP + range * 0.15;

  const svgWidth = 640;
  const svgHeight = height;
  const pad = { top: 28, right: 20, bottom: 40, left: 64 };
  const chartW = svgWidth - pad.left - pad.right;
  const chartH = svgHeight - pad.top - pad.bottom;

  const getX = (i: number) => pad.left + (i / (allMonths.length - 1)) * chartW;
  const getY = (price: number) =>
    pad.top + (1 - (price - yMin) / (yMax - yMin)) * chartH;

  const buildPath = (dataMap: Map<string, MonthlyStats>) => {
    const points: { x: number; y: number }[] = [];
    allMonths.forEach((m, i) => {
      const d = dataMap.get(m);
      if (d) points.push({ x: getX(i), y: getY(d.avgPrice) });
    });
    if (points.length < 2) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  };

  const path1 = buildPath(map1);
  const path2 = buildPath(map2);

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * (4 - i)) / 4;
    return { val, y: getY(val) };
  });

  const hoveredMonth = hoveredIndex !== null ? allMonths[hoveredIndex] : null;
  const hovered1 = hoveredMonth ? map1.get(hoveredMonth) : null;
  const hovered2 = hoveredMonth ? map2.get(hoveredMonth) : null;

  return (
    <div className="w-full relative">
      {/* 범례 */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLOR1 }}
          />
          <span className="text-[13px] font-medium text-slate-600">
            {label1}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLOR2 }}
          />
          <span className="text-[13px] font-medium text-slate-600">
            {label2}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="cmpGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR1} stopOpacity="0.08" />
            <stop offset="100%" stopColor={COLOR1} stopOpacity="0" />
          </linearGradient>
        </defs>

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
              fontSize="12"
              fontFamily="inherit"
            >
              {formatPrice(Math.round(val))}
            </text>
          </g>
        ))}

        {/* 라인 1 영역 */}
        {path1 && (
          <path
            d={`${path1} L ${getX(allMonths.length - 1)} ${pad.top + chartH} L ${getX(0)} ${pad.top + chartH} Z`}
            fill="url(#cmpGrad1)"
          />
        )}

        {/* 라인 */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke={COLOR1}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {path2 && (
          <path
            d={path2}
            fill="none"
            stroke={COLOR2}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
        )}

        {/* 데이터 포인트 - 시리즈 1 */}
        {allMonths.map((m, i) => {
          const d = map1.get(m);
          if (!d) return null;
          return (
            <circle
              key={`s1-${i}`}
              cx={getX(i)}
              cy={getY(d.avgPrice)}
              r={hoveredIndex === i ? 5 : 3}
              fill="white"
              stroke={COLOR1}
              strokeWidth={hoveredIndex === i ? 2.5 : 1.5}
              className="transition-all duration-150"
            />
          );
        })}

        {/* 데이터 포인트 - 시리즈 2 */}
        {allMonths.map((m, i) => {
          const d = map2.get(m);
          if (!d) return null;
          return (
            <circle
              key={`s2-${i}`}
              cx={getX(i)}
              cy={getY(d.avgPrice)}
              r={hoveredIndex === i ? 5 : 3}
              fill="white"
              stroke={COLOR2}
              strokeWidth={hoveredIndex === i ? 2.5 : 1.5}
              className="transition-all duration-150"
            />
          );
        })}

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
              fontSize="12"
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
      {hoveredIndex !== null && (hovered1 || hovered2) && (
        <div
          className="absolute pointer-events-none bg-slate-800 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-[13px] z-10"
          style={{
            left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
            top: `${((pad.top + chartH * 0.3) / svgHeight) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {hovered1 && (
            <p>
              <span style={{ color: COLOR1 }}>●</span> {label1}:{' '}
              <span className="font-bold">{formatPrice(hovered1.avgPrice)}</span>{' '}
              ({hovered1.count}건)
            </p>
          )}
          {hovered2 && (
            <p className="mt-0.5">
              <span style={{ color: COLOR2 }}>●</span> {label2}:{' '}
              <span className="font-bold">{formatPrice(hovered2.avgPrice)}</span>{' '}
              ({hovered2.count}건)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
