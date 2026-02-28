import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { MonthlyStats, MetroStatsResponse } from '@/lib/types';

const CACHE_MAX_AGE = 86400;
const STALE_REVALIDATE = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sido = searchParams.get('sido');
  const months = parseInt(searchParams.get('months') || '36');

  if (!sido) {
    return NextResponse.json(
      { error: '시도코드(sido)가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;

    const supabase = getSupabase();

    // metro_monthly_summary (materialized view) 에서 조회 — ~324행
    let query = supabase
      .from('metro_monthly_summary')
      .select('sido_code, deal_year, deal_month, avg_price, max_price, min_price, trade_count')
      .gte('deal_year', startYear)
      .order('deal_year', { ascending: true })
      .order('deal_month', { ascending: true });

    if (sido !== 'all') {
      query = query.eq('sido_code', sido);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[metro-stats] 쿼리 에러:', error);
      return NextResponse.json(
        { error: '데이터를 불러오는 중 오류가 발생했습니다' },
        { status: 502 }
      );
    }

    const rows = data || [];

    // sido=all인 경우 전체 시도를 월별로 합산
    interface MonthAgg {
      sumPrice: number;
      maxPrice: number;
      minPrice: number;
      totalCount: number;
    }
    const byMonth = new Map<string, MonthAgg>();

    for (const row of rows) {
      // startYear의 startMonth 이전 데이터 필터
      if (row.deal_year === startYear && row.deal_month < startMonth) continue;

      const key = `${row.deal_year}${String(row.deal_month).padStart(2, '0')}`;
      const existing = byMonth.get(key);

      if (existing) {
        // all: 여러 시도 합산
        existing.sumPrice += row.avg_price * row.trade_count;
        existing.maxPrice = Math.max(existing.maxPrice, row.max_price);
        existing.minPrice = Math.min(existing.minPrice, row.min_price);
        existing.totalCount += row.trade_count;
      } else {
        byMonth.set(key, {
          sumPrice: row.avg_price * row.trade_count,
          maxPrice: row.max_price,
          minPrice: row.min_price,
          totalCount: row.trade_count,
        });
      }
    }

    const sortedMonths = [...byMonth.keys()].sort();
    const stats: MonthlyStats[] = [];
    let totalCount = 0;

    for (let i = 0; i < sortedMonths.length; i++) {
      const m = sortedMonths[i];
      const agg = byMonth.get(m)!;
      const avg = Math.round(agg.sumPrice / agg.totalCount);
      const prevAvg = i > 0 ? stats[i - 1].avgPrice : null;
      totalCount += agg.totalCount;

      stats.push({
        month: m,
        avgPrice: avg,
        maxPrice: agg.maxPrice,
        minPrice: agg.minPrice,
        count: agg.totalCount,
        changeRate: prevAvg
          ? Math.round(((avg - prevAvg) / prevAvg) * 1000) / 10
          : null,
      });
    }

    const latestAvgPrice = stats.length > 0 ? stats[stats.length - 1].avgPrice : 0;

    const response: MetroStatsResponse = {
      stats,
      totalCount,
      latestAvgPrice,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_REVALIDATE}`,
      },
    });
  } catch (error) {
    console.error('[metro-stats] 에러:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다' },
      { status: 502 }
    );
  }
}
