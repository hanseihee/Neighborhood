import type { AptTrade, MonthlyStats } from './types';
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
