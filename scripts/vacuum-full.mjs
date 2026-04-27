/**
 * VACUUM FULL 실행 스크립트
 *
 * 사용법:
 *   1) Supabase Dashboard → Project Settings → Database → Connection string
 *      "Session" 모드 또는 "Direct connection" 의 URI를 복사
 *      (Transaction 모드(6543)는 VACUUM 지원 X — 반드시 5432 포트)
 *   2) .env.local 에 추가:
 *      DATABASE_URL=postgresql://postgres:비밀번호@host:5432/postgres
 *   3) 실행:
 *      node --env-file=.env.local scripts/vacuum-full.mjs
 *
 * 주의: VACUUM FULL 은 ACCESS EXCLUSIVE 락이라 작업 동안 해당 테이블이
 *       잠시 응답 대기 상태가 됩니다. apt_trades(177MB) 약 30~90초 예상.
 */
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL 환경변수가 필요합니다. .env.local 에 설정하세요.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const TABLES = [
  'apt_trades',
  'apt_rents',
  'apartment_search',
  'rent_apartment_search',
];

async function pretty(name) {
  const r = await client.query(
    `SELECT pg_size_pretty(pg_total_relation_size($1::regclass)) AS s`,
    [`public.${name}`],
  );
  return r.rows[0].s;
}

async function dbSize() {
  const r = await client.query(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS s`,
  );
  return r.rows[0].s;
}

console.log('연결 중...');
await client.connect();
console.log(`연결 완료. DB size: ${await dbSize()}\n`);

for (const t of TABLES) {
  const before = await pretty(t);
  process.stdout.write(`VACUUM (FULL, ANALYZE) ${t}  (before: ${before}) ... `);
  const start = Date.now();
  try {
    await client.query(`VACUUM (FULL, ANALYZE) public.${t}`);
    const after = await pretty(t);
    const sec = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ ${sec}s  (after: ${after})`);
  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}

console.log(`\n최종 DB size: ${await dbSize()}`);
await client.end();
