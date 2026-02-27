/** 만원 단위 → "3.2억" / "8,500만" 형태 */
export function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return eok % 1 === 0 ? `${eok}억` : `${eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

/** 만원 단위 → "3.2억" 형태 (항상 억 단위) */
export function formatPriceShort(manwon: number): string {
  if (manwon >= 10000) {
    return `${(manwon / 10000).toFixed(1)}억`;
  }
  return `${manwon.toLocaleString()}만`;
}

/** 전용면적(㎡) → 공급면적 기준 평수 (네이버 부동산과 동일한 분류) */
export function toSupplyPyeong(exclusiveSqm: number): number {
  return Math.round((exclusiveSqm * 1.3) / 3.3058);
}

/** ㎡ → "84.99㎡ (33평)" - 공급면적 기준 평수 표시 */
export function formatArea(sqm: number): string {
  const pyeong = toSupplyPyeong(sqm);
  return `${sqm}㎡(${pyeong}평)`;
}

/** 날짜 포맷 */
export function formatDate(y: number, m: number, d: number): string {
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

/** "202602" → "26.02" */
export function getMonthLabel(yyyymm: string): string {
  return `${yyyymm.slice(2, 4)}.${yyyymm.slice(4)}`;
}

/** 변동률 부호 포함 문자열 */
export function formatChangeRate(rate: number | null): string {
  if (rate === null) return '-';
  if (rate > 0) return `+${rate}%`;
  return `${rate}%`;
}
