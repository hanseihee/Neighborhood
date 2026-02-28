/**
 * MOLIT API → Supabase 데이터 적재 스크립트
 * Usage: node scripts/seed-trades.mjs [months=36]
 */

const MOLIT_API_KEY = process.env.MOLIT_API_KEY;
const SUPABASE_URL = 'https://boortxqdgrdplxoxrwqo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3J0eHFkZ3JkcGx4b3hyd3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzQ5MjUsImV4cCI6MjA4Nzg1MDkyNX0.ths2Z84IJhFzNKKJboqclmGahc6muOHq5ua6txJ5Z7A';

const MOLIT_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

const DISTRICTS = [
  // 서울 25
  '11110','11140','11170','11200','11215','11230','11260','11290','11305','11320',
  '11350','11380','11410','11440','11470','11500','11530','11545','11560','11590',
  '11620','11650','11680','11710','11740',
  // 경기 38
  '41111','41113','41115','41117','41131','41133','41135','41150','41170','41173',
  '41190','41210','41220','41250','41270','41273','41280','41281','41285','41290',
  '41310','41360','41370','41390','41410','41430','41450','41460','41461','41463',
  '41480','41500','41550','41570','41590','41610','41630','41670',
  // 인천 8
  '28110','28140','28177','28185','28200','28237','28245','28260',
  // 부산 16
  '26110','26140','26170','26200','26230','26260','26290','26320','26350','26380',
  '26410','26440','26470','26500','26530','26710',
  // 대구 8
  '27110','27140','27170','27200','27230','27260','27290','27710',
  // 대전 5
  '30110','30140','30170','30200','30230',
  // 광주 5
  '29110','29140','29155','29170','29200',
  // 울산 5
  '31110','31140','31170','31200','31710',
  // 세종 1
  '36110',
];

const DISTRICT_NAMES = {
  '11110':'종로구','11140':'중구','11170':'용산구','11200':'성동구','11215':'광진구',
  '11230':'동대문구','11260':'중랑구','11290':'성북구','11305':'강북구','11320':'도봉구',
  '11350':'노원구','11380':'은평구','11410':'서대문구','11440':'마포구','11470':'양천구',
  '11500':'강서구','11530':'구로구','11545':'금천구','11560':'영등포구','11590':'동작구',
  '11620':'관악구','11650':'서초구','11680':'강남구','11710':'송파구','11740':'강동구',
  '41111':'수원장안','41113':'수원권선','41115':'수원팔달','41117':'수원영통',
  '41131':'성남수정','41133':'성남중원','41135':'성남분당','41150':'의정부','41170':'안양만안',
  '41173':'안양동안','41190':'부천','41210':'광명','41220':'평택','41250':'동두천',
  '41270':'안산상록','41273':'안산단원','41280':'고양덕양','41281':'고양일산동','41285':'고양일산서',
  '41290':'과천','41310':'구리','41360':'남양주','41370':'오산','41390':'시흥',
  '41410':'군포','41430':'의왕','41450':'하남','41460':'용인처인','41461':'용인기흥',
  '41463':'용인수지','41480':'파주','41500':'이천','41550':'안성','41570':'김포',
  '41590':'화성','41610':'광주','41630':'양주','41670':'포천',
  '28110':'인천중구','28140':'인천동구','28177':'미추홀','28185':'연수','28200':'남동',
  '28237':'부평','28245':'계양','28260':'인천서구',
  '26110':'부산중구','26140':'부산서구','26170':'부산동구','26200':'영도','26230':'부산진',
  '26260':'동래','26290':'부산남구','26320':'부산북구','26350':'해운대','26380':'사하',
  '26410':'금정','26440':'부산강서','26470':'연제','26500':'수영','26530':'사상','26710':'기장',
  '27110':'대구중구','27140':'대구동구','27170':'대구서구','27200':'대구남구','27230':'대구북구',
  '27260':'수성','27290':'달서','27710':'달성',
  '30110':'대전동구','30140':'대전중구','30170':'대전서구','30200':'유성','30230':'대덕',
  '29110':'광주동구','29140':'광주서구','29155':'광주남구','29170':'광주북구','29200':'광산',
  '31110':'울산중구','31140':'울산남구','31170':'울산동구','31200':'울산북구','31710':'울주',
  '36110':'세종',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getMonthList(months) {
  const now = new Date();
  const list = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return list;
}

function parseXml(xml, lawdCd) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  return items
    .map(item => {
      const get = (tag) => {
        const m = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return m ? m[1].trim().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'") : '';
      };
      if (get('cdealType') === 'O') return null;
      const amt = parseInt(get('dealAmount').replace(/,/g, ''));
      if (isNaN(amt) || amt <= 0) return null;
      return {
        apartment_name: get('aptNm'),
        deal_amount: amt,
        deal_year: parseInt(get('dealYear')),
        deal_month: parseInt(get('dealMonth')),
        deal_day: parseInt(get('dealDay')),
        exclusive_area: parseFloat(get('excluUseAr')),
        floor: parseInt(get('floor')) || null,
        build_year: parseInt(get('buildYear')) || null,
        district_code: get('sggCd') || lawdCd,
        dong_name: get('umdNm') || null,
        road_name: get('roadNm') || null,
        jibun: get('jibun') || null,
        deal_type: get('dealingGbn') || null,
        seller_type: get('slerGbn') || null,
        buyer_type: get('buyerGbn') || null,
        agent_location: get('estateAgentSggNm') || null,
        reg_date: get('rgstDate') || null,
        apt_dong: get('aptDong') || null,
        apt_seq: get('aptSeq') || null,
        land_leasehold: get('landLeaseholdGbn') || null,
      };
    })
    .filter(Boolean);
}

async function fetchMolit(lawdCd, dealYmd, retries = 3) {
  const url = `${MOLIT_BASE}?serviceKey=${MOLIT_API_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=9999&pageNo=1`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const code = xml.match(/<resultCode>([^<]*)<\/resultCode>/)?.[1]?.trim();
      if (code && code !== '000') {
        console.error(`  MOLIT error ${code} for ${lawdCd}/${dealYmd}`);
        return [];
      }
      return parseXml(xml, lawdCd);
    } catch (e) {
      if (attempt < retries) { await sleep(2000 * attempt); continue; }
      console.error(`  Fetch failed ${lawdCd}/${dealYmd}: ${e.message}`);
      return [];
    }
  }
  return [];
}

async function upsertToSupabase(rows) {
  if (!rows.length) return 0;
  // 500건씩 배치
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/apt_trades?on_conflict=apartment_name,deal_year,deal_month,deal_day,exclusive_area,floor,district_code`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  Supabase error: ${res.status} ${err.substring(0, 200)}`);
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

async function main() {
  if (!MOLIT_API_KEY) {
    console.error('MOLIT_API_KEY 환경변수를 설정하세요');
    process.exit(1);
  }

  const months = parseInt(process.argv[2] || '36');
  const monthList = getMonthList(months);
  console.log(`\n=== 데이터 적재 시작 ===`);
  console.log(`기간: ${monthList[monthList.length-1]} ~ ${monthList[0]} (${months}개월)`);
  console.log(`지역: ${DISTRICTS.length}개 시군구`);
  console.log(`총 API 호출: ${DISTRICTS.length * months}건\n`);

  let totalRows = 0;
  let totalDistricts = 0;
  const startTime = Date.now();

  for (let di = 0; di < DISTRICTS.length; di++) {
    const code = DISTRICTS[di];
    const name = DISTRICT_NAMES[code] || code;
    const distStart = Date.now();
    let distRows = 0;

    // 6개월씩 배치 병렬 호출
    for (let mi = 0; mi < monthList.length; mi += 6) {
      const batch = monthList.slice(mi, mi + 6);
      const results = await Promise.all(batch.map(ym => fetchMolit(code, ym)));
      const allTrades = results.flat();
      if (allTrades.length > 0) {
        const inserted = await upsertToSupabase(allTrades);
        distRows += inserted;
      }
      // API rate limit 방지
      await sleep(200);
    }

    totalRows += distRows;
    totalDistricts++;
    const elapsed = ((Date.now() - distStart) / 1000).toFixed(1);
    const progress = ((di + 1) / DISTRICTS.length * 100).toFixed(1);
    console.log(`[${progress}%] ${name}(${code}): ${distRows.toLocaleString()}건 (${elapsed}s) | 누적: ${totalRows.toLocaleString()}건`);
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== 완료 ===`);
  console.log(`총 ${totalDistricts}개 지역, ${totalRows.toLocaleString()}건, ${totalTime}분 소요`);
}

main().catch(console.error);
