-- =============================================
-- 용량 정리 1순위 (Supabase SQL Editor 호환 버전)
--
-- 주의: Supabase SQL Editor 는 모든 문장을 트랜잭션으로 감싸기 때문에
--       VACUUM 계열은 여기서 실행할 수 없습니다.
--       아래 두 단계만 SQL Editor 에서 실행하세요.
-- =============================================

-- 1) 사용되지 않는 trigram 인덱스 삭제 (-26 MB 즉시)
DROP INDEX IF EXISTS public.idx_apt_name_trgm;

-- 2) dead tuple 현황 확인 → VACUUM FULL 필요성 판단
SELECT
  relname                                                             AS table_name,
  n_live_tup                                                          AS live_rows,
  n_dead_tup                                                          AS dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1)   AS dead_pct,
  pg_size_pretty(pg_total_relation_size(('public.' || relname)::regclass)) AS total_size,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC NULLS LAST;
