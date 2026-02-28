'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchMetroStats } from '@/lib/api';
import type { MetroStatsResponse } from '@/lib/types';
import MetroChart from '@/components/MetroChart';
import type { MetroSeries } from '@/components/MetroChart';

const METRO_LIST = [
  { code: 'all', label: '전국', color: '#64748B' },
  { code: '11', label: '서울', color: '#14B8A6' },
  { code: '41', label: '경기', color: '#8B5CF6' },
  { code: '28', label: '인천', color: '#3B82F6' },
  { code: '26', label: '부산', color: '#F43F5E' },
  { code: '27', label: '대구', color: '#F59E0B' },
  { code: '30', label: '대전', color: '#10B981' },
  { code: '29', label: '광주', color: '#6366F1' },
  { code: '31', label: '울산', color: '#F97316' },
  { code: '36', label: '세종', color: '#EC4899' },
];

const colorMap = new Map(METRO_LIST.map((m) => [m.code, m.color]));
const labelMap = new Map(METRO_LIST.map((m) => [m.code, m.label]));

const DEFAULT_SELECTED = new Set(['all', '11', '41']);

export default function VolumePage() {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED)
  );
  const [dataMap, setDataMap] = useState<Map<string, MetroStatsResponse>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(false);

  const toggleSido = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  useEffect(() => {
    if (selected.size === 0) return;

    const codes = [...selected];
    const toFetch = codes.filter((c) => !dataMap.has(c));
    if (toFetch.length === 0) return;

    setLoading(true);
    Promise.all(
      toFetch.map((code) =>
        fetchMetroStats(code).then((res) => ({ code, res }))
      )
    )
      .then((results) => {
        setDataMap((prev) => {
          const next = new Map(prev);
          for (const { code, res } of results) {
            next.set(code, res);
          }
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const chartSeries: MetroSeries[] = useMemo(() => {
    const result: MetroSeries[] = [];
    for (const code of selected) {
      const data = dataMap.get(code);
      if (!data || data.stats.length < 2) continue;
      result.push({
        label: labelMap.get(code) || code,
        data: data.stats,
        color: colorMap.get(code) || '#94A3B8',
      });
    }
    return result;
  }, [selected, dataMap]);

  // 테이블 데이터: 최근 월 거래량 + 전월 대비 + 총 거래건수
  const tableData = useMemo(() => {
    const rows: {
      code: string;
      label: string;
      color: string;
      latestCount: number;
      prevCount: number;
      changeRate: number | null;
      totalCount: number;
    }[] = [];

    for (const [code, data] of dataMap) {
      if (data.stats.length === 0) continue;
      const latest = data.stats[data.stats.length - 1];
      const prev = data.stats.length >= 2 ? data.stats[data.stats.length - 2] : null;
      const changeRate = prev
        ? Math.round(((latest.count - prev.count) / prev.count) * 1000) / 10
        : null;

      rows.push({
        code,
        label: labelMap.get(code) || code,
        color: colorMap.get(code) || '#94A3B8',
        latestCount: latest.count,
        prevCount: prev?.count || 0,
        changeRate,
        totalCount: data.totalCount,
      });
    }

    return rows.sort((a, b) => b.latestCount - a.latestCount);
  }, [dataMap]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          전국 거래량
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          시도별 월간 아파트 거래 건수 추이 · 최근 3년
        </p>
      </div>

      {/* 시도 토글 버튼 */}
      <div className="flex flex-wrap items-center gap-2">
        {METRO_LIST.map((m) => {
          const isActive = selected.has(m.code);
          return (
            <button
              key={m.code}
              onClick={() => toggleSido(m.code)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-all cursor-pointer border ${
                isActive
                  ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
                  : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-500'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-30'
                }`}
                style={{ backgroundColor: m.color }}
              />
              {m.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 거래량 추이 차트 */}
      {chartSeries.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-900">
              월간 거래량 추이
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              {chartSeries.map((s) => s.label).join(' · ')}
            </p>
          </div>
          <MetroChart series={chartSeries} metric="count" />
        </section>
      )}

      {/* 거래량 요약 테이블 */}
      {tableData.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-900">
              시도별 거래량 요약
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              행을 클릭하면 차트에서 추가/제거할 수 있습니다
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    시도
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
                    최근월 거래량
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
                {tableData.map((row) => {
                  const isSelected = selected.has(row.code);
                  return (
                    <tr
                      key={row.code}
                      onClick={() => toggleSido(row.code)}
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
                        {row.latestCount.toLocaleString()}건
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {row.changeRate != null ? (
                          <span
                            className={`font-medium ${
                              row.changeRate > 0
                                ? 'text-up'
                                : row.changeRate < 0
                                  ? 'text-down'
                                  : 'text-slate-400'
                            }`}
                          >
                            {row.changeRate > 0 ? '+' : ''}
                            {row.changeRate}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                        {row.totalCount.toLocaleString()}건
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && selected.size === 0 && (
        <div className="text-center py-20">
          <p className="text-[15px] text-slate-400">
            위에서 시도를 선택하면 거래량 차트를 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
