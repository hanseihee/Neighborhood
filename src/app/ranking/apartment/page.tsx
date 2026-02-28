'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { fetchApartmentRanking, type ApartmentRankingItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';

const TIERS = [
  { name: 'S+', min: 500000, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { name: 'S',  min: 300000, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  { name: 'A+', min: 200000, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { name: 'A',  min: 100000, color: '#CA8A04', bg: '#FEFCE8', border: '#FEF08A' },
  { name: 'B+', min: 70000,  color: '#65A30D', bg: '#F7FEE7', border: '#D9F99D' },
  { name: 'B',  min: 50000,  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { name: 'C+', min: 40000,  color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
  { name: 'C',  min: 30000,  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { name: 'D',  min: 20000,  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { name: 'F',  min: 0,      color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
] as const;

function getTierLabel(tier: typeof TIERS[number]) {
  if (tier.min >= 100000) return `${tier.min / 10000}억↑`;
  if (tier.min > 0) return `${tier.min / 10000}억↑`;
  return '2억↓';
}

function getTierLabelFull(tier: typeof TIERS[number]) {
  if (tier.min >= 100000) return `${tier.min / 10000}억 이상`;
  if (tier.min > 0) return `${tier.min / 10000}억 이상`;
  return '2억 미만';
}

/** 티어 인덱스로 API용 가격 범위 계산 */
function getTierPriceRange(tierIndex: number) {
  const minPrice = TIERS[tierIndex].min;
  // 첫 번째 티어는 상한 없음, 나머지는 상위 티어의 min이 상한
  const maxPrice = tierIndex === 0 ? undefined : TIERS[tierIndex - 1].min;
  return { minPrice: minPrice || undefined, maxPrice };
}

export default function ApartmentRankingPage() {
  const [sido, setSido] = useState('11');
  const [selectedTier, setSelectedTier] = useState(0);
  const [apartments, setApartments] = useState<ApartmentRankingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { minPrice, maxPrice } = getTierPriceRange(selectedTier);
    fetchApartmentRanking(sido, { minPrice, maxPrice })
      .then(data => {
        setApartments(data.apartments);
        setTotalCount(data.totalCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sido, selectedTier]);

  const tier = TIERS[selectedTier];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          아파트 티어
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          최근 실거래가 기준 · 거래 3건 이상
        </p>
      </div>

      {/* 탭 + 시도 선택 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-50 rounded-xl p-1">
          <Link
            href="/ranking"
            className="px-4 py-2 rounded-lg text-[14px] font-medium text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            시군구 티어
          </Link>
          <span className="px-4 py-2 rounded-lg text-[14px] font-medium text-primary-600 bg-white shadow-sm">
            아파트 티어
          </span>
        </div>

        <select
          value={sido}
          onChange={e => setSido(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-[14px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors"
        >
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* 티어 선택 버튼 */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map((t, i) => {
          const isSelected = i === selectedTier;
          return (
            <button
              key={t.name}
              onClick={() => setSelectedTier(i)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-offset-1 shadow-sm scale-105' : 'opacity-60 hover:opacity-90'
              }`}
              style={{
                backgroundColor: t.bg,
                color: t.color,
                border: `1px solid ${t.border}`,
                ...(isSelected ? { ringColor: t.color } as Record<string, string> : {}),
              }}
            >
              {t.name}
              <span className="font-normal opacity-70">
                {getTierLabel(t)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-28">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[15px] text-slate-400">아파트 랭킹을 불러오는 중...</p>
        </div>
      )}

      {/* 선택된 티어 섹션 */}
      {!loading && apartments.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl text-[16px] font-black"
              style={{ backgroundColor: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
            >
              {tier.name}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-700">
                {getTierLabelFull(tier)}
              </p>
              <p className="text-[13px] text-slate-400">{totalCount.toLocaleString()}개 단지</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {apartments.map((item, idx) => (
              <Link
                key={`${item.apartmentName}-${item.dongName}-${idx}`}
                href={`/?region=${item.districtCode}`}
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold"
                  style={{ backgroundColor: tier.bg, color: tier.color }}
                >
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 truncate group-hover:text-slate-900">
                    {item.apartmentName}
                  </p>
                  <p className="text-[12px] text-slate-400 tabular-nums truncate">
                    {item.districtName} {item.dongName}
                    <span className="ml-1.5 text-slate-300">|</span>
                    <span className="ml-1.5">{formatPrice(item.recentPrice)}</span>
                    <span className="ml-1.5 text-slate-300">|</span>
                    <span className="ml-1.5">{item.tradeCount}건</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && apartments.length === 0 && (
        <div className="text-center py-28">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <Trophy size={24} className="text-primary-400" />
          </div>
          <p className="text-[15px] text-slate-400">해당 티어의 아파트가 없습니다</p>
        </div>
      )}
    </div>
  );
}
