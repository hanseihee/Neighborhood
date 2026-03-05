import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getRegionName } from '@/lib/constants';

/**
 * DB district_code → 프론트엔드 지역코드 역매핑
 * trades/route.ts의 DISTRICT_CODE_MAP 역방향
 */
const REVERSE_DISTRICT_MAP: Record<string, string> = {
  '41171': '41170',   // 안양시 만안구
  '41192': '41190',   // 부천시 (원미구)
  '41194': '41190',   // 부천시 (소사구)
  '41196': '41190',   // 부천시 (오정구)
  '41271': '41270',   // 안산시 상록구
  '41465': '41460',   // 용인시 처인구
  '41591': '41590',   // 화성시
  '41595': '41590',   // 화성시
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 30);

  if (!query || query.length < 1) {
    return NextResponse.json(
      { error: '검색어(q)가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();

    // apartment_search 뷰 조회 (2.4만건, 33ms)
    const { data, error } = await supabase
      .from('apartment_search')
      .select('apartment_name, district_code, dong_name, recent_price, trade_count')
      .ilike('apartment_name', `%${query}%`)
      .order('trade_count', { ascending: false })
      .limit(limit * 5);

    if (error) {
      console.error('[Search] Supabase 쿼리 에러:', error);
      return NextResponse.json(
        { error: '검색 중 오류가 발생했습니다' },
        { status: 502 }
      );
    }

    // area_group별 행이 나뉘어 있으므로 같은 아파트+지역은 합산하여 중복 제거
    const merged = new Map<string, { apartment_name: string; district_code: string; dong_name: string; recent_price: number; trade_count: number }>();
    for (const row of data || []) {
      const key = `${row.apartment_name}|${row.district_code}`;
      const existing = merged.get(key);
      if (existing) {
        existing.trade_count += row.trade_count;
        if (row.recent_price > existing.recent_price) {
          existing.recent_price = row.recent_price;
        }
      } else {
        merged.set(key, { ...row });
      }
    }

    const results = Array.from(merged.values())
      .sort((a, b) => b.trade_count - a.trade_count)
      .slice(0, limit)
      .map((row) => {
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
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[Search] 에러:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 502 }
    );
  }
}
