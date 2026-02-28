import type { AptTrade, MonthlyStats, SearchResult, MetroStatsResponse } from './types';
import { toSupplyPyeong } from './utils';

/** 실거래 데이터 fetch */
export async function fetchTrades(
  lawdCd: string,
  months: number = 36
): Promise<{ trades: AptTrade[] }> {
  const res = await fetch(`/api/trades?lawdCd=${lawdCd}&months=${months}`);
  if (!res.ok) throw new Error('데이터를 불러올 수 없습니다');
  return res.json();
}

/** 아파트 이름 검색 */
export async function searchApartments(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error('검색에 실패했습니다');
  const data = await res.json();
  return data.results;
}

/** 시도별 집계 데이터 fetch */
export async function fetchMetroStats(
  sido: string,
  months: number = 36
): Promise<MetroStatsResponse> {
  const res = await fetch(`/api/metro-stats?sido=${sido}&months=${months}`);
  if (!res.ok) throw new Error('시도별 데이터를 불러올 수 없습니다');
  return res.json();
}

/** 시군구별 집계 데이터 fetch */
export async function fetchDistrictStats(
  code: string,
  months: number = 36
): Promise<MetroStatsResponse> {
  const res = await fetch(`/api/district-stats?code=${code}&months=${months}`);
  if (!res.ok) throw new Error('시군구별 데이터를 불러올 수 없습니다');
  return res.json();
}

/** 시군구 랭킹 데이터 fetch */
export async function fetchDistrictRanking(): Promise<{
  rankings: { code: string; avgPrice: number; tradeCount: number }[];
}> {
  const res = await fetch('/api/district-ranking');
  if (!res.ok) throw new Error('랭킹 데이터를 불러올 수 없습니다');
  return res.json();
}

/** 아파트 랭킹 데이터 fetch */
export interface ApartmentRankingItem {
  apartmentName: string;
  districtCode: string;
  districtName: string;
  dongName: string;
  recentPrice: number;
  tradeCount: number;
}

export async function fetchApartmentRanking(
  sido: string,
  options?: { minTrades?: number; minPrice?: number; maxPrice?: number }
): Promise<{ apartments: ApartmentRankingItem[]; totalCount: number }> {
  const params = new URLSearchParams({ sido });
  if (options?.minTrades !== undefined) params.set('minTrades', String(options.minTrades));
  if (options?.minPrice !== undefined) params.set('minPrice', String(options.minPrice));
  if (options?.maxPrice !== undefined) params.set('maxPrice', String(options.maxPrice));
  const res = await fetch(`/api/apartment-ranking?${params}`);
  if (!res.ok) throw new Error('아파트 랭킹 데이터를 불러올 수 없습니다');
  return res.json();
}

/** 거래 목록 → 월별 통계 계산 */
export function calculateMonthlyStats(trades: AptTrade[]): MonthlyStats[] {
  const byMonth: Record<string, AptTrade[]> = {};

  for (const trade of trades) {
    const key = `${trade.년}${String(trade.월).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(trade);
  }

  const months = Object.keys(byMonth).sort();
  const stats: MonthlyStats[] = [];

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const monthTrades = byMonth[m];
    const prices = monthTrades.map(t => t.거래금액);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const prevAvg = i > 0 ? stats[i - 1].avgPrice : null;

    stats.push({
      month: m,
      avgPrice: avg,
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      count: prices.length,
      changeRate: prevAvg
        ? Math.round(((avg - prevAvg) / prevAvg) * 1000) / 10
        : null,
    });
  }

  return stats;
}

/** ㎡ → 공급면적 기준 평수 (같은 단지의 미세한 면적 차이를 하나로 묶는 기준) */
function toPyeong(sqm: number): number {
  return toSupplyPyeong(sqm);
}

/** "경희궁자이(2단지)" → "경희궁자이" (단지 번호 제거) */
function baseAptName(name: string): string {
  return name.replace(/\(\d+단지\)$/, '').trim();
}

/** 거래 목록 → 아파트별 최근 평균가 (같은 단지+동일 평수는 합산) */
export function getApartmentSummary(trades: AptTrade[]) {
  const byApt: Record<string, AptTrade[]> = {};
  for (const t of trades) {
    const pyeong = toPyeong(t.전용면적);
    const key = `${baseAptName(t.아파트)}_${pyeong}`;
    if (!byApt[key]) byApt[key] = [];
    byApt[key].push(t);
  }

  return Object.entries(byApt)
    .map(([, aptTrades]) => {
      const sorted = [...aptTrades].sort((a, b) => {
        const da = a.년 * 10000 + a.월 * 100 + a.일;
        const db = b.년 * 10000 + b.월 * 100 + b.일;
        return db - da;
      });
      const recent = sorted.slice(0, 5);
      const avgPrice = Math.round(
        recent.reduce((s, t) => s + t.거래금액, 0) / recent.length
      );
      const pyeong = toPyeong(sorted[0].전용면적);

      const maxPrice = Math.max(...aptTrades.map(t => t.거래금액));

      return {
        아파트: baseAptName(sorted[0].아파트),
        전용면적: sorted[0].전용면적,
        pyeong,
        법정동: sorted[0].법정동,
        건축년도: sorted[0].건축년도,
        avgPrice,
        maxPrice,
        count: aptTrades.length,
        latest: sorted[0],
      };
    })
    .sort((a, b) => b.avgPrice - a.avgPrice);
}

export type ApartmentSummary = ReturnType<typeof getApartmentSummary>[number];

/** 급등/급락 아이템 */
export interface PriceChangeItem {
  아파트: string;
  pyeong: number;
  법정동: string;
  recentAvg: number;
  prevAvg: number;
  changeRate: number;
  recentCount: number;
  prevCount: number;
}

/** 거래 목록 → 최근 3개월 vs 이전 3개월 비교 급등/급락 TOP5 */
export function getPriceChanges(
  trades: AptTrade[]
): { up: PriceChangeItem[]; down: PriceChangeItem[] } {
  if (trades.length === 0) return { up: [], down: [] };

  // 월 목록 추출 및 정렬
  const monthSet = new Set<string>();
  for (const t of trades) {
    monthSet.add(`${t.년}${String(t.월).padStart(2, '0')}`);
  }
  const sortedMonths = [...monthSet].sort().reverse();
  if (sortedMonths.length < 4) return { up: [], down: [] };

  const recentMonths = new Set(sortedMonths.slice(0, 3));
  const prevMonths = new Set(sortedMonths.slice(3, 6));

  // 아파트+평수 기준 그룹핑
  const byApt: Record<
    string,
    { recent: number[]; prev: number[]; trade: AptTrade; pyeong: number }
  > = {};

  for (const t of trades) {
    const p = toPyeong(t.전용면적);
    const name = baseAptName(t.아파트);
    const key = `${name}_${p}`;
    const month = `${t.년}${String(t.월).padStart(2, '0')}`;

    if (!byApt[key]) byApt[key] = { recent: [], prev: [], trade: t, pyeong: p };

    if (recentMonths.has(month)) {
      byApt[key].recent.push(t.거래금액);
    } else if (prevMonths.has(month)) {
      byApt[key].prev.push(t.거래금액);
    }
  }

  const items: PriceChangeItem[] = [];

  for (const data of Object.values(byApt)) {
    if (data.recent.length < 2 || data.prev.length < 2) continue;

    const recentAvg = Math.round(
      data.recent.reduce((a, b) => a + b, 0) / data.recent.length
    );
    const prevAvg = Math.round(
      data.prev.reduce((a, b) => a + b, 0) / data.prev.length
    );
    const changeRate =
      Math.round(((recentAvg - prevAvg) / prevAvg) * 1000) / 10;

    items.push({
      아파트: baseAptName(data.trade.아파트),
      pyeong: data.pyeong,
      법정동: data.trade.법정동,
      recentAvg,
      prevAvg,
      changeRate,
      recentCount: data.recent.length,
      prevCount: data.prev.length,
    });
  }

  const up = items
    .filter((i) => i.changeRate > 0)
    .sort((a, b) => b.changeRate - a.changeRate)
    .slice(0, 5);

  const down = items
    .filter((i) => i.changeRate < 0)
    .sort((a, b) => a.changeRate - b.changeRate)
    .slice(0, 5);

  return { up, down };
}
