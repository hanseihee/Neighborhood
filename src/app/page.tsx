'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  BarChart3,
  TrendingUp,
  ArrowDownUp,
  X,
  GitCompareArrows,
  Star,
} from 'lucide-react';
import RegionSelector from '@/components/RegionSelector';
import ApartmentSearch from '@/components/ApartmentSearch';
import StatCard from '@/components/StatCard';
import LineChart from '@/components/LineChart';
import ComparisonChart from '@/components/ComparisonChart';
import PriceChange from '@/components/PriceChange';
import VolumeHeatmap from '@/components/VolumeHeatmap';
import FavoritesList from '@/components/FavoritesList';
import TradeTable from '@/components/TradeTable';
import ApartmentList from '@/components/ApartmentList';
import {
  fetchTrades,
  fetchRents,
  calculateMonthlyStats,
  calculateRentMonthlyStats,
  getPriceChanges,
} from '@/lib/api';
import { useTradeType, TradeTypeToggle } from '@/lib/trade-type';
import { formatPrice, toSupplyPyeong } from '@/lib/utils';
import { getRegionName } from '@/lib/constants';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite as checkIsFavorite,
  getDistrictFavorites,
  addDistrictFavorite,
  removeDistrictFavorite,
  isDistrictFavorite,
  getLastRegion,
  setLastRegion,
} from '@/lib/favorites';
import type { FavoriteApt } from '@/lib/favorites';
import type { AptTrade, AptRent, SearchResult } from '@/lib/types';

export default function HomePage() {
  const searchParams = useSearchParams();
  const { tradeType } = useTradeType();
  const [regionCode, setRegionCode] = useState('');
  const [trades, setTrades] = useState<AptTrade[]>([]);
  const [rents, setRents] = useState<AptRent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const pendingAptRef = useRef<string | null>(null);
  const tradeTableRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // 비교 모드
  const [compareMode, setCompareMode] = useState(false);
  const [compareRegionCode, setCompareRegionCode] = useState('');
  const [compareTrades, setCompareTrades] = useState<AptTrade[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // 즐겨찾기
  const [favorites, setFavorites] = useState<FavoriteApt[]>([]);
  const [districtFavs, setDistrictFavs] = useState<string[]>([]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    setFavorites(getFavorites());
    setDistrictFavs(getDistrictFavorites());

    const paramRegion = searchParams.get('region');
    const paramApt = searchParams.get('apt');

    if (paramRegion) {
      if (paramApt) {
        pendingAptRef.current = paramApt.replace(/\(\d+단지\)$/, '').trim();
      }
      setRegionCode(paramRegion);
    } else {
      const saved = getLastRegion();
      if (saved) setRegionCode(saved);
    }
  }, [searchParams]);

  // 마지막 선택 시군구 저장
  useEffect(() => {
    if (regionCode) {
      setLastRegion(regionCode);
    }
  }, [regionCode]);

  const isDistFav = regionCode ? isDistrictFavorite(regionCode) : false;

  const handleToggleDistrictFav = useCallback(() => {
    if (!regionCode) return;
    if (isDistrictFavorite(regionCode)) {
      removeDistrictFavorite(regionCode);
    } else {
      addDistrictFavorite(regionCode);
    }
    setDistrictFavs(getDistrictFavorites());
  }, [regionCode]);

  const handleSelectApt = useCallback((aptName: string | null) => {
    setSelectedApt(aptName);
    if (aptName && tradeTableRef.current && window.innerWidth < 1280) {
      setTimeout(() => {
        tradeTableRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, []);

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      const baseName = result.apartmentName
        .replace(/\(\d+단지\)$/, '')
        .trim();
      if (result.districtCode === regionCode) {
        setSelectedApt(baseName);
      } else {
        pendingAptRef.current = baseName;
        setRegionCode(result.districtCode);
      }
    },
    [regionCode]
  );

  // 즐겨찾기에서 선택
  const handleFavoriteSelect = useCallback(
    (fav: FavoriteApt) => {
      const baseName = fav.aptName;
      if (fav.regionCode === regionCode) {
        setSelectedApt(baseName);
      } else {
        pendingAptRef.current = baseName;
        setRegionCode(fav.regionCode);
      }
    },
    [regionCode]
  );

  const handleFavoriteRemove = useCallback(
    (aptName: string, favRegionCode: string) => {
      removeFavorite(aptName, favRegionCode);
      setFavorites(getFavorites());
    },
    []
  );

  const regionName = regionCode ? getRegionName(regionCode) : '';

  const handleToggleFavorite = useCallback(
    (aptName: string, avgPrice: number) => {
      if (checkIsFavorite(aptName, regionCode)) {
        removeFavorite(aptName, regionCode);
      } else {
        addFavorite({
          aptName,
          regionCode,
          regionName,
          latestPrice: avgPrice,
          addedAt: Date.now(),
        });
      }
      setFavorites(getFavorites());
    },
    [regionCode, regionName]
  );

  const favoriteNames = useMemo(() => {
    const set = new Set<string>();
    for (const f of favorites) {
      if (f.regionCode === regionCode) set.add(f.aptName);
    }
    return set;
  }, [favorites, regionCode]);

  // 메인 지역 데이터 로드
  useEffect(() => {
    if (!regionCode) return;

    setLoading(true);
    setTrades([]);
    setRents([]);
    setSelectedArea(30);
    setSelectedApt(null);

    if (tradeType === 'rent') {
      fetchRents(regionCode, 36)
        .then((data) => {
          setRents(data.rents);
          if (pendingAptRef.current) {
            setSelectedApt(pendingAptRef.current);
            pendingAptRef.current = null;
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetchTrades(regionCode, 36)
        .then((data) => {
          setTrades(data.trades);
          if (pendingAptRef.current) {
            setSelectedApt(pendingAptRef.current);
            pendingAptRef.current = null;
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [regionCode, tradeType]);

  // 비교 지역 데이터 로드
  useEffect(() => {
    if (!compareMode || !compareRegionCode) {
      setCompareTrades([]);
      return;
    }
    setCompareLoading(true);
    fetchTrades(compareRegionCode, 36)
      .then((data) => setCompareTrades(data.trades))
      .catch(console.error)
      .finally(() => setCompareLoading(false));
  }, [compareMode, compareRegionCode]);

  const isRent = tradeType === 'rent';

  // 비교 모드 끄면 상태 초기화
  useEffect(() => {
    if (!compareMode) {
      setCompareRegionCode('');
      setCompareTrades([]);
    }
  }, [compareMode]);

  // 공통 데이터 소스 (trades or rents)
  const activeData = isRent ? rents : trades;
  const hasData = activeData.length > 0;

  const areaGroups = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of activeData) {
      const pyeong = toSupplyPyeong(t.전용면적);
      const group = Math.floor(pyeong / 10) * 10;
      map.set(group, (map.get(group) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([group, count]) => ({ group, count }));
  }, [activeData]);

  const filteredTrades = useMemo(() => {
    if (selectedArea === null) return trades;
    return trades.filter((t) => {
      const pyeong = toSupplyPyeong(t.전용면적);
      return Math.floor(pyeong / 10) * 10 === selectedArea;
    });
  }, [trades, selectedArea]);

  const filteredRents = useMemo(() => {
    if (selectedArea === null) return rents;
    return rents.filter((r) => {
      const pyeong = toSupplyPyeong(r.전용면적);
      return Math.floor(pyeong / 10) * 10 === selectedArea;
    });
  }, [rents, selectedArea]);

  const filteredData = isRent ? filteredRents : filteredTrades;

  const tableTrades = useMemo(() => {
    if (!selectedApt) return filteredTrades;
    return filteredTrades.filter(
      (t) => t.아파트.replace(/\(\d+단지\)$/, '').trim() === selectedApt
    );
  }, [filteredTrades, selectedApt]);

  const tableRents = useMemo(() => {
    if (!selectedApt) return filteredRents;
    return filteredRents.filter(
      (r) => r.아파트.replace(/\(\d+단지\)$/, '').trim() === selectedApt
    );
  }, [filteredRents, selectedApt]);

  // 월별 통계
  const stats = useMemo(
    () => isRent ? calculateRentMonthlyStats(filteredRents) : calculateMonthlyStats(filteredTrades),
    [filteredTrades, filteredRents, isRent]
  );
  const latestStats = stats.length > 0 ? stats[stats.length - 1] : null;

  // 비교 지역 통계
  const compareFilteredTrades = useMemo(() => {
    if (selectedArea === null) return compareTrades;
    return compareTrades.filter((t) => {
      const pyeong = toSupplyPyeong(t.전용면적);
      return Math.floor(pyeong / 10) * 10 === selectedArea;
    });
  }, [compareTrades, selectedArea]);

  const compareStats = useMemo(
    () => calculateMonthlyStats(compareFilteredTrades),
    [compareFilteredTrades]
  );
  const compareLatestStats =
    compareStats.length > 0 ? compareStats[compareStats.length - 1] : null;
  const compareRegionName = compareRegionCode
    ? getRegionName(compareRegionCode)
    : '';

  // 급등/급락 랭킹
  const priceChanges = useMemo(
    () => getPriceChanges(filteredTrades),
    [filteredTrades]
  );

  // 선택된 아파트 시세 추이
  const aptStats = useMemo(
    () => {
      if (!selectedApt) return [];
      return isRent
        ? calculateRentMonthlyStats(tableRents)
        : calculateMonthlyStats(tableTrades);
    },
    [selectedApt, tableTrades, tableRents, isRent]
  );

  const totalCount = filteredData.length;

  return (
    <div className="space-y-8">
      {/* 1. 타이틀 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          아파트 시세
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          국토교통부 {isRent ? '전월세' : '실거래가'} 공공데이터 기반 · 최근 3년
        </p>
        <div className="mt-3">
          <TradeTypeToggle />
        </div>
      </div>

      {/* 2. 지역 선택 + 검색 + 비교 토글 */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <RegionSelector
            selectedRegion={regionCode}
            onRegionChange={(code) => {
              pendingAptRef.current = null;
              setRegionCode(code);
            }}
          />
          <ApartmentSearch onSelect={handleSearchSelect} />
          {regionCode && (
            <>
              <button
                onClick={handleToggleDistrictFav}
                className={`h-10 w-10 rounded-lg transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
                  isDistFav
                    ? 'bg-amber-50 text-amber-500 border border-amber-200'
                    : 'bg-white border border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-400'
                }`}
                title={isDistFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <Star size={16} fill={isDistFav ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setCompareMode((prev) => !prev)}
                className={`h-10 px-4 rounded-lg text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  compareMode
                    ? 'bg-compare text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-compare hover:text-compare'
                }`}
              >
                <GitCompareArrows size={15} />
                비교
              </button>
            </>
          )}
        </div>

        {/* 비교 지역 선택 */}
        {compareMode && (
          <div className="flex items-center gap-2 pl-0 sm:pl-6">
            <span className="text-[13px] text-compare font-medium flex-shrink-0">
              비교 지역
            </span>
            <RegionSelector
              selectedRegion={compareRegionCode}
              onRegionChange={setCompareRegionCode}
            />
            {compareLoading && (
              <div className="w-4 h-4 border-2 border-compare border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        )}

        {/* 시군구 즐겨찾기 칩 */}
        {districtFavs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-slate-400 mr-0.5">
              <Star size={13} className="inline -mt-0.5 mr-0.5" />
              즐겨찾기
            </span>
            {districtFavs.map((code) => (
              <button
                key={code}
                onClick={() => {
                  pendingAptRef.current = null;
                  setRegionCode(code);
                }}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
                  regionCode === code
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                {getRegionName(code)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. 즐겨찾기 패널 */}
      {favorites.length > 0 && (
        <FavoritesList
          favorites={favorites}
          onSelect={handleFavoriteSelect}
          onRemove={handleFavoriteRemove}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-28">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[15px] text-slate-400">
            데이터를 불러오는 중...
          </p>
        </div>
      )}

      {/* Data display */}
      {!loading && regionCode && hasData && (
        <>
          {/* 4. 평수 필터 */}
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
                  <span className="ml-1 text-[12px] opacity-50">{g.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* 5. Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label={isRent ? '평균 보증금' : '평균 거래가'}
              value={latestStats ? formatPrice(latestStats.avgPrice) : '-'}
              change={latestStats?.changeRate}
              sub={
                compareMode && compareLatestStats
                  ? `비교: ${formatPrice(compareLatestStats.avgPrice)}`
                  : undefined
              }
              icon={<Building2 size={16} />}
            />
            <StatCard
              label="거래 건수"
              value={`${totalCount}건`}
              sub={
                compareMode && compareFilteredTrades.length > 0
                  ? `비교: ${compareFilteredTrades.length}건`
                  : '최근 3년 누적'
              }
              icon={<BarChart3 size={16} />}
            />
            <StatCard
              label="최고가"
              value={latestStats ? formatPrice(latestStats.maxPrice) : '-'}
              sub={
                compareMode && compareLatestStats
                  ? `비교: ${formatPrice(compareLatestStats.maxPrice)}`
                  : '최근 1개월'
              }
              icon={<TrendingUp size={16} />}
            />
            <StatCard
              label="최저가"
              value={latestStats ? formatPrice(latestStats.minPrice) : '-'}
              sub={
                compareMode && compareLatestStats
                  ? `비교: ${formatPrice(compareLatestStats.minPrice)}`
                  : '최근 1개월'
              }
              icon={<ArrowDownUp size={16} />}
            />
          </div>

          {/* 6. 급등/급락 랭킹 (임시 숨김) */}
          {/* <PriceChange
            up={priceChanges.up}
            down={priceChanges.down}
            onSelectApt={handleSelectApt}
          /> */}

          {/* 7. 차트 (비교 모드 or 기본) */}
          <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900">
                  {compareMode && compareRegionCode
                    ? `지역 간 평균 ${isRent ? '보증금' : '거래가'} 비교`
                    : `월별 평균 ${isRent ? '보증금' : '거래가'}`}
                </h2>
                <p className="text-[14px] text-slate-400 mt-0.5">
                  {compareMode && compareRegionCode
                    ? `${regionName} vs ${compareRegionName}`
                    : regionName}
                </p>
              </div>
              {!compareMode &&
                latestStats?.changeRate !== null &&
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
            {compareMode && compareRegionCode && compareStats.length > 1 ? (
              <ComparisonChart
                data1={stats}
                data2={compareStats}
                label1={regionName}
                label2={compareRegionName}
              />
            ) : (
              <LineChart data={stats} />
            )}
          </section>

          {/* 8. 아파트별 시세 추이 (선택 시) */}
          {selectedApt && aptStats.length >= 2 && (
            <section className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900">
                    아파트별 시세 추이
                  </h2>
                  <p className="text-[14px] text-slate-400 mt-0.5">
                    {selectedApt} · {regionName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApt(null)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[13px] font-medium hover:bg-primary-100 transition-colors cursor-pointer"
                >
                  {selectedApt}
                  <X size={13} />
                </button>
              </div>
              <LineChart data={aptStats} />
            </section>
          )}

          {/* 9. 거래량 히트맵 */}
          {!isRent && <VolumeHeatmap trades={filteredTrades} />}

          {/* 10. 아파트 목록 + 거래 내역 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* 아파트 목록 */}
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
                rents={filteredRents}
                mode={tradeType}
                selectedApt={selectedApt}
                onSelectApt={handleSelectApt}
                favoriteNames={favoriteNames}
                onToggleFavorite={handleToggleFavorite}
              />
            </section>

            {/* 거래 내역 */}
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
                  {isRent ? tableRents.length : tableTrades.length}건
                </span>
              </div>
              <TradeTable trades={tableTrades} rents={tableRents} mode={tradeType} />
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
      {!loading && regionCode && !hasData && (
        <div className="text-center py-28">
          <p className="text-[15px] text-slate-400">
            해당 지역의 거래 데이터가 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
