-- =============================================
-- DB 용량 진단 RPC 함수
-- Supabase Dashboard > SQL Editor 에서 한 번만 실행하세요.
-- 실행 후 service_role 키로 RPC 호출이 가능해집니다.
-- =============================================

CREATE OR REPLACE FUNCTION public.diag_db_size()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN jsonb_build_object(
    'database_size',       pg_size_pretty(pg_database_size(current_database())),
    'database_size_bytes', pg_database_size(current_database()),
    'tables', (
      SELECT COALESCE(jsonb_agg(t ORDER BY t.bytes DESC), '[]'::jsonb)
      FROM (
        SELECT
          c.relname                                                       AS name,
          CASE c.relkind WHEN 'r' THEN 'table' WHEN 'm' THEN 'matview' END AS kind,
          pg_size_pretty(pg_total_relation_size(c.oid))                   AS total_size,
          pg_size_pretty(pg_relation_size(c.oid))                         AS body_size,
          pg_size_pretty(pg_indexes_size(c.oid))                          AS indexes_size,
          pg_total_relation_size(c.oid)                                   AS bytes,
          c.reltuples::bigint                                             AS estimated_rows
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'm')
      ) t
    ),
    'indexes', (
      SELECT COALESCE(jsonb_agg(i ORDER BY i.bytes DESC), '[]'::jsonb)
      FROM (
        SELECT
          ic.relname                                AS index_name,
          tc.relname                                AS table_name,
          pg_size_pretty(pg_relation_size(ic.oid))  AS size,
          pg_relation_size(ic.oid)                  AS bytes
        FROM pg_class ic
        JOIN pg_index x  ON ic.oid = x.indexrelid
        JOIN pg_class tc ON x.indrelid = tc.oid
        JOIN pg_namespace n ON n.oid = ic.relnamespace
        WHERE n.nspname = 'public'
      ) i
    ),
    'apt_trades_year_distribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('year', deal_year, 'count', cnt) ORDER BY deal_year), '[]'::jsonb)
      FROM (
        SELECT deal_year, COUNT(*)::bigint AS cnt
        FROM apt_trades
        GROUP BY deal_year
      ) y
    ),
    'apt_rents_year_distribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('year', deal_year, 'count', cnt) ORDER BY deal_year), '[]'::jsonb)
      FROM (
        SELECT deal_year, COUNT(*)::bigint AS cnt
        FROM apt_rents
        GROUP BY deal_year
      ) y
    )
  );
END;
$$;

-- service_role + anon 모두 호출 가능 (anon이 부담스러우면 이 GRANT만 빼세요)
GRANT EXECUTE ON FUNCTION public.diag_db_size() TO anon, authenticated, service_role;
