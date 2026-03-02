'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { fetchApartmentRanking, type ApartmentRankingItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';

interface DistrictGroup {
  districtCode: string;
  districtName: string;
  apartments: ApartmentRankingItem[];
  minPrice: number;
  maxPrice: number;
}

export default function FindPage() {
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [sido, setSido] = useState('all');
  const [district, setDistrict] = useState('');
  const [groups, setGroups] = useState<DistrictGroup[]>([]);
  const [totalApts, setTotalApts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const selectedRegion = REGIONS.find(r => r.code === sido);

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

    try {
      const minPrice = hasMin ? minNum * 1000 : undefined; // 천만원 → 만원
      const maxPrice = hasMax ? maxNum * 1000 : undefined;
      const data = await fetchApartmentRanking(sido, { minPrice, maxPrice });

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
        .sort((a, b) => b.apartments.length - a.apartments.length);

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
          예산에 맞는 아파트를 지역별로 찾아보세요
        </p>
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
            onChange={e => setDistrict(e.target.value)}
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

      {/* 결과 */}
      {!loading && searched && (() => {
        const filtered = district
          ? groups.filter(g => g.districtCode === district)
          : groups;
        const filteredCount = filtered.reduce((sum, g) => sum + g.apartments.length, 0);

        return filtered.length > 0 ? (
            <>
              {/* 결과 요약 */}
              <div className="flex items-center gap-2 text-[14px] text-slate-500">
                <span className="font-semibold text-slate-700">{filtered.length}개</span> 지역,
                <span className="font-semibold text-slate-700">{filteredCount.toLocaleString()}개</span> 아파트
              </div>

              {/* 시군구별 그룹 */}
              <div className="space-y-3">
                {filtered.map(group => {
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
                          {group.apartments.map((apt, idx) => (
                            <Link
                              key={`${apt.apartmentName}-${apt.dongName}-${idx}`}
                              href={`/?region=${apt.districtCode}&apt=${encodeURIComponent(apt.apartmentName)}`}
                              className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_100px_60px] gap-x-2 items-center px-4 py-2.5 transition-colors hover:bg-primary-50/50 ${
                                idx % 2 === 1 ? 'bg-slate-50/50' : ''
                              }`}
                            >
                              <span className="text-[14px] font-medium text-slate-700 truncate">
                                {apt.apartmentName}
                                <span className="sm:hidden text-[12px] font-normal text-slate-400 ml-1.5">
                                  {apt.dongName}
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
                            </Link>
                          ))}
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
