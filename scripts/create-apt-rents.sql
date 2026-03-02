-- =============================================
-- apt_rents 테이블 + 인덱스
-- =============================================
CREATE TABLE apt_rents (
  id             BIGSERIAL PRIMARY KEY,
  apartment_name TEXT NOT NULL,
  deposit        INTEGER NOT NULL,          -- 보증금(만원)
  monthly_rent   INTEGER NOT NULL DEFAULT 0, -- 월세(만원), 0이면 전세
  deal_year      INTEGER NOT NULL,
  deal_month     INTEGER NOT NULL,
  deal_day       INTEGER NOT NULL,
  exclusive_area DOUBLE PRECISION NOT NULL,
  floor          INTEGER,
  build_year     INTEGER,
  district_code  TEXT NOT NULL,
  dong_name      TEXT,
  jibun          TEXT,
  contract_term  TEXT,                      -- 계약기간
  contract_type  TEXT,                      -- 신규/갱신
  use_rr_right   TEXT,                      -- 갱신요구권사용
  pre_deposit    INTEGER,                   -- 종전 보증금
  pre_monthly_rent INTEGER,                 -- 종전 월세
  UNIQUE(apartment_name, deal_year, deal_month, deal_day, exclusive_area, floor, district_code, deposit)
);

CREATE INDEX idx_rents_district_date ON apt_rents(district_code, deal_year, deal_month);

-- RLS 활성화 (anon 읽기 전용)
ALTER TABLE apt_rents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apt_rents_read" ON apt_rents FOR SELECT TO anon USING (true);

-- =============================================
-- Materialized Views (매매 패턴 동일)
-- =============================================

-- 1) 시도별 월별 전세 보증금 집계
CREATE MATERIALIZED VIEW rent_metro_monthly_summary AS
SELECT
  LEFT(district_code, 2) AS metro_code,
  deal_year,
  deal_month,
  ROUND(AVG(deposit))::INTEGER AS avg_deposit,
  MAX(deposit)                  AS max_deposit,
  MIN(deposit)                  AS min_deposit,
  COUNT(*)::INTEGER             AS trade_count
FROM apt_rents
WHERE monthly_rent = 0  -- 전세만
GROUP BY LEFT(district_code, 2), deal_year, deal_month;

CREATE UNIQUE INDEX ON rent_metro_monthly_summary(metro_code, deal_year, deal_month);

-- 2) 시군구별 월별 전세 보증금 집계
CREATE MATERIALIZED VIEW rent_district_monthly_summary AS
SELECT
  district_code,
  deal_year,
  deal_month,
  ROUND(AVG(deposit))::INTEGER AS avg_deposit,
  MAX(deposit)                  AS max_deposit,
  MIN(deposit)                  AS min_deposit,
  COUNT(*)::INTEGER             AS trade_count
FROM apt_rents
WHERE monthly_rent = 0  -- 전세만
GROUP BY district_code, deal_year, deal_month;

CREATE UNIQUE INDEX ON rent_district_monthly_summary(district_code, deal_year, deal_month);

-- 3) 전세 아파트 검색용 (평형대별 그룹핑)
CREATE MATERIALIZED VIEW rent_apartment_search AS
WITH area_classified AS (
  SELECT *,
    FLOOR(ROUND(exclusive_area * 1.3 / 3.3058) / 10)::integer * 10 AS area_group
  FROM apt_rents
  WHERE monthly_rent = 0
)
SELECT
  apartment_name,
  district_code,
  MIN(dong_name) AS dong_name,
  MAX(deposit) FILTER (
    WHERE deal_year * 100 + deal_month = (
      SELECT MAX(r2.deal_year * 100 + r2.deal_month) FROM apt_rents r2
      WHERE r2.apartment_name = area_classified.apartment_name
        AND r2.district_code  = area_classified.district_code
        AND r2.monthly_rent   = 0
        AND FLOOR(ROUND(r2.exclusive_area * 1.3 / 3.3058) / 10)::integer * 10 = area_classified.area_group
    )
  ) AS recent_deposit,
  COUNT(*)::INTEGER AS jeonse_count,
  MODE() WITHIN GROUP (ORDER BY ROUND(exclusive_area::numeric, 0)) AS avg_area,
  MIN(build_year) AS build_year,
  area_group
FROM area_classified
GROUP BY apartment_name, district_code, area_group;

CREATE UNIQUE INDEX ON rent_apartment_search(apartment_name, district_code, area_group);

-- =============================================
-- Materialized View 새로고침 함수
-- =============================================
CREATE OR REPLACE FUNCTION refresh_rent_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW rent_metro_monthly_summary;
  REFRESH MATERIALIZED VIEW rent_district_monthly_summary;
  REFRESH MATERIALIZED VIEW rent_apartment_search;
END;
$$;

-- anon 역할에서 호출 가능하도록 권한 부여
GRANT EXECUTE ON FUNCTION refresh_rent_views() TO anon;
