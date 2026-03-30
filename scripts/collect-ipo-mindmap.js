const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function get38IPODiscussion() {
  const sources = [
    'http://www.38.co.kr/html/fund/index.htm?o=k', // 공모주 일정/진행
    'http://www.38.co.kr/html/board/board.htm?code=ipo', // IPO 게시판
  ];
  
  const headlines = [];
  for (const url of sources) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const html = new TextDecoder('euc-kr').decode(buf);
      const $ = cheerio.load(html);

      // 게시판 제목 또는 리스트 텍스트 추출
      $('a[href*="no="], .list_ranking li a').each((i, el) => {
        headlines.push($(el).text().trim());
      });
    } catch (e) {
      console.warn(`[ipo] 38.co.kr ${url} 실패:`, e.message);
    }
  }
  return headlines;
}

async function getNaverIPONews() {
  try {
    const res = await fetch('https://finance.naver.com/news/mainnews.naver', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const headlines = [];
    $('.articleSubject a, .news_tit').each((i, el) => {
      const text = $(el).text().trim();
      // IPO 관련 뉴스만 필터링
      if (text.includes('IPO') || text.includes('공모') || text.includes('청약') || text.includes('상장')) {
        headlines.push(text);
      }
    });
    return headlines;
  } catch (e) { return []; }
}

async function getHankyungIPONews() {
  try {
    const res = await fetch('https://www.hankyung.com/tag/공모주', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const headlines = [];
    $('h2 a').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 4 && text.length <= 50 && /[가-힣]/.test(text)) headlines.push(text);
    });
    console.log(`[ipo] 한국경제 공모주: ${headlines.length}개`);
    return headlines;
  } catch (e) {
    console.warn('[ipo] 한국경제 실패:', e.message);
    return [];
  }
}

async function getDaumIPONews() {
  try {
    const res = await fetch('https://search.daum.net/search?w=news&q=공모주&DA=PGD&spacing=0', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const headlines = [];
    $('strong').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 6 && text.length <= 60 && /공모|청약|상장|IPO/.test(text)) headlines.push(text);
    });
    console.log(`[ipo] 다음뉴스 공모주: ${headlines.length}개`);
    return headlines;
  } catch (e) {
    console.warn('[ipo] 다음뉴스 실패:', e.message);
    return [];
  }
}


async function getNaverIPOCalendar() {
  try {
    const res = await fetch('https://finance.naver.com/ipo/IPOList.naver', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);
    const headlines = [];
    $('.type_1 td a, .ipo_list td a').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 2 && text.length <= 30 && /[가-힣]/.test(text)) headlines.push(text);
    });
    console.log(`[ipo] 네이버 공모주 캘린더: ${headlines.length}개`);
    return headlines;
  } catch (e) {
    console.warn('[ipo] 네이버 공모주 캘린더 실패:', e.message);
    return [];
  }
}

async function main() {
  console.log('[collect-ipo-mindmap] 시작...');

  const [disc38, newsNaver, hankyung, daumNews, naverCalendar] = await Promise.all([
    get38IPODiscussion(),
    getNaverIPONews(),
    getHankyungIPONews(),
    getDaumIPONews(),
    getNaverIPOCalendar(),
  ]);

  const allHeadlines = [...disc38, ...newsNaver, ...hankyung, ...daumNews, ...naverCalendar];
  
  // 형태소 분석을 통한 명사 빈도수 추출
  const freqMap = KoreanNLP.getFrequencies(allHeadlines);

  // 불용어 필터링 (주관적인 IPO 관련 핵심 키워드는 남김)
  const STOPWORDS = new Set(['오늘', '내일', '진행', '확인', '정보', '관련', '내역', '결과', '발표', '안내', '방법', '이후', '검색', '순위', '전망', '분석', '기대', '급등', '하락', '예상', '최근', '추가', '신규', '모습', '상승', '하락']);
  
  const sorted = Object.entries(freqMap)
    .filter(([text, v]) => {
      if (text.length < 2) return false;
      if (STOPWORDS.has(text)) return false;
      return v >= 2; // 최소 2번 이상 언급
    })
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
