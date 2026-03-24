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
  const sources = [
    'http://www.38.co.kr/html/fund/index.htm?o=k',
    'http://www.38.co.kr/html/fund/index.htm?o=v',
    'http://www.38.co.kr/html/ipo/ipo.htm?key=2', // 청구
    'http://www.38.co.kr/html/ipo/ipo.htm?key=1'  // 승인
  ];
  
  const allNames = [];
  for (const url of sources) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const html = new TextDecoder('euc-kr').decode(buf);
      const $ = cheerio.load(html);

      // 38.co.kr 에서는 종목명이 보통 a 태그 내에 텍스트로 존재함
      // "번호" 파라미터가 포함된 상세 링크들을 타겟팅
      $('a[href*="no="]').each((i, el) => {
        let name = $(el).text().trim();
        // 날짜 등이 앞에 붙어 있는 경우 제거 (예: "03/23 니어스랩")
        name = name.replace(/^\d{2}\/\d{2}\s+/, '');
        // 괄호 포함된 메모 제거 (예: "종목명(유가)")
        name = name.split('(')[0].trim();
        
        if (name && name.length >= 2 && name.length <= 15 && !name.includes('상세') && !name.includes('보기')) {
          allNames.push(name);
        }
      });
    } catch (e) {
      console.warn(`[ipo] 38.co.kr ${url} 실패:`, e.message);
    }
  }
  console.log(`[ipo] 38.co.kr 합계 종목: ${allNames.length}개`);
  return allNames;
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
    // 네이버 IPO 페이지의 종목명 링크 패턴
    $('a[href*="/item/main.naver?code="], a[href*="/ipo/A"]').each((i, el) => {
      const name = $(el).text().trim();
      if (name && name.length >= 2 && name.length <= 15) names.push(name);
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
    .filter(([, v]) => v >= 3) // 3회 이상 언급된 핵심 IPO 종목만 추출
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
