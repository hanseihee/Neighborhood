import type { AptTrade } from './types';

/** 지역별 샘플 아파트 데이터 */
const SAMPLE_APARTMENTS: Record<string, { name: string; dong: string; road: string; area: number; basePrice: number; buildYear: number }[]> = {
  '11680': [
    { name: '래미안퍼스티지', dong: '도곡동', road: '선릉로', area: 84.99, basePrice: 280000, buildYear: 2009 },
    { name: '대치푸르지오써밋', dong: '대치동', road: '남부순환로', area: 84.96, basePrice: 240000, buildYear: 2018 },
    { name: '개포래미안포레스트', dong: '개포동', road: '개포로', area: 84.98, basePrice: 260000, buildYear: 2021 },
    { name: '디에이치아너힐즈', dong: '개포동', road: '개포로', area: 59.97, basePrice: 200000, buildYear: 2019 },
    { name: '타워팰리스', dong: '도곡동', road: '논현로', area: 130.73, basePrice: 420000, buildYear: 2002 },
    { name: '래미안대치팰리스', dong: '대치동', road: '삼성로', area: 94.51, basePrice: 310000, buildYear: 2015 },
  ],
  '11710': [
    { name: '잠실엘스', dong: '잠실동', road: '올림픽로', area: 84.82, basePrice: 255000, buildYear: 2008 },
    { name: '헬리오시티', dong: '송파동', road: '송파대로', area: 84.98, basePrice: 225000, buildYear: 2018 },
    { name: '파크리오', dong: '잠실동', road: '올림픽로', area: 84.93, basePrice: 235000, buildYear: 2008 },
    { name: '잠실리센츠', dong: '잠실동', road: '잠실로', area: 84.99, basePrice: 245000, buildYear: 2008 },
    { name: '올림픽선수기자촌', dong: '방이동', road: '위례성대로', area: 88.42, basePrice: 220000, buildYear: 1988 },
  ],
  '11440': [
    { name: '마포래미안푸르지오', dong: '아현동', road: '마포대로', area: 84.59, basePrice: 178000, buildYear: 2014 },
    { name: '래미안마포리버웰', dong: '신수동', road: '강변북로', area: 59.92, basePrice: 125000, buildYear: 2023 },
    { name: '마포프레스티지자이', dong: '염리동', road: '마포대로', area: 84.87, basePrice: 165000, buildYear: 2018 },
    { name: '신촌숲아이파크', dong: '북아현동', road: '신촌로', area: 59.99, basePrice: 115000, buildYear: 2020 },
  ],
  '11650': [
    { name: '반포자이', dong: '반포동', road: '신반포로', area: 84.97, basePrice: 350000, buildYear: 2009 },
    { name: '래미안원베일리', dong: '반포동', road: '신반포로', area: 84.98, basePrice: 380000, buildYear: 2023 },
    { name: '아크로리버파크', dong: '반포동', road: '신반포로', area: 84.98, basePrice: 370000, buildYear: 2016 },
    { name: '래미안서초에스티지', dong: '서초동', road: '서초대로', area: 84.94, basePrice: 280000, buildYear: 2023 },
  ],
  '41135': [
    { name: '판교푸르지오그랑블', dong: '백현동', road: '판교역로', area: 84.98, basePrice: 180000, buildYear: 2012 },
    { name: '파크뷰', dong: '정자동', road: '정자일로', area: 84.76, basePrice: 155000, buildYear: 2003 },
    { name: '분당아이파크', dong: '야탑동', road: '야탑로', area: 84.99, basePrice: 120000, buildYear: 2007 },
    { name: '판교더샵퍼스트파크', dong: '삼평동', road: '판교역로', area: 84.97, basePrice: 165000, buildYear: 2016 },
  ],
};

/** 시드 기반 의사 난수 생성기 (결정론적) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 샘플 실거래 데이터 생성 */
export function generateSampleTrades(lawdCd: string): AptTrade[] {
  const apartments = SAMPLE_APARTMENTS[lawdCd];
  if (!apartments) return generateFallbackTrades(lawdCd);

  const random = seededRandom(parseInt(lawdCd));
  const trades: AptTrade[] = [];

  // 최근 24개월
  const months: { y: number; m: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(2026, 1 - i, 1); // 2026년 2월 기준으로 역산
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  // 가격 추세: 24개월간 하락 후 반등 패턴
  const trendMultipliers = months.map((_, i) => {
    const t = i / 23;
    // 초반 하락(-5%) → 중반 바닥 → 후반 반등(+3%)
    return 0.95 + 0.08 * (t * t) - 0.02 * Math.sin(t * Math.PI);
  });

  for (let mi = 0; mi < months.length; mi++) {
    const { y, m } = months[mi];
    const trend = trendMultipliers[mi];

    for (const apt of apartments) {
      const tradeCount = Math.floor(random() * 3) + 2;

      for (let t = 0; t < tradeCount; t++) {
        const priceVariation = 1 + (random() - 0.5) * 0.06;
        const floor = Math.floor(random() * 30) + 2;
        const day = Math.floor(random() * 28) + 1;

        const dealTypes = ['중개거래', '중개거래', '중개거래', '직거래'];
        const parties = ['개인', '개인', '개인', '개인', '법인'];

        trades.push({
          아파트: apt.name,
          거래금액: Math.round(apt.basePrice * trend * priceVariation / 100) * 100,
          년: y,
          월: m,
          일: day,
          전용면적: apt.area,
          층: floor,
          건축년도: apt.buildYear,
          법정동: apt.dong,
          지역코드: lawdCd,
          도로명: apt.road,
          지번: `${Math.floor(random() * 300) + 1}-${Math.floor(random() * 20)}`,
          거래유형: dealTypes[Math.floor(random() * dealTypes.length)],
          매도자: parties[Math.floor(random() * parties.length)],
          매수자: parties[Math.floor(random() * parties.length)],
          중개사소재지: lawdCd.startsWith('11') ? '서울' : '경기',
          등기일자: '',
          아파트동: `${Math.floor(random() * 10) + 100}동`,
          단지일련번호: `${lawdCd}-${Math.floor(random() * 9000) + 1000}`,
          토지임대부: 'N',
        });
      }
    }
  }

  return trades.sort((a, b) => {
    const dateA = a.년 * 10000 + a.월 * 100 + a.일;
    const dateB = b.년 * 10000 + b.월 * 100 + b.일;
    return dateB - dateA;
  });
}

/** 샘플 아파트가 없는 지역의 대체 데이터 */
function generateFallbackTrades(lawdCd: string): AptTrade[] {
  const random = seededRandom(parseInt(lawdCd) + 42);
  const trades: AptTrade[] = [];
  const names = ['한신아파트', '주공아파트', '현대아파트', '삼성래미안', '자이아파트'];
  const dongs = ['중앙동', '신도시동', '역전동'];

  const months: { y: number; m: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(2026, 1 - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  const trendMultipliers = months.map((_, i) => 0.96 + 0.06 * (i / 23));

  for (let mi = 0; mi < months.length; mi++) {
    const { y, m } = months[mi];
    for (let n = 0; n < 3; n++) {
      const tradeCount = Math.floor(random() * 2) + 2;
      const basePrice = 30000 + Math.floor(random() * 40000);
      for (let t = 0; t < tradeCount; t++) {
        trades.push({
          아파트: names[n % names.length],
          거래금액: Math.round(basePrice * trendMultipliers[mi] * (1 + (random() - 0.5) * 0.08) / 100) * 100,
          년: y, 월: m, 일: Math.floor(random() * 28) + 1,
          전용면적: [59.97, 84.99, 114.98][n % 3],
          층: Math.floor(random() * 20) + 2,
          건축년도: 2000 + Math.floor(random() * 20),
          법정동: dongs[n % dongs.length],
          지역코드: lawdCd,
          도로명: '중앙로',
          지번: `${Math.floor(random() * 200) + 1}`,
          거래유형: '중개거래',
          매도자: '개인', 매수자: '개인',
          중개사소재지: '', 등기일자: '', 아파트동: '',
          단지일련번호: '', 토지임대부: 'N',
        });
      }
    }
  }

  return trades.sort((a, b) => {
    const dateA = a.년 * 10000 + a.월 * 100 + a.일;
    const dateB = b.년 * 10000 + b.월 * 100 + b.일;
    return dateB - dateA;
  });
}

/** 샘플 데이터가 있는 지역 코드 목록 */
export const SAMPLE_REGIONS = Object.keys(SAMPLE_APARTMENTS);
