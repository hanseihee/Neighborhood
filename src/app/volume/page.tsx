'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchMetroStats } from '@/lib/api';
import { useTradeType, TradeTypeToggle } from '@/lib/trade-type';
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

function formatMonth(m: string): string {
  return `${m.slice(0, 4)}.${m.slice(4)}`;
}

export default function VolumePage() {
  const { tradeType } = useTradeType();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED)
  );
  const [dataMap, setDataMap] = useState<Map<string, MetroStatsResponse>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const toggleSido = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  // 모든 시도 데이터를 초기 로드
  useEffect(() => {
    setLoading(true);
    Promise.all(
      METRO_LIST.map((m) =>
        fetchMetroStats(m.code, 24, tradeType).then((res) => ({ code: m.code, res }))
      )
    )
      .then((results) => {
        const map = new Map<string, MetroStatsResponse>();
        for (const { code, res } of results) {
          map.set(code, res);
        }
        setDataMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tradeType]);

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

  // 월별 시도 피벗 데이터
  const monthlyPivotData = useMemo(() => {
    if (dataMap.size === 0) return null;

    const allMonths = new Set<string>();
    const lookup = new Map<string, Map<string, number>>();

    for (const m of METRO_LIST) {
      const data = dataMap.get(m.code);
      if (!data) continue;
      const monthMap = new Map<string, number>();
      for (const stat of data.stats) {
        allMonths.add(stat.month);
        monthMap.set(stat.month, stat.count);
      }
      lookup.set(m.code, monthMap);
    }

    const months = [...allMonths].sort().reverse();
    return { months, lookup };
  }, [dataMap]);

  const displayMonths = monthlyPivotData
    ? showAllMonths
      ? monthlyPivotData.months
      : monthlyPivotData.months.slice(0, 12)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          전국 거래량
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          시도별 월간 아파트 {tradeType === 'rent' ? '전세' : '매매'} 건수 추이 · 최근 3년
        </p>
        <div className="mt-3">
          <TradeTypeToggle />
        </div>
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

      {/* 월별 시도별 거래량 테이블 */}
      {monthlyPivotData && displayMonths.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900">
                월별 시도별 거래량
              </h2>
              <p className="text-[14px] text-slate-400 mt-0.5">
                단위: 건
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 text-slate-400 font-medium sticky left-0 bg-white z-10 min-w-[72px]">
                    월
                  </th>
                  {METRO_LIST.map((m) => (
                    <th
                      key={m.code}
                      className="text-right py-2.5 px-2.5 text-slate-400 font-medium whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: m.color }}
                        />
                        {m.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayMonths.map((month, i) => (
                  <tr
                    key={month}
                    className={`border-b border-slate-50 ${
                      i % 2 === 1 ? 'bg-slate-50/40' : ''
                    }`}
                  >
                    <td
                      className={`py-2 px-3 text-slate-500 font-medium sticky left-0 z-10 whitespace-nowrap ${
                        i % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      {formatMonth(month)}
                    </td>
                    {METRO_LIST.map((m) => {
                      const count = monthlyPivotData.lookup
                        .get(m.code)
                        ?.get(month);
                      return (
                        <td
                          key={m.code}
                          className="py-2 px-2.5 text-right tabular-nums text-slate-700"
                        >
                          {count != null ? count.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {monthlyPivotData.months.length > 12 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAllMonths((v) => !v)}
                className="flex items-center gap-1 mx-auto text-[13px] text-blue-500 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                {showAllMonths ? '접기' : `전체 ${monthlyPivotData.months.length}개월 보기`}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  {showAllMonths
                    ? <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832l-3.71 3.938a.75.75 0 01-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd"/>
                    : <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  }
                </svg>
              </button>
            </div>
          )}
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
