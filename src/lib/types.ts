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

/** 아파트 전월세 실거래 데이터 */
export interface AptRent {
  아파트: string;
  보증금: number;        // 만원
  월세: number;          // 만원 (0이면 전세)
  년: number;
  월: number;
  일: number;
  전용면적: number;
  층: number;
  건축년도: number;
  법정동: string;
  지역코드: string;
  지번: string;
  계약기간: string;
  계약구분: string;      // 신규/갱신
  갱신요구권사용: string;
  종전보증금: number | null;
  종전월세: number | null;
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

/** 아파트 검색 결과 */
export interface SearchResult {
  apartmentName: string;
  districtCode: string;
  districtName: string;
  dongName: string;
  recentPrice: number;
  tradeCount: number;
}

/** 시도별 집계 응답 */
export interface MetroStatsResponse {
  stats: MonthlyStats[];
  totalCount: number;
  latestAvgPrice: number;
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
