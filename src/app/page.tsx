'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Building2, BarChart3, TrendingUp, ArrowDownUp, X } from 'lucide-react';
import RegionSelector from '@/components/RegionSelector';
import StatCard from '@/components/StatCard';
import LineChart from '@/components/LineChart';
import TradeTable from '@/components/TradeTable';
import ApartmentList from '@/components/ApartmentList';
import { fetchTrades, calculateMonthlyStats } from '@/lib/api';
import { formatPrice, toSupplyPyeong } from '@/lib/utils';
import { getRegionName } from '@/lib/constants';
import type { AptTrade } from '@/lib/types';

export default function HomePage() {
  const [regionCode, setRegionCode] = useState('');
  const [trades, setTrades] = useState<AptTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const tradeTableRef = useRef<HTMLDivElement>(null);

  const handleSelectApt = useCallback((aptName: string | null) => {
    setSelectedApt(aptName);
    if (aptName && tradeTableRef.current && window.innerWidth < 1280) {
      setTimeout(() => {
        tradeTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!regionCode) return;

    setLoading(true);
    setTrades([]);
    setSelectedArea(30);
    setSelectedApt(null);
    fetchTrades(regionCode, 36)
      .then((data) => setTrades(data.trades))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [regionCode]);

  const areaGroups = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of trades) {
      const pyeong = toSupplyPyeong(t.전용면적);
      const group = Math.floor(pyeong / 10) * 10;
      map.set(group, (map.get(group) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([group, count]) => ({ group, count }));
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedArea === null) return trades;
    return trades.filter((t) => {
      const pyeong = toSupplyPyeong(t.전용면적);
      return Math.floor(pyeong / 10) * 10 === selectedArea;
    });
  }, [trades, selectedArea]);

  const tableTrades = useMemo(() => {
    if (!selectedApt) return filteredTrades;
    return filteredTrades.filter(
      (t) => t.아파트.replace(/\(\d+단지\)$/, '').trim() === selectedApt
    );
  }, [filteredTrades, selectedApt]);

  const stats = useMemo(() => calculateMonthlyStats(filteredTrades), [filteredTrades]);
  const latestStats = stats.length > 0 ? stats[stats.length - 1] : null;

  const totalCount = filteredTrades.length;
  const regionName = regionCode ? getRegionName(regionCode) : '';

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          아파트 실거래가
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          국토교통부 실거래가 공공데이터 기반 · 최근 3년
        </p>
      </div>

      {/* Region selector */}
      <RegionSelector
        selectedRegion={regionCode}
        onRegionChange={setRegionCode}
      />

      {/* Loading */}
      {loading && (
        <div className="text-center py-28">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[15px] text-slate-400">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* Data display */}
      {!loading && regionCode && trades.length > 0 && (
        <>
          {/* Area filter */}
          {areaGroups.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-slate-400 mr-1">평수</span>
              <button
                onClick={() => setSelectedArea(null)}
                className={`px-3 py-1.5 text-[14px] font-medium rounded-lg transition-all cursor-pointer ${
                  selectedArea === null
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              {areaGroups.map((g) => (
                <button
                  key={g.group}
                  onClick={() => setSelectedArea(g.group)}
                  className={`px-3 py-1.5 text-[14px] font-medium rounded-lg transition-all cursor-pointer ${
                    selectedArea === g.group
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {g.group === 0 ? '10평미만' : `${g.group}평대`}
                  <span className="ml-1 text-[12px] opacity-50">
                    {g.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="평균 거래가"
              value={latestStats ? formatPrice(latestStats.avgPrice) : '-'}
              change={latestStats?.changeRate}
              icon={<Building2 size={16} />}
            />
            <StatCard
              label="거래 건수"
              value={`${totalCount}건`}
              sub="최근 3년 누적"
              icon={<BarChart3 size={16} />}
            />
            <StatCard
              label="최고가"
              value={latestStats ? formatPrice(latestStats.maxPrice) : '-'}
              sub="최근 1개월"
              icon={<TrendingUp size={16} />}
            />
            <StatCard
              label="최저가"
              value={latestStats ? formatPrice(latestStats.minPrice) : '-'}
              sub="최근 1개월"
              icon={<ArrowDownUp size={16} />}
            />
          </div>

          {/* Chart section */}
          <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900">
                  월별 평균 거래가
                </h2>
                <p className="text-[14px] text-slate-400 mt-0.5">
                  {regionName}
                </p>
              </div>
              {latestStats?.changeRate !== null &&
                latestStats?.changeRate !== undefined && (
                  <span
                    className={`px-2.5 py-1 rounded-md text-[14px] font-semibold tabular-nums ${
                      latestStats.changeRate > 0
                        ? 'bg-up-bg text-up'
                        : latestStats.changeRate < 0
                          ? 'bg-down-bg text-down'
                          : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {latestStats.changeRate > 0 ? '+' : ''}
                    {latestStats.changeRate}%
                  </span>
                )}
            </div>
            <LineChart data={stats} />
          </section>

          {/* Apartment list + Trade table: side-by-side on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Apartment list section */}
            <section className="bg-white rounded-2xl border border-slate-100/80 py-5">
              <div className="mb-3 px-5">
                <h2 className="text-[17px] font-semibold text-slate-900">
                  아파트별 시세
                </h2>
                <p className="text-[14px] text-slate-400 mt-0.5">
                  공급면적 기준 · 최근 거래 평균
                </p>
              </div>
              <ApartmentList
                trades={filteredTrades}
                selectedApt={selectedApt}
                onSelectApt={handleSelectApt}
              />
            </section>

            {/* Trade table section */}
            <section
              ref={tradeTableRef}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6 scroll-mt-20"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-semibold text-slate-900">
                      거래 내역
                    </h2>
                    {selectedApt && (
                      <button
                        onClick={() => setSelectedApt(null)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[13px] font-medium hover:bg-primary-100 transition-colors cursor-pointer"
                      >
                        {selectedApt}
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-[14px] text-slate-400 mt-0.5">
                    {regionName} · 최근 3년
                  </p>
                </div>
                <span className="text-[14px] text-slate-400 tabular-nums">
                  {tableTrades.length}건
                </span>
              </div>
              <TradeTable trades={tableTrades} />
            </section>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !regionCode && (
        <div className="text-center py-28">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <Building2 size={24} className="text-primary-400" />
          </div>
          <p className="text-[17px] font-semibold text-slate-700 mb-1">
            지역을 선택해주세요
          </p>
          <p className="text-[15px] text-slate-400 leading-relaxed">
            시/도와 시/군/구를 선택하면
            <br />
            아파트 실거래가 데이터를 확인할 수 있습니다
          </p>
        </div>
      )}

      {/* No data */}
      {!loading && regionCode && trades.length === 0 && (
        <div className="text-center py-28">
          <p className="text-[15px] text-slate-400">
            해당 지역의 거래 데이터가 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
