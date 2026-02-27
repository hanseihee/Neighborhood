import { NextRequest, NextResponse } from 'next/server';
import { generateSampleTrades } from '@/lib/sample-data';
import type { AptTrade } from '@/lib/types';

// Vercel Hobby 플랜 Function 타임아웃 설정 (기본 10초 → 30초)
export const maxDuration = 30;

const BATCH_SIZE = 6;
const CACHE_MAX_AGE = 86400; // 24시간
const STALE_REVALIDATE = 3600; // 1시간

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lawdCd = searchParams.get('lawdCd');
  const months = parseInt(searchParams.get('months') || '6');

  if (!lawdCd) {
    return NextResponse.json(
      { error: '지역코드(lawdCd)가 필요합니다' },
      { status: 400 }
    );
  }

  const apiKey = process.env.MOLIT_API_KEY;

  // API 키가 없으면 샘플 데이터 반환
  if (!apiKey) {
    const trades = generateSampleTrades(lawdCd);
    return NextResponse.json({ trades, isSample: true });
  }

  // 실제 API 호출
  try {
    const now = new Date();
    const monthList: string[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthList.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // 6개씩 배치 병렬 호출 (24회 순차 → 4배치 병렬 = ~3-5초)
    const allTrades: AptTrade[] = [];
    for (let i = 0; i < monthList.length; i += BATCH_SIZE) {
      const batch = monthList.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((dealYmd) => fetchFromMolit(apiKey, lawdCd, dealYmd))
      );
      for (const trades of results) {
        allTrades.push(...trades);
      }
    }

    allTrades.sort((a, b) => {
      const dateA = a.년 * 10000 + a.월 * 100 + a.일;
      const dateB = b.년 * 10000 + b.월 * 100 + b.일;
      return dateB - dateA;
    });

    return NextResponse.json(
      { trades: allTrades, isSample: false },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_REVALIDATE}`,
        },
      }
    );
  } catch (error) {
    console.error('[MOLIT] API 에러:', error);
    const trades = generateSampleTrades(lawdCd);
    return NextResponse.json({ trades, isSample: true });
  }
}

/** 국토교통부 실거래가 API 호출 */
async function fetchFromMolit(
  apiKey: string,
  lawdCd: string,
  dealYmd: string
): Promise<AptTrade[]> {
  // serviceKey는 이미 URL 인코딩된 상태 → 직접 문자열 삽입 (이중 인코딩 방지)
  const baseUrl = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
  const queryString = `serviceKey=${apiKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=9999&pageNo=1`;
  const fullUrl = `${baseUrl}?${queryString}`;

  const res = await fetch(fullUrl, { cache: 'no-store' });
  const xml = await res.text();

  // resultCode 체크 (정상: "000")
  const resultCode = xml.match(/<resultCode>([^<]*)<\/resultCode>/)?.[1]?.trim();
  const resultMsg = xml.match(/<resultMsg>([^<]*)<\/resultMsg>/)?.[1]?.trim();

  if (resultCode && resultCode !== '000') {
    console.error(`[MOLIT] API 에러: code=${resultCode}, msg=${resultMsg}`);
    console.error(`[MOLIT] 응답:`, xml.substring(0, 500));
    return [];
  }

  const trades = parseXmlResponse(xml, lawdCd);

  if (trades.length === 0) {
    console.warn(`[MOLIT] 0건. 응답 미리보기:`, xml.substring(0, 500));
  }

  return trades;
}

/**
 * XML 응답 파싱
 * 기술문서 기준 신규 API 영문 태그명 사용:
 *   aptNm(단지명), dealAmount(거래금액), dealYear(계약년도),
 *   dealMonth(계약월), dealDay(계약일), excluUseAr(전용면적),
 *   floor(층), buildYear(건축년도), umdNm(법정동),
 *   cdealType(해제여부), sggCd(법정동시군구코드)
 */
function parseXmlResponse(xml: string, lawdCd: string): AptTrade[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  return items
    .map((item) => {
      const get = (tag: string) => {
        const match = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        if (!match) return '';
        return match[1]
          .trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      };

      // 해제된 거래 제외
      const cdealType = get('cdealType');
      if (cdealType === 'O') return null;

      const dealAmount = parseInt(get('dealAmount').replace(/,/g, ''));
      if (isNaN(dealAmount) || dealAmount <= 0) return null;

      return {
        아파트: get('aptNm'),
        거래금액: dealAmount,
        년: parseInt(get('dealYear')),
        월: parseInt(get('dealMonth')),
        일: parseInt(get('dealDay')),
        전용면적: parseFloat(get('excluUseAr')),
        층: parseInt(get('floor')),
        건축년도: parseInt(get('buildYear')),
        법정동: get('umdNm'),
        지역코드: get('sggCd') || lawdCd,
        도로명: get('roadNm'),
        지번: get('jibun'),
        거래유형: get('dealingGbn'),
        매도자: get('slerGbn'),
        매수자: get('buyerGbn'),
        중개사소재지: get('estateAgentSggNm'),
        등기일자: get('rgstDate'),
        아파트동: get('aptDong'),
        단지일련번호: get('aptSeq'),
        토지임대부: get('landLeaseholdGbn'),
      } as AptTrade;
    })
    .filter((t): t is AptTrade => t !== null);
}
