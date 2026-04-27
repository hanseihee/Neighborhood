-- =============================================
-- 24개월(2년) 이전 매매 데이터 정리
-- 기준일: 2026-04-27 → 보존 범위: 2024-05 이후
-- 삭제 대상: 2023 전체 + 2024-01~04
-- 예상 삭제: 약 30만 건 (전체 92만 중 33%)
-- =============================================

-- 1) 오래된 매매 데이터 삭제
DELETE FROM apt_trades
WHERE deal_year < 2024
   OR (deal_year = 2024 AND deal_month < 5);

-- 2) Materialized View 재계산 (apt_trades 의존 3개)
REFRESH MATERIALIZED VIEW apartment_search;
REFRESH MATERIALIZED VIEW district_monthly_summary;
REFRESH MATERIALIZED VIEW metro_monthly_summary;

-- 3) 결과 확인
SELECT
  COUNT(*)                                  AS total_rows,
  MIN(deal_year * 100 + deal_month)         AS oldest_ym,
  MAX(deal_year * 100 + deal_month)         AS latest_ym,
  pg_size_pretty(pg_total_relation_size('public.apt_trades'::regclass)) AS table_total_size
FROM apt_trades;
