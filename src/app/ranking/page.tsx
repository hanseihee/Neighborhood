'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { fetchDistrictRanking } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';

interface RankingItem {
  code: string;
  avgPrice: number;
  tradeCount: number;
}

const TIERS = [
  { name: 'S+', min: 200000, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  { name: 'S',  min: 150000, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  { name: 'A+', min: 120000, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { name: 'A',  min: 100000, color: '#CA8A04', bg: '#FEFCE8', border: '#FEF08A' },
  { name: 'B+', min: 70000,  color: '#65A30D', bg: '#F7FEE7', border: '#D9F99D' },
  { name: 'B',  min: 50000,  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  { name: 'C+', min: 40000,  color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
  { name: 'C',  min: 30000,  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { name: 'D',  min: 20000,  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { name: 'F',  min: 0,      color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
] as const;

// 코드 → {시도명, 시군구명} 매핑 빌드
const codeToName = new Map<string, { sido: string; district: string }>();
for (const region of REGIONS) {
  for (const d of region.districts) {
    codeToName.set(d.code, { sido: region.name, district: d.name });
  }
}

function getTier(avgPrice: number) {
  return TIERS.find(t => avgPrice >= t.min) || TIERS[TIERS.length - 1];
}

function getDistrictName(code: string) {
  const info = codeToName.get(code);
  if (!info) return code;
  // 시도명 줄이기: "특별시/광역시/특별자치시/도" 제거
  const short = info.sido
    .replace('특별자치시', '')
    .replace('특별자치도', '')
    .replace('특별시', '')
    .replace('광역시', '')
    .replace(/도$/, '');
  return `${short} ${info.district}`;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistrictRanking()
      .then(data => setRankings(data.rankings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 티어별 그룹핑
  const tierGroups = useMemo(() => {
    let rank = 0;
    return TIERS.map(tier => {
      const items = rankings
        .filter(r => {
          const t = getTier(r.avgPrice);
          return t.name === tier.name;
        })
        .map(r => {
          rank++;
          return { ...r, rank };
        });
      return { tier, items };
    });
  }, [rankings]);

  if (loading) {
    return (
      <div className="text-center py-28">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[15px] text-slate-400">랭킹 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-slate-900 tracking-tight">
          시군구 티어
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-400">
          최근 3개월 평균 거래가 기준 · 전국 {rankings.length}개 시군구
        </p>
      </div>

      {/* 티어 범례 */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map(tier => (
          <span
            key={tier.name}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-semibold"
            style={{ backgroundColor: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
          >
            {tier.name}
            <span className="font-normal opacity-70">
              {tier.min >= 100000
                ? `${tier.min / 10000}억↑`
                : tier.min > 0
                  ? `${tier.min / 10000}억↑`
                  : '2억↓'}
            </span>
          </span>
        ))}
      </div>

      {/* 티어별 섹션 */}
      {tierGroups.map(({ tier, items }) => {
        if (items.length === 0) return null;

        return (
          <section key={tier.name}>
            {/* 티어 헤더 */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl text-[16px] font-black"
                style={{ backgroundColor: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
              >
                {tier.name}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-700">
                  {tier.min >= 100000
                    ? `${tier.min / 10000}억 이상`
                    : tier.min > 0
                      ? `${tier.min / 10000}억 이상`
                      : '2억 미만'}
                </p>
                <p className="text-[13px] text-slate-400">{items.length}개 시군구</p>
              </div>
            </div>

            {/* 카드 그리드 */}
            <div className="flex flex-wrap gap-2">
              {items.map(item => (
                <Link
                  key={item.code}
                  href={`/?region=${item.code}`}
                  className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  {/* 순위 */}
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold"
                    style={{ backgroundColor: tier.bg, color: tier.color }}
                  >
                    {item.rank}
                  </span>

                  {/* 지역명 */}
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-800 truncate group-hover:text-slate-900">
                      {getDistrictName(item.code)}
                    </p>
                    <p className="text-[12px] text-slate-400 tabular-nums">
                      {formatPrice(item.avgPrice)}
                      <span className="ml-1.5 text-slate-300">|</span>
                      <span className="ml-1.5">{item.tradeCount.toLocaleString()}건</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {rankings.length === 0 && !loading && (
        <div className="text-center py-28">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <Trophy size={24} className="text-primary-400" />
          </div>
          <p className="text-[15px] text-slate-400">랭킹 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}
