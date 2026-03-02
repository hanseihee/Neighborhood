import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const CACHE_MAX_AGE = 86400;
const STALE_REVALIDATE = 3600;

// 통합 시군구 코드 → 실제 DB district_code 매핑 (역매핑용)
const DB_CODE_TO_DISPLAY: Record<string, string> = {
  '41171': '41170',  // 안양시 만안구
  '41192': '41190',  // 부천시 (원미구)
  '41194': '41190',  // 부천시 (소사구)
  '41196': '41190',  // 부천시 (오정구)
  '41271': '41270',  // 안산시 상록구
  '41287': '41280',  // 고양시 덕양구
  '41465': '41460',  // 용인시 처인구
  '41591': '41590',  // 화성시
  '41593': '41590',  // 화성시
  '41595': '41590',  // 화성시
};

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'trade';
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;

    const supabase = getSupabase();

    const isRent = type === 'rent';
    const table = isRent ? 'rent_district_monthly_summary' : 'district_monthly_summary';
    const avgCol = isRent ? 'avg_deposit' : 'avg_price';

    const { data, error } = await supabase
      .from(table)
      .select(`district_code, deal_year, deal_month, ${avgCol}, trade_count`)
      .gte('deal_year', startYear)
      .order('deal_year', { ascending: false })
      .order('deal_month', { ascending: false });

    if (error) {
      console.error('[district-ranking] 쿼리 에러:', error);
      return NextResponse.json(
        { error: '데이터를 불러오는 중 오류가 발생했습니다' },
        { status: 502 }
      );
    }

    const rows = data || [];

    // district_code별 최근 3개월 가중평균가 및 거래건수 집계
    const byDistrict = new Map<string, { sumPrice: number; totalCount: number }>();

    for (const row of rows as Record<string, unknown>[]) {
      if (row.deal_year === startYear && (row.deal_month as number) < startMonth) continue;

      // DB 코드를 디스플레이 코드로 변환
      const displayCode = DB_CODE_TO_DISPLAY[row.district_code as string] || (row.district_code as string);
      const rowAvg = row[avgCol] as number;

      const tradeCount = row.trade_count as number;
      const existing = byDistrict.get(displayCode);
      if (existing) {
        existing.sumPrice += rowAvg * tradeCount;
        existing.totalCount += tradeCount;
      } else {
        byDistrict.set(displayCode, {
          sumPrice: rowAvg * tradeCount,
          totalCount: tradeCount,
        });
      }
    }

    const rankings = [...byDistrict.entries()]
      .map(([code, agg]) => ({
        code,
        avgPrice: Math.round(agg.sumPrice / agg.totalCount),
        tradeCount: agg.totalCount,
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);

    return NextResponse.json(
      { rankings },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_REVALIDATE}`,
        },
      }
    );
  } catch (error) {
    console.error('[district-ranking] 에러:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다' },
      { status: 502 }
    );
  }
}
