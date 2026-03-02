import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { AptRent } from '@/lib/types';

const CACHE_MAX_AGE = 86400; // 24시간
const STALE_REVALIDATE = 3600; // 1시간
const PAGE_SIZE = 1000;

/**
 * 프론트엔드 지역코드 → DB에 실제 저장된 sggCd 매핑
 */
const DISTRICT_CODE_MAP: Record<string, string[]> = {
  '41170': ['41171'],
  '41190': ['41192', '41194', '41196'],
  '41270': ['41271'],
  '41460': ['41465'],
  '41590': ['41591', '41595'],
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
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;

    const supabase = getSupabase();
    const codes = DISTRICT_CODE_MAP[lawdCd] || [lawdCd];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRows: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('apt_rents')
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

    // DB 컬럼(영문) → AptRent 인터페이스(한글) 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rents: AptRent[] = allRows.map((row: any) => ({
      아파트: row.apartment_name ?? '',
      보증금: row.deposit ?? 0,
      월세: row.monthly_rent ?? 0,
      년: row.deal_year ?? 0,
      월: row.deal_month ?? 0,
      일: row.deal_day ?? 0,
      전용면적: row.exclusive_area ?? 0,
      층: row.floor ?? 0,
      건축년도: row.build_year ?? 0,
      법정동: row.dong_name ?? '',
      지역코드: row.district_code ?? lawdCd,
      지번: row.jibun ?? '',
      계약기간: row.contract_term ?? '',
      계약구분: row.contract_type ?? '',
      갱신요구권사용: row.use_rr_right ?? '',
      종전보증금: row.pre_deposit ?? null,
      종전월세: row.pre_monthly_rent ?? null,
    }));

    return NextResponse.json(
      { rents },
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
