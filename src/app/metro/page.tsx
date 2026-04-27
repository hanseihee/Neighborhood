'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchMetroStats } from '@/lib/api';
import { useTradeType, TradeTypeToggle } from '@/lib/trade-type';
import type { MetroStatsResponse } from '@/lib/types';
import MetroChart from '@/components/MetroChart';
import type { MetroSeries } from '@/components/MetroChart';
import MetroTable from '@/components/MetroTable';
import { formatPriceShort } from '@/lib/utils';

function formatMonth(m: string): string {
  return `${m.slice(0, 4)}.${m.slice(4)}`;
}

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

const DEFAULT_SELECTED = new Set(['11', '41']);

export default function MetroPage() {
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
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  // 선택된 시도의 데이터를 병렬 fetch (tradeType 변경 시 전체 리로드)
  useEffect(() => {
    if (selected.size === 0) return;

    const codes = [...selected];

    setLoading(true);
    setDataMap(new Map());
    Promise.all(
      codes.map((code) =>
        fetchMetroStats(code, 24, tradeType).then((res) => ({ code, res }))
      )
    )
      .then((results) => {
        const next = new Map<string, MetroStatsResponse>();
        for (const { code, res } of results) {
          next.set(code, res);
        }
        setDataMap(next);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selected, tradeType]);

  // 차트 시리즈 구성
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

  // 테이블 rows — 데이터가 로드된 모든 시도
  const tableRows = useMemo(() => {
    const rows: {
      code: string;
      label: string;
      color: string;
      data: MetroStatsResponse;
    }[] = [];
    for (const [code, data] of dataMap) {
      rows.push({
        code,
        label: labelMap.get(code) || code,
        color: colorMap.get(code) || '#94A3B8',
        data,
      });
    }
    return rows;
  }, [dataMap]);

  // 월별 시도 피벗 데이터 (평균 거래가)
  const monthlyPivotData = useMemo(() => {
    if (dataMap.size === 0) return null;

    const allMonths = new Set<string>();
    const lookup = new Map<string, Map<string, number>>();
    const pivotEntries: { code: string; label: string; color: string }[] = [];

    for (const m of METRO_LIST) {
      const data = dataMap.get(m.code);
      if (!data) continue;
      pivotEntries.push({ code: m.code, label: m.label, color: m.color });
      const monthMap = new Map<string, number>();
      for (const stat of data.stats) {
        allMonths.add(stat.month);
        monthMap.set(stat.month, stat.avgPrice);
      }
      lookup.set(m.code, monthMap);
    }

    if (pivotEntries.length === 0) return null;
    const months = [...allMonths].sort().reverse();
    return { months, lookup, entries: pivotEntries };
  }, [dataMap]);

  const displayMonths = monthlyPivotData
    ? showAllMonths
      ? monthlyPivotData.months
      : monthlyPivotData.months.slice(0, 12)
    : [];

  return (
    <div className="space-y-8">
      {/* 타이틀 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          시도별 비교
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          전국 시도 단위 평균 {tradeType === 'rent' ? '보증금' : '거래가'} 비교 · 최근 3년
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

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 멀티라인 비교 차트 */}
      {chartSeries.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-900">
              평균 {tradeType === 'rent' ? '보증금' : '거래가'} 추이
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              {chartSeries.map((s) => s.label).join(' · ')}
            </p>
          </div>
          <MetroChart series={chartSeries} />
        </section>
      )}

      {/* 시도별 요약 테이블 */}
      {tableRows.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-900">
              시도별 요약
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              행을 클릭하면 차트에서 추가/제거할 수 있습니다
            </p>
          </div>
          <MetroTable
            rows={tableRows}
            selectedCodes={selected}
            onToggle={toggleSido}
          />
        </section>
      )}

      {/* 월별 시도별 평균 거래가 테이블 */}
      {monthlyPivotData && displayMonths.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900">
                월별 평균 {tradeType === 'rent' ? '보증금' : '거래가'}
              </h2>
              <p className="text-[14px] text-slate-400 mt-0.5">
                {monthlyPivotData.entries.map((e) => e.label).join(' · ')}
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
                  {monthlyPivotData.entries.map((e) => (
                    <th
                      key={e.code}
                      className="text-right py-2.5 px-2.5 text-slate-400 font-medium whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: e.color }}
                        />
                        {e.label}
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
                    {monthlyPivotData.entries.map((e) => {
                      const price = monthlyPivotData.lookup
                        .get(e.code)
                        ?.get(month);
                      return (
                        <td
                          key={e.code}
                          className="py-2 px-2.5 text-right tabular-nums text-slate-700"
                        >
                          {price != null ? formatPriceShort(price) : '-'}
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

      {/* 빈 상태 */}
      {!loading && selected.size === 0 && (
        <div className="text-center py-20">
          <p className="text-[15px] text-slate-400">
            위에서 시도를 선택하면 비교 차트를 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
