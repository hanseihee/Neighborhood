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

/** ㎡ → "84.99㎡ (25평)" */
export function formatArea(sqm: number): string {
  const pyeong = Math.round(sqm / 3.3058);
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
