/** 아파트 매매 실거래 데이터 (기술문서 전체 필드) */
export interface AptTrade {
  아파트: string;
  거래금액: number;        // 만원
  년: number;
  월: number;
  일: number;
  전용면적: number;        // ㎡
  층: number;
  건축년도: number;
  법정동: string;
  지역코드: string;
  // 추가 상세 필드
  도로명: string;
  지번: string;
  거래유형: string;        // 중개거래, 직거래
  매도자: string;          // 개인, 법인, 공공기관, 기타
  매수자: string;          // 개인, 법인, 공공기관, 기타
  중개사소재지: string;
  등기일자: string;
  아파트동: string;
  단지일련번호: string;
  토지임대부: string;      // Y, N
}

/** 월별 통계 */
export interface MonthlyStats {
  month: string;           // YYYYMM
  avgPrice: number;        // 만원
  maxPrice: number;
  minPrice: number;
  count: number;
  changeRate: number | null; // 전월 대비 %
}

/** 시/군/구 옵션 */
export interface DistrictOption {
  code: string;
  name: string;
}

/** 시/도 그룹 */
export interface RegionGroup {
  code: string;
  name: string;
  districts: DistrictOption[];
}
