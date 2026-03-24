/**
 * collect-ipo-mindmap.js
 * 클리앙 주식한당 + 도그드립 게시글 제목에서 IPO/주식 키워드 추출
 * → public/data/mindmap_ipo.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function get38IPOListing() {
  try {
    const res = await fetch('http://www.38.co.kr/html/fund/index.htm?o=k', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const names = [];
    // 38.co.kr IPO 예정 주식 테이블에서 종목명 추출
    $('a[href^="view.htm?no="]').each((i, el) => {
      const name = $(el).text().trim();
      if (name && name.length >= 2) names.push(name);
    });

    console.log(`[ipo] 38.co.kr IPO 종목: ${names.length}개`);
    return names;
  } catch (e) {
    console.warn(`[ipo] 38.co.kr 실패: ${e.message}`);
    return [];
  }
}

async function getNaverIPOListing() {
  try {
    const res = await fetch('https://finance.naver.com/sise/ipo.naver', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const names = [];
    $('a[href^="/item/main.naver?code="]').each((i, el) => {
      const name = $(el).text().trim();
      if (name && name.length >= 2) names.push(name);
    });

    console.log(`[ipo] 네이버 IPO 종목: ${names.length}개`);
    return names;
  } catch (e) {
    console.warn(`[ipo] 네이버 IPO 실패: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('[collect-ipo-mindmap] 시작...');

  const [list38, listNaver] = await Promise.all([
    get38IPOListing(),
    getNaverIPOListing(),
  ]);

  const allKeywords = [...list38, ...listNaver];

  if (allKeywords.length === 0) {
    console.warn('[ipo] 수집된 제목 없음');
  }

  // 빈도수 집계
  const freq = {};
  allKeywords.forEach(k => {
    // IPO 종목명은 KoreanNLP 보다는 직접 카운팅이 정확할 수 있음 (고유명사 보호)
    freq[k] = (freq[k] || 0) + 1;
  });

  // 추가로 "공모주", "청약", "신규" 같은 핵심 키워드 가중치 부여 또는 삽입 가능
  // 여기서는 수집된 리스트 자체가 IPO이므로 가중치만 조정

  const sorted = Object.entries(freq)
    .filter(([, v]) => v >= 1) // IPO는 데이터가 적을 수 있으므로 1회 이상 허용
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([text, value]) => ({ text, value }));

  const outDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mindmap_ipo.json'), JSON.stringify(sorted, null, 2), 'utf8');

  console.log(`[collect-ipo-mindmap] 완료: ${sorted.length}개 키워드 저장`);
}

main().catch(e => {
  console.error('[collect-ipo-mindmap] 오류:', e.message);
  process.exit(1);
});
