'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchMetroStats } from '@/lib/api';
import type { MetroStatsResponse } from '@/lib/types';
import MetroChart from '@/components/MetroChart';
import type { MetroSeries } from '@/components/MetroChart';
import MetroTable from '@/components/MetroTable';

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
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  // 선택된 시도의 데이터를 병렬 fetch
  useEffect(() => {
    if (selected.size === 0) return;

    const codes = [...selected];
    // 이미 로드된 코드는 제외
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

  return (
    <div className="space-y-8">
      {/* 타이틀 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          시도별 비교
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          전국 시도 단위 평균 거래가 비교 · 최근 3년
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
              평균 거래가 추이
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
