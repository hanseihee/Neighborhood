'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { fetchApartmentRanking, fetchTrades, fetchRents, type ApartmentRankingItem } from '@/lib/api';
import { useTradeType, TradeTypeToggle } from '@/lib/trade-type';
import { formatPrice, toSupplyPyeong, formatArea, formatDate } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';
import type { AptTrade, AptRent } from '@/lib/types';

interface DistrictGroup {
  districtCode: string;
  districtName: string;
  apartments: ApartmentRankingItem[];
  minPrice: number;
  maxPrice: number;
}

export default function FindPage() {
  const { tradeType } = useTradeType();
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [sido, setSido] = useState('all');
  const [district, setDistrict] = useState('');
  const [groups, setGroups] = useState<DistrictGroup[]>([]);
  const [totalApts, setTotalApts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [maxAge, setMaxAge] = useState('10');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [expandedApts, setExpandedApts] = useState<Set<string>>(new Set());
  const [tradeCache, setTradeCache] = useState<Map<string, AptTrade[]>>(new Map());
  const [rentCache, setRentCache] = useState<Map<string, AptRent[]>>(new Map());
  const [loadingDistricts, setLoadingDistricts] = useState<Set<string>>(new Set());

  const selectedRegion = REGIONS.find(r => r.code === sido);

  // tradeType 변경 시 캐시 초기화
  useEffect(() => {
    setTradeCache(new Map());
    setRentCache(new Map());
    setExpandedApts(new Set());
  }, [tradeType]);

  const minNum = parseInt(minInput, 10);
  const maxNum = parseInt(maxInput, 10);
  const hasMin = !isNaN(minNum) && minNum > 0;
  const hasMax = !isNaN(maxNum) && maxNum > 0;
  const budgetValid = hasMin || hasMax;

  function toDisplay(val: number) {
    return val >= 10
      ? `${val % 10 === 0 ? val / 10 : (val / 10).toFixed(1)}억`
      : `${(val * 1000).toLocaleString()}만`;
  }
  const minDisplay = hasMin ? toDisplay(minNum) : '';
  const maxDisplay = hasMax ? toDisplay(maxNum) : '';

  async function handleSearch() {
    if (!budgetValid) return;
    setLoading(true);
    setSearched(true);
    setExpandedGroups(new Set());
    setSelectedArea(null);
    setExpandedApts(new Set());
    setTradeCache(new Map());
    setRentCache(new Map());

    try {
      const minPrice = hasMin ? minNum * 1000 : undefined; // 천만원 → 만원
      const maxPrice = hasMax ? maxNum * 1000 : undefined;
      const ageNum = parseInt(maxAge, 10);
      const data = await fetchApartmentRanking(sido, {
        minPrice, maxPrice, type: tradeType,
        district: district || undefined,
        maxAge: !isNaN(ageNum) && ageNum > 0 ? ageNum : undefined,
      });

      // 시군구별 그룹핑
      const groupMap = new Map<string, ApartmentRankingItem[]>();
      for (const apt of data.apartments) {
        const key = apt.districtCode;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(apt);
      }

      const grouped: DistrictGroup[] = Array.from(groupMap.entries())
        .map(([code, apts]) => {
          const prices = apts.map(a => a.recentPrice);
          return {
            districtCode: code,
            districtName: apts[0].districtName,
            apartments: apts.sort((a, b) => b.recentPrice - a.recentPrice),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
          };
        })
        .sort((a, b) => b.maxPrice - a.maxPrice);

      setGroups(grouped);
      setTotalApts(data.totalCount);
    } catch (err) {
      console.error(err);
      setGroups([]);
      setTotalApts(0);
    } finally {
      setLoading(false);
    }
  }

  // 시군구 필터 먼저 적용
  const districtGroups = useMemo(() => {
    if (!district) return groups;
    return groups.filter(g => g.districtCode === district);
  }, [groups, district]);

  // 평수 그룹 계산 (DB의 area_group 사용)
  const areaGroups = useMemo(() => {
    const allApts = districtGroups.flatMap(g => g.apartments);
    const map = new Map<number, number>();
    for (const apt of allApts) {
      const group = apt.areaGroup;
      if (group == null) continue;
      map.set(group, (map.get(group) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([group, count]) => ({ group, count }));
  }, [districtGroups]);

  // 평수 필터가 적용된 그룹
  const filteredGroups = useMemo(() => {
    if (selectedArea === null) return districtGroups;
    return districtGroups
      .map(g => {
        const filtered = g.apartments.filter(apt => apt.areaGroup === selectedArea);
        if (filtered.length === 0) return null;
        const prices = filtered.map(a => a.recentPrice);
        return {
          ...g,
          apartments: filtered,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
        };
      })
      .filter(Boolean) as DistrictGroup[];
  }, [districtGroups, selectedArea]);

  async function toggleApt(districtCode: string, apartmentName: string, areaGroup?: number) {
    const key = `${districtCode}|${apartmentName}|${areaGroup ?? ''}`;
    const isExpanding = !expandedApts.has(key);

    setExpandedApts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    if (!isExpanding) return;

    const cache = tradeType === 'rent' ? rentCache : tradeCache;
    if (cache.has(districtCode) || loadingDistricts.has(districtCode)) return;

    setLoadingDistricts(prev => new Set(prev).add(districtCode));
    try {
      if (tradeType === 'rent') {
        const data = await fetchRents(districtCode, 12);
        setRentCache(prev => new Map(prev).set(districtCode, data.rents));
      } else {
        const data = await fetchTrades(districtCode, 12);
        setTradeCache(prev => new Map(prev).set(districtCode, data.trades));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDistricts(prev => {
        const next = new Set(prev);
        next.delete(districtCode);
        return next;
      });
    }
  }

  function toggleGroup(code: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          아파트 찾기
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          {tradeType === 'rent' ? '보증금' : '예산'}에 맞는 아파트를 지역별로 찾아보세요
        </p>
        <div className="mt-3">
          <TradeTypeToggle />
        </div>
      </div>

      {/* 검색 폼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 가격 범위 */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 relative">
            <input
              type="number"
              inputMode="numeric"
              value={minInput}
              onChange={e => setMinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="최소 (천만원)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[15px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors pr-16"
            />
            {minDisplay && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-primary-500 font-medium">
                {minDisplay}
              </span>
            )}
          </div>
          <span className="text-slate-400 text-[14px] flex-shrink-0">~</span>
          <div className="flex-1 relative">
            <input
              type="number"
              inputMode="numeric"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="최대 (천만원)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[15px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors pr-16"
            />
            {maxDisplay && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-primary-500 font-medium">
                {maxDisplay}
              </span>
            )}
          </div>
        </div>

        <select
          value={sido}
          onChange={e => { setSido(e.target.value); setDistrict(''); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors"
        >
          <option value="all">전국</option>
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>

        {selectedRegion && (
          <select
            value={district}
            onChange={e => { setDistrict(e.target.value); setSelectedArea(null); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors"
          >
            <option value="">전체 시군구</option>
            {selectedRegion.districts.map(d => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* 준공연도 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-slate-400 flex-shrink-0">준공</span>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const cur = parseInt(maxAge, 10);
                if (!isNaN(cur) && cur > 1) setMaxAge(String(cur - 1));
              }}
              className="w-9 h-[42px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-r border-slate-200"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={maxAge}
              onChange={e => setMaxAge(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="—"
              className="w-10 text-center py-2.5 text-[15px] text-slate-700 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => {
                const cur = parseInt(maxAge, 10);
                setMaxAge(String(isNaN(cur) ? 1 : Math.min(cur + 1, 99)));
              }}
              className="w-9 h-[42px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-l border-slate-200"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[13px] text-slate-400 flex-shrink-0">년 이내</span>
        </div>

        <button
          onClick={handleSearch}
          disabled={!budgetValid || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-[14px] font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Search size={16} />
          검색
        </button>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-28">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[15px] text-slate-400">아파트를 검색하는 중...</p>
        </div>
      )}

      {/* 평수 필터 */}
      {!loading && searched && groups.length > 0 && areaGroups.length > 1 && (
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

      {/* 결과 */}
      {!loading && searched && (() => {
        const filteredCount = filteredGroups.reduce((sum, g) => sum + g.apartments.length, 0);

        return filteredGroups.length > 0 ? (
            <>
              {/* 결과 요약 */}
              <div className="flex items-center gap-2 text-[14px] text-slate-500">
                <span className="font-semibold text-slate-700">{filteredGroups.length}개</span> 지역,
                <span className="font-semibold text-slate-700">{filteredCount.toLocaleString()}개</span> 아파트
              </div>

              {/* 시군구별 그룹 */}
              <div className="space-y-3">
                {filteredGroups.map(group => {
                  const isExpanded = expandedGroups.has(group.districtCode);
                  return (
                    <div
                      key={group.districtCode}
                      className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
                    >
                      {/* 그룹 헤더 */}
                      <button
                        onClick={() => toggleGroup(group.districtCode)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[15px] font-semibold text-slate-800">
                            {group.districtName}
                          </span>
                          <span className="text-[13px] text-slate-400">
                            {group.apartments.length}개
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-slate-400 tabular-nums">
                            {formatPrice(group.minPrice)} ~ {formatPrice(group.maxPrice)}
                          </span>
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* 아파트 목록 - 테이블 */}
                      {isExpanded && (
                        <div className="border-t border-slate-100">
                          {/* 테이블 헤더 */}
                          <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_120px_100px_60px] gap-x-2 px-4 py-2 text-[12px] font-medium text-slate-400 border-b border-slate-50">
                            <span>아파트</span>
                            <span className="hidden sm:block">동</span>
                            <span className="text-right">평균가</span>
                            <span className="text-right">거래</span>
                          </div>
                          {/* 테이블 바디 */}
                          {group.apartments.map((apt, idx) => {
                            const aptKey = `${apt.districtCode}|${apt.apartmentName}|${apt.areaGroup ?? ''}`;
                            const isAptExpanded = expandedApts.has(aptKey);
                            return (
                              <div key={`${apt.apartmentName}-${apt.areaGroup}-${idx}`}>
                                <div
                                  onClick={() => toggleApt(apt.districtCode, apt.apartmentName, apt.areaGroup)}
                                  className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_100px_60px] gap-x-2 items-center px-4 py-2.5 transition-colors cursor-pointer ${
                                    isAptExpanded
                                      ? 'bg-primary-50/70'
                                      : idx % 2 === 1
                                        ? 'bg-slate-50/50 hover:bg-primary-50/50'
                                        : 'hover:bg-primary-50/50'
                                  }`}
                                >
                                  <span className="text-[14px] font-medium text-slate-700 truncate flex items-center gap-1">
                                    <svg
                                      className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${isAptExpanded ? 'rotate-90' : ''}`}
                                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="truncate">
                                      {apt.apartmentName}
                                      {apt.areaGroup != null && (
                                        <span className="text-[11px] font-normal text-primary-500 ml-1">
                                          {apt.areaGroup}평대
                                        </span>
                                      )}
                                      {apt.buildYear && (
                                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                                          {apt.buildYear}년
                                        </span>
                                      )}
                                      <span className="sm:hidden text-[12px] font-normal text-slate-400 ml-1.5">
                                        {apt.dongName}
                                      </span>
                                    </span>
                                  </span>
                                  <span className="hidden sm:block text-[13px] text-slate-500 truncate">
                                    {apt.dongName}
                                  </span>
                                  <span className="text-[13px] font-semibold text-slate-700 tabular-nums text-right">
                                    {formatPrice(apt.recentPrice)}
                                  </span>
                                  <span className="text-[12px] text-slate-400 tabular-nums text-right">
                                    {apt.tradeCount}건
                                  </span>
                                </div>

                                {/* 아코디언: 거래 내역 */}
                                {isAptExpanded && (
                                  <AptTradeAccordion
                                    apt={apt}
                                    tradeType={tradeType}
                                    tradeCache={tradeCache}
                                    rentCache={rentCache}
                                    isLoading={loadingDistricts.has(apt.districtCode)}
                                    selectedArea={apt.areaGroup ?? null}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-28">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                <Search size={24} className="text-primary-400" />
              </div>
              <p className="text-[15px] text-slate-400">
                조건에 맞는 아파트가 없습니다
              </p>
            </div>
          );
      })()}
    </div>
  );
}

/** 아파트 거래 내역 아코디언 */
function AptTradeAccordion({
  apt,
  tradeType,
  tradeCache,
  rentCache,
  isLoading,
  selectedArea,
}: {
  apt: ApartmentRankingItem;
  tradeType: string;
  tradeCache: Map<string, AptTrade[]>;
  rentCache: Map<string, AptRent[]>;
  isLoading: boolean;
  selectedArea: number | null;
}) {
  const isRent = tradeType === 'rent';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-5 bg-slate-50/80 border-t border-slate-100">
        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-[13px] text-slate-400">거래 내역을 불러오는 중...</span>
      </div>
    );
  }

  const rawTrades = (isRent
    ? (rentCache.get(apt.districtCode) || []).filter(r => r.아파트 === apt.apartmentName)
    : (tradeCache.get(apt.districtCode) || []).filter(t => t.아파트 === apt.apartmentName)
  ).filter(t => {
    if (selectedArea === null) return true;
    const pyeong = toSupplyPyeong(t.전용면적);
    return Math.floor(pyeong / 10) * 10 === selectedArea;
  });

  const sorted = [...rawTrades].sort((a, b) => {
    const da = a.년 * 10000 + a.월 * 100 + a.일;
    const db = b.년 * 10000 + b.월 * 100 + b.일;
    return db - da;
  });

  if (sorted.length === 0) {
    return (
      <div className="py-4 bg-slate-50/80 border-t border-slate-100 text-center">
        <p className="text-[13px] text-slate-400">최근 거래 내역이 없습니다</p>
        <Link
          href={`/?region=${apt.districtCode}&apt=${encodeURIComponent(apt.apartmentName)}`}
          className="inline-block mt-1.5 text-[13px] text-primary-500 hover:text-primary-600 font-medium"
          onClick={e => e.stopPropagation()}
        >
          시세 페이지에서 보기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 border-t border-slate-100">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <span className="text-[12px] text-slate-400">
          {sorted.length}건
        </span>
        <Link
          href={`/?region=${apt.districtCode}&apt=${encodeURIComponent(apt.apartmentName)}`}
          className="text-[12px] text-primary-500 hover:text-primary-600 font-medium"
          onClick={e => e.stopPropagation()}
        >
          상세 보기 →
        </Link>
      </div>

      {/* 컬럼 헤더 */}
      <div className={`grid ${isRent ? 'grid-cols-[1fr_auto_auto] sm:grid-cols-[80px_1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto] sm:grid-cols-[80px_1fr_auto_auto]'} gap-x-3 px-4 py-1 text-[11px] text-slate-400 font-medium`}>
        <span className="hidden sm:block">계약일</span>
        <span className="hidden sm:block">{isRent ? '보증금' : '거래금액'}</span>
        {isRent && <span className="hidden sm:block text-right">월세</span>}
        <span className="hidden sm:block text-right">면적</span>
        <span className="hidden sm:block text-right">층</span>
      </div>

      {/* 거래 내역 */}
      {sorted.map((item, i) => {
        if (isRent) {
          const rent = item as AptRent;
          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto] sm:grid-cols-[80px_1fr_auto_auto_auto] gap-x-3 items-center px-4 py-2 text-[13px] ${
                i % 2 === 1 ? 'bg-white/50' : ''
              }`}
            >
              <span className="text-slate-400 tabular-nums text-[12px] sm:text-[13px]">
                {formatDate(rent.년, rent.월, rent.일)}
              </span>
              <span className="font-semibold text-slate-700 tabular-nums text-right sm:text-left">
                {formatPrice(rent.보증금)}
                <span className="sm:hidden text-[11px] font-normal text-slate-400 ml-1">
                  {rent.월세 > 0 ? `/ ${rent.월세}만` : '전세'}
                </span>
              </span>
              {/* 모바일에서 숨겨지는 컬럼들 */}
              <span className="hidden sm:block text-right tabular-nums">
                {rent.월세 > 0 ? (
                  <span className="text-amber-600">{rent.월세}만</span>
                ) : (
                  <span className="text-slate-400">전세</span>
                )}
              </span>
              <span className="hidden sm:block text-right text-slate-500 tabular-nums text-[12px]">
                {formatArea(rent.전용면적)}
              </span>
              <span className="hidden sm:block text-right text-slate-500 tabular-nums text-[12px]">
                {rent.층}층
              </span>
            </div>
          );
        } else {
          const trade = item as AptTrade;
          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto] sm:grid-cols-[80px_1fr_auto_auto] gap-x-3 items-center px-4 py-2 text-[13px] ${
                i % 2 === 1 ? 'bg-white/50' : ''
              }`}
            >
              <span className="text-slate-400 tabular-nums text-[12px] sm:text-[13px]">
                {formatDate(trade.년, trade.월, trade.일)}
              </span>
              <span className="font-semibold text-slate-700 tabular-nums text-right sm:text-left">
                {formatPrice(trade.거래금액)}
              </span>
              <span className="hidden sm:block text-right text-slate-500 tabular-nums text-[12px]">
                {formatArea(trade.전용면적)}
              </span>
              <span className="hidden sm:block text-right text-slate-500 tabular-nums text-[12px]">
                {trade.층}층
              </span>
            </div>
          );
        }
      })}

      <div className="h-1.5" />
    </div>
  );
}
