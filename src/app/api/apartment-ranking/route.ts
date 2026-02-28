import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getRegionName } from '@/lib/constants';

const CACHE_MAX_AGE = 86400;
const STALE_REVALIDATE = 3600;

// DB district_code → 통합 디스플레이 코드 매핑
const REVERSE_DISTRICT_MAP: Record<string, string> = {
  '41171': '41170',
  '41192': '41190',
  '41194': '41190',
  '41196': '41190',
  '41271': '41270',
  '41287': '41280',
  '41465': '41460',
  '41591': '41590',
  '41593': '41590',
  '41595': '41590',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sido = searchParams.get('sido');
    const minTrades = parseInt(searchParams.get('minTrades') || '3', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    if (!sido || !/^\d{2}$/.test(sido)) {
      return NextResponse.json(
        { error: '시도 코드(sido)가 필요합니다 (예: 11)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from('apartment_search')
      .select('apartment_name, district_code, dong_name, recent_price, trade_count')
      .like('district_code', `${sido}%`)
      .gte('trade_count', minTrades)
      .not('recent_price', 'is', null);

    if (minPrice !== undefined) {
      query = query.gte('recent_price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lt('recent_price', maxPrice);
    }

    const { data, error } = await query
      .order('recent_price', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[apartment-ranking] 쿼리 에러:', error);
      return NextResponse.json(
        { error: '데이터를 불러오는 중 오류가 발생했습니다' },
        { status: 502 }
      );
    }

    const rows = data || [];

    const apartments = rows.map(row => {
      const frontendCode = REVERSE_DISTRICT_MAP[row.district_code] || row.district_code;
      return {
        apartmentName: row.apartment_name,
        districtCode: frontendCode,
        districtName: getRegionName(frontendCode),
        dongName: row.dong_name || '',
        recentPrice: row.recent_price,
        tradeCount: row.trade_count,
      };
    });

    return NextResponse.json(
      { apartments, totalCount: apartments.length },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_REVALIDATE}`,
        },
      }
    );
  } catch (error) {
    console.error('[apartment-ranking] 에러:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다' },
      { status: 502 }
    );
  }
}
