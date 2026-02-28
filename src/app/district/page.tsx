'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDistrictStats } from '@/lib/api';
import { REGIONS } from '@/lib/constants';
import type { MetroStatsResponse } from '@/lib/types';
import MetroChart from '@/components/MetroChart';
import type { MetroSeries } from '@/components/MetroChart';
import MetroTable from '@/components/MetroTable';
import { X } from 'lucide-react';

const COLOR_POOL = [
  '#14B8A6', '#8B5CF6', '#3B82F6', '#F43F5E', '#F59E0B',
  '#10B981', '#6366F1', '#F97316', '#EC4899', '#64748B',
];

interface DistrictEntry {
  code: string;
  label: string;     // e.g. "강남구"
  fullLabel: string;  // e.g. "서울 강남구"
  color: string;
}

// 시군구 코드 → 짧은 이름 + 풀 이름 맵 생성
const districtNameMap = new Map<string, { short: string; full: string }>();
for (const region of REGIONS) {
  const sidoShort = region.name.replace(/(특별시|광역시|특별자치시|도)$/, '');
  for (const d of region.districts) {
    districtNameMap.set(d.code, {
      short: d.name,
      full: `${sidoShort} ${d.name}`,
    });
  }
}

const DEFAULT_CODES = ['11680', '41135']; // 강남구, 분당구

export default function DistrictPage() {
  const [entries, setEntries] = useState<DistrictEntry[]>(() =>
    DEFAULT_CODES.map((code, i) => ({
      code,
      label: districtNameMap.get(code)?.short || code,
      fullLabel: districtNameMap.get(code)?.full || code,
      color: COLOR_POOL[i % COLOR_POOL.length],
    }))
  );

  const [dataMap, setDataMap] = useState<Map<string, MetroStatsResponse>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(false);

  // 시/도 → 시군구 선택 상태
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const activeCodes = useMemo(
    () => new Set(entries.map((e) => e.code)),
    [entries]
  );

  const addDistrict = useCallback(() => {
    if (!selectedDistrict || activeCodes.has(selectedDistrict)) return;

    const names = districtNameMap.get(selectedDistrict);
    const nextColorIdx = entries.length % COLOR_POOL.length;

    setEntries((prev) => [
      ...prev,
      {
        code: selectedDistrict,
        label: names?.short || selectedDistrict,
        fullLabel: names?.full || selectedDistrict,
        color: COLOR_POOL[nextColorIdx],
      },
    ]);
    setSelectedDistrict('');
  }, [selectedDistrict, activeCodes, entries.length]);

  const removeDistrict = useCallback((code: string) => {
    setEntries((prev) => prev.filter((e) => e.code !== code));
  }, []);

  // 선택 변경 시 데이터 fetch
  useEffect(() => {
    if (entries.length === 0) return;

    const toFetch = entries
      .map((e) => e.code)
      .filter((c) => !dataMap.has(c));

    if (toFetch.length === 0) return;

    setLoading(true);
    Promise.all(
      toFetch.map((code) =>
        fetchDistrictStats(code).then((res) => ({ code, res }))
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
  }, [entries]);

  // 차트에 표시할 코드
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(
    () => new Set(DEFAULT_CODES)
  );

  // entries 변경 시 visibleCodes 동기화
  useEffect(() => {
    setVisibleCodes((prev) => {
      const next = new Set(prev);
      // 새로 추가된 것은 visible로
      for (const e of entries) {
        if (!prev.has(e.code)) next.add(e.code);
      }
      // 삭제된 것은 제거
      for (const code of prev) {
        if (!entries.some((e) => e.code === code)) next.delete(code);
      }
      return next;
    });
  }, [entries]);

  const toggleVisible = useCallback((code: string) => {
    setVisibleCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  // 차트 시리즈
  const chartSeries: MetroSeries[] = useMemo(() => {
    const result: MetroSeries[] = [];
    for (const entry of entries) {
      if (!visibleCodes.has(entry.code)) continue;
      const data = dataMap.get(entry.code);
      if (!data || data.stats.length < 2) continue;
      result.push({
        label: entry.fullLabel,
        data: data.stats,
        color: entry.color,
      });
    }
    return result;
  }, [entries, visibleCodes, dataMap]);

  // 테이블 rows
  const tableRows = useMemo(() => {
    const rows: {
      code: string;
      label: string;
      color: string;
      data: MetroStatsResponse;
    }[] = [];
    for (const entry of entries) {
      const data = dataMap.get(entry.code);
      if (!data) continue;
      rows.push({
        code: entry.code,
        label: entry.fullLabel,
        color: entry.color,
        data,
      });
    }
    return rows;
  }, [entries, dataMap]);

  // 현재 시도의 시군구 목록
  const currentDistricts = useMemo(() => {
    if (!selectedSido) return [];
    const region = REGIONS.find((r) => r.code === selectedSido);
    return region?.districts || [];
  }, [selectedSido]);

  return (
    <div className="space-y-8">
      {/* 타이틀 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          시군구별 비교
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          시군구 단위 평균 거래가 비교 · 최근 3년
        </p>
      </div>

      {/* 시군구 선택기 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-slate-400 font-medium">시/도</label>
          <select
            value={selectedSido}
            onChange={(e) => {
              setSelectedSido(e.target.value);
              setSelectedDistrict('');
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-[14px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
          >
            <option value="">선택</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-slate-400 font-medium">시/군/구</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedSido}
            className="px-3 py-2 rounded-lg border border-slate-200 text-[14px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">선택</option>
            {currentDistricts.map((d) => (
              <option
                key={d.code}
                value={d.code}
                disabled={activeCodes.has(d.code)}
              >
                {d.name} {activeCodes.has(d.code) ? '(추가됨)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addDistrict}
          disabled={!selectedDistrict || activeCodes.has(selectedDistrict)}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-[14px] font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          추가
        </button>
      </div>

      {/* 선택된 시군구 토글 버튼 */}
      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {entries.map((entry) => {
            const isVisible = visibleCodes.has(entry.code);
            return (
              <div
                key={entry.code}
                className={`flex items-center gap-1.5 pl-3.5 pr-1.5 py-2 rounded-lg text-[14px] font-medium transition-all border ${
                  isVisible
                    ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
                    : 'border-transparent bg-slate-50 text-slate-400'
                }`}
              >
                <button
                  onClick={() => toggleVisible(entry.code)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                      isVisible ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.fullLabel}
                </button>
                <button
                  onClick={() => removeDistrict(entry.code)}
                  className="ml-1 p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 비교 차트 */}
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

      {/* 요약 테이블 */}
      {tableRows.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-900">
              시군구별 요약
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              행을 클릭하면 차트에서 추가/제거할 수 있습니다
            </p>
          </div>
          <MetroTable
            rows={tableRows}
            selectedCodes={visibleCodes}
            onToggle={toggleVisible}
          />
        </section>
      )}

      {/* 빈 상태 */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[15px] text-slate-400">
            위에서 시군구를 추가하면 비교 차트를 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
