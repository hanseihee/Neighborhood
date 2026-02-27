'use client';

import { useState } from 'react';
import type { MonthlyStats } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface LineChartProps {
  data: MonthlyStats[];
  height?: number;
}

export default function LineChart({ data, height = 280 }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length < 2) return null;

  const svgWidth = 640;
  const svgHeight = height;
  const pad = { top: 28, right: 20, bottom: 40, left: 64 };
  const chartW = svgWidth - pad.left - pad.right;
  const chartH = svgHeight - pad.top - pad.bottom;

  const prices = data.map((d) => d.avgPrice);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const yMin = minP - range * 0.15;
  const yMax = maxP + range * 0.15;

  const getX = (i: number) => pad.left + (i / (data.length - 1)) * chartW;
  const getY = (price: number) =>
    pad.top + (1 - (price - yMin) / (yMax - yMin)) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.avgPrice)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(data.length - 1)} ${pad.top + chartH} L ${getX(0)} ${pad.top + chartH} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * (4 - i)) / 4;
    return { val, y: getY(val) };
  });

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
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

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#14B8A6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(d.avgPrice)}
              r={hoveredIndex === i ? 5.5 : 3.5}
              fill="white"
              stroke="#14B8A6"
              strokeWidth={hoveredIndex === i ? 2.5 : 1.5}
              className="transition-all duration-150"
            />
            <rect
              x={getX(i) - chartW / data.length / 2}
              y={pad.top}
              width={chartW / data.length}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              className="cursor-pointer"
            />
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
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
            {d.month.slice(2, 4)}.{d.month.slice(4)}
          </text>
        ))}

        {/* Hover vertical line */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={pad.top}
            x2={getX(hoveredIndex)}
            y2={pad.top + chartH}
            stroke="#14B8A6"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.3"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute pointer-events-none bg-slate-800 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-[13px]"
          style={{
            left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
            top: `${(getY(data[hoveredIndex].avgPrice) / svgHeight) * 100 - 14}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-bold tabular-nums text-[14px]">
            {formatPrice(data[hoveredIndex].avgPrice)}
          </p>
          <p className="text-slate-400 text-[12px] mt-0.5">
            {data[hoveredIndex].count}건
            {data[hoveredIndex].changeRate !== null &&
              ` · ${data[hoveredIndex].changeRate! > 0 ? '+' : ''}${data[hoveredIndex].changeRate}%`}
          </p>
        </div>
      )}
    </div>
  );
}
