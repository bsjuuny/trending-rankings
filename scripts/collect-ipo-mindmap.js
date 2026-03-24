/**
 * collect-ipo-mindmap.js
 * 클리앙 주식한당 + 디씨인사이드 주식갤러리 게시글 제목에서 IPO/주식 키워드 추출
 * → public/data/mindmap_ipo.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getClienStockTitles() {
  try {
    const res = await fetch('https://www.clien.net/service/board/cm_stock', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const titles = [];
    $('.list_subject').each((i, el) => {
      const raw = $(el).text().trim();
      // 탭/줄바꿈 이후 실제 제목 추출
      const lines = raw.split(/[\n\t]+/).map(l => l.trim()).filter(Boolean);
      const title = lines[lines.length - 1];
      if (title && title.length >= 4) titles.push(title);
    });

    console.log(`[ipo] 클리앙 주식 제목: ${titles.length}개`);
    return titles;
  } catch (e) {
    console.warn(`[ipo] 클리앙 실패: ${e.message}`);
    return [];
  }
}

async function getDCInsideStockTitles() {
  try {
    const res = await fetch('https://gall.dcinside.com/board/lists/?id=stock_new1', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const titles = [];
    $('.gall_tit a:not(.reply_num)').each((i, el) => {
      const text = $(el).text().trim();
      // 공지/광고 등 짧거나 비의미 제목 제외
      if (text.length >= 4 && text.length <= 60 && /[가-힣]/.test(text)) {
        titles.push(text);
      }
    });

    console.log(`[ipo] DC인사이드 주식 제목: ${titles.length}개`);
    return titles;
  } catch (e) {
    console.warn(`[ipo] DC인사이드 실패: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('[collect-ipo-mindmap] 시작...');

  const [clienTitles, dcTitles] = await Promise.all([
    getClienStockTitles(),
    getDCInsideStockTitles(),
  ]);

  const allTitles = [...clienTitles, ...dcTitles];

  if (allTitles.length === 0) {
    console.warn('[ipo] 수집된 제목 없음');
  }

  // KoreanNLP 형태소 분석으로 명사 빈도 추출
  const wordCounts = KoreanNLP.getFrequencies(allTitles);

  const sorted = Object.entries(wordCounts)
    .filter(([, v]) => v > 1)
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
