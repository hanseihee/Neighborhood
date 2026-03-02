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
    const districtParam = searchParams.get('district');
    const minTrades = parseInt(searchParams.get('minTrades') || '3', 10);
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

    if (!sido) {
      return NextResponse.json(
        { error: '시도 코드(sido)가 필요합니다 (예: 11 또는 all)' },
        { status: 400 }
      );
    }

    if (sido !== 'all' && !/^\d{2}$/.test(sido)) {
      return NextResponse.json(
        { error: '시도 코드가 올바르지 않습니다 (예: 11 또는 all)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const type = searchParams.get('type') || 'trade';
    const isRent = type === 'rent';
    const table = isRent ? 'rent_apartment_search' : 'apartment_search';
    const priceCol = isRent ? 'recent_deposit' : 'recent_price';
    const countCol = isRent ? 'jeonse_count' : 'trade_count';

    let query = supabase
      .from(table)
      .select(`apartment_name, district_code, dong_name, ${priceCol}, ${countCol}, avg_area, build_year, area_group`)
      .gte(countCol, minTrades)
      .not(priceCol, 'is', null);

    if (districtParam) {
      query = query.eq('district_code', districtParam);
    } else if (sido !== 'all') {
      query = query.like('district_code', `${sido}%`);
    }

    if (minPrice !== undefined) {
      query = query.gte(priceCol, minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lt(priceCol, maxPrice);
    }

    const built = query.order(priceCol, { ascending: false });
    const { data, error } = districtParam
      ? await built                // 시군구 지정 시 limit 없음
      : await built.limit(3000);   // 시도 전체는 3000건 제한

    if (error) {
      console.error('[apartment-ranking] 쿼리 에러:', error);
      return NextResponse.json(
        { error: '데이터를 불러오는 중 오류가 발생했습니다' },
        { status: 502 }
      );
    }

    const rows = data || [];

    const apartments = rows.map((row: Record<string, unknown>) => {
      const frontendCode = REVERSE_DISTRICT_MAP[row.district_code as string] || row.district_code;
      return {
        apartmentName: row.apartment_name,
        districtCode: frontendCode,
        districtName: getRegionName(frontendCode as string),
        dongName: row.dong_name || '',
        recentPrice: row[priceCol] as number,
        tradeCount: row[countCol] as number,
        avgArea: row.avg_area != null ? Number(row.avg_area) : undefined,
        buildYear: row.build_year != null ? Number(row.build_year) : undefined,
        areaGroup: row.area_group != null ? Number(row.area_group) : undefined,
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
