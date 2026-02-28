import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { AptTrade } from '@/lib/types';

const CACHE_MAX_AGE = 86400; // 24시간
const STALE_REVALIDATE = 3600; // 1시간
const PAGE_SIZE = 1000; // Supabase 기본 row limit

/**
 * 프론트엔드 지역코드 → DB에 실제 저장된 sggCd 매핑
 * MOLIT API가 반환하는 sggCd가 요청 LAWD_CD와 다른 경우
 */
const DISTRICT_CODE_MAP: Record<string, string[]> = {
  '41170': ['41171'],                     // 안양시 만안구
  '41190': ['41192', '41194', '41196'],   // 부천시 (원미구,소사구,오정구)
  '41270': ['41271'],                     // 안산시 상록구
  '41460': ['41465'],                     // 용인시 처인구
  '41590': ['41591', '41595'],            // 화성시
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lawdCd = searchParams.get('lawdCd');
  const months = parseInt(searchParams.get('months') || '36');

  if (!lawdCd) {
    return NextResponse.json(
      { error: '지역코드(lawdCd)가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    // 조회 기간 계산
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;

    // district_code 매핑 처리
    const supabase = getSupabase();
    const codes = DISTRICT_CODE_MAP[lawdCd] || [lawdCd];

    // Supabase 기본 limit(1000건) 초과 대응: 페이지네이션
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRows: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('apt_trades')
        .select('*')
        .in('district_code', codes)
        .or(
          `deal_year.gt.${startYear},and(deal_year.eq.${startYear},deal_month.gte.${startMonth})`
        )
        .order('deal_year', { ascending: false })
        .order('deal_month', { ascending: false })
        .order('deal_day', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('[Supabase] 쿼리 에러:', error);
        return NextResponse.json(
          { error: '데이터를 불러오는 중 오류가 발생했습니다' },
          { status: 502 }
        );
      }

      allRows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // DB 컬럼(영문) → AptTrade 인터페이스(한글) 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trades: AptTrade[] = allRows.map((row: any) => ({
      아파트: row.apartment_name ?? '',
      거래금액: row.deal_amount ?? 0,
      년: row.deal_year ?? 0,
      월: row.deal_month ?? 0,
      일: row.deal_day ?? 0,
      전용면적: row.exclusive_area ?? 0,
      층: row.floor ?? 0,
      건축년도: row.build_year ?? 0,
      법정동: row.dong_name ?? '',
      지역코드: row.district_code ?? lawdCd,
      도로명: row.road_name ?? '',
      지번: row.jibun ?? '',
      거래유형: row.deal_type ?? '',
      매도자: row.seller_type ?? '',
      매수자: row.buyer_type ?? '',
      중개사소재지: row.agent_location ?? '',
      등기일자: row.reg_date ?? '',
      아파트동: row.apt_dong ?? '',
      단지일련번호: row.apt_seq ?? '',
      토지임대부: row.land_leasehold ?? '',
    }));

    return NextResponse.json(
      { trades },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_REVALIDATE}`,
        },
      }
    );
  } catch (error) {
    console.error('[Supabase] 에러:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다' },
      { status: 502 }
    );
  }
}
