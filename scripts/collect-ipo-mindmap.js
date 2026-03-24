/**
 * collect-ipo-mindmap.js
 * ipo-master 로컬 데이터 + 38커뮤니케이션에서 IPO 키워드 추출
 * → public/data/mindmap_ipo.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const IPO_MASTER_PATH = 'C:/github/ipo-master/public/data/ipo_list.json';

function getIpoMasterKeywords() {
  try {
    if (!fs.existsSync(IPO_MASTER_PATH)) {
      console.warn('[ipo] ipo_list.json 없음 — 건너뜀');
      return [];
    }

    const raw = JSON.parse(fs.readFileSync(IPO_MASTER_PATH, 'utf8'));
    const ipos = Array.isArray(raw) ? raw : (raw.ipos ?? raw.data ?? []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const keywords = [];

    ipos.forEach(ipo => {
      if (!ipo.name) return;

      // 청약 중 가중치 5, 청약 예정(30일 이내) 가중치 3, 마감 후 30일 이내 가중치 1
      const start = ipo.subscriptionStart ? new Date(ipo.subscriptionStart.replace(/\./g, '-')) : null;
      const end = ipo.subscriptionEnd ? new Date(ipo.subscriptionEnd.replace(/\./g, '-')) : null;

      let weight = 0;
      if (start && end && start <= today && end >= today) {
        weight = 5; // 청약 중
      } else if (start && start > today && (start - today) / 86400000 <= 30) {
        weight = 3; // 30일 내 예정
      } else if (end && end < today && (today - end) / 86400000 <= 30) {
        weight = 1; // 최근 마감
      }

      if (weight > 0) {
        keywords.push({ text: ipo.name, weight });
        // 섹터/업종도 추가
        if (ipo.sector) keywords.push({ text: ipo.sector, weight: 1 });
      }
    });

    console.log(`[ipo] ipo-master 키워드: ${keywords.length}개`);
    return keywords;
  } catch (e) {
    console.warn(`[ipo] ipo-master 로드 실패: ${e.message}`);
    return [];
  }
}

async function getIpoStockKeywords() {
  try {
    // ipostock.co.kr 공모주 일정
    const res = await fetch('https://ipostock.co.kr/sub03/ipo02.asp', {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://ipostock.co.kr/' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buf);
    const $ = cheerio.load(html);

    const keywords = [];
    $('table td a').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length >= 2 && text.length <= 15 && !/^\d+$/.test(text)) {
        keywords.push({ text, weight: 2 });
      }
    });

    console.log(`[ipo] ipostock 키워드: ${keywords.length}개`);
    return keywords;
  } catch (e) {
    console.warn(`[ipo] ipostock 실패: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('[collect-ipo-mindmap] 시작...');

  const [ipoMaster, comm38, naverIpo] = await Promise.all([
    Promise.resolve(getIpoMasterKeywords()),
    getIpoStockKeywords(),
    Promise.resolve([]),
  ]);

  const freq = {};
  [...ipoMaster, ...comm38, ...naverIpo].forEach(({ text, weight }) => {
    freq[text] = (freq[text] || 0) + weight;
  });

  const sorted = Object.entries(freq)
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
