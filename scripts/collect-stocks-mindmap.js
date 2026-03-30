/**
 * collect-stocks-mindmap.js
 * 네이버 증권 인기검색어 + 뉴스 헤드라인에서 주식 키워드 추출
 * → public/data/mindmap_stocks.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const puppeteer = require('puppeteer');

// 제외할 일반 단어 (주식과 무관한 불용어 또는 ETF 관련 검색어)
const STOPWORDS = new Set([
  '관련', '이후', '주가', '시장', '투자', '매수', '매도', '상승', '하락',
  '전망', '분석', '결과', '발표', '예상', '오늘', '내일', '최근', '국내',
  '해외', '글로벌', '코스피', '코스닥', '증권', '주식', '펀드', 'ETF',
  '금리', '환율', '달러', '유가', '금', '원자재', '채권', '경제',
  '레버리지', '인버스', 'KODEX', 'TIGER', 'ACE', 'KBSTAR', 'SOL', '선물', 'ETN', '2X'
]);

async function getNaverStockSearchRanking() {
  try {
    const res = await fetch('https://finance.naver.com/', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const keywords = [];
    // 인기검색어 영역 (.aside_popular 클래스 내의 종목명)
    $('.aside_popular .tbl_home tr th a, .search_rank_list li a, .rnk_list li a').each((i, el) => {
      const text = $(el).text().trim().replace(/\d+\s*/, '');
      if (text && text.length >= 2 && text.length <= 10 && !STOPWORDS.has(text)) {
        keywords.push(text);
      }
    });

    console.log(`[stocks] 네이버 인기검색어: ${keywords.length}개`);
    return keywords;
  } catch (e) {
    console.warn(`[stocks] 네이버 인기검색어 실패: ${e.message}`);
    return [];
  }
}

async function getNaverFinanceNews() {
  try {
    const res = await fetch('https://finance.naver.com/news/mainnews.naver', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const headlines = [];
    $('.articleSubject a, .news_tit, .tltle a').each((i, el) => {
      headlines.push($(el).text().trim());
    });

    const freqMap = KoreanNLP.getFrequencies(headlines);
    const keywords = Object.keys(freqMap);

    console.log(`[stocks] 네이버 뉴스 키워드: ${keywords.length}개`);
    return keywords;
  } catch (e) {
    console.warn(`[stocks] 네이버 뉴스 실패: ${e.message}`);
    return [];
  }
}

async function getNaverStockRanking() {
  try {
    const res = await fetch('https://finance.naver.com/sise/sise_quant.naver', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const $ = cheerio.load(html);

    const keywords = [];
    $('.type_2 td a').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length >= 2 && keywords.length < 20) {
        keywords.push(text);
      }
    });

    console.log(`[stocks] 거래량 상위: ${keywords.length}개`);
    return keywords;
  } catch (e) {
    console.warn(`[stocks] 거래량 상위 실패: ${e.message}`);
    return [];
  }
}

async function getDaumFinanceNews() {
  try {
    console.log('[stocks] 다음 증권 뉴스 시도 (Puppeteer)...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto('https://finance.daum.net/news', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const headlines = [];
    $('a.link_txt, .tit_news a, .item_issue a, .list_news li a').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) headlines.push(text);
    });
    const freqMap = KoreanNLP.getFrequencies(headlines);
    console.log(`[stocks] 다음 증권 뉴스: ${Object.keys(freqMap).length}개`);
    return Object.keys(freqMap);
  } catch (e) {
    console.warn(`[stocks] 다음 증권 뉴스 실패: ${e.message}`);
    return [];
  }
}

async function getHankyungFinanceNews() {
  try {
    // URL 수정: economy 섹션으로 변경 (기존 /finance는 404)
    const res = await fetch('https://www.hankyung.com/economy', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const headlines = [];
    $('h3.news-tit a, .tit a, h2 a, .txt_wrap a').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) headlines.push(text);
    });
    const freqMap = KoreanNLP.getFrequencies(headlines);
    console.log(`[stocks] 한국경제 뉴스: ${Object.keys(freqMap).length}개`);
    return Object.keys(freqMap);
  } catch (e) {
    console.warn(`[stocks] 한국경제 뉴스 실패: ${e.message}`);
    return [];
  }
}

async function getMoneyTodayNews() {
  try {
    console.log('[stocks] 머니투데이 뉴스 시도 (Puppeteer)...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto('https://www.mt.co.kr/stock/stocknews', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    const headlines = [];
    
    // 폭넓은 셀렉터로 헤드라인 수집
    $('.tit a, .subject a, .news_list a, h1 a, h2 a, h3 a, .list_news a').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) {
        headlines.push(text);
      }
    });

    const freqMap = KoreanNLP.getFrequencies(headlines);
    console.log(`[stocks] 머니투데이 뉴스: ${Object.keys(freqMap).length}개`);
    return Object.keys(freqMap);
  } catch (e) {
    console.warn(`[stocks] 머니투데이 뉴스 실패: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('[collect-stocks-mindmap] 시작...');

  const [searchRanking, newsKeywords, volumeRanking, daumNews, hankyungNews, mtNews] = await Promise.all([
    getNaverStockSearchRanking(),
    getNaverFinanceNews(),
    getNaverStockRanking(),
    getDaumFinanceNews(),
    getHankyungFinanceNews(),
    getMoneyTodayNews(),
  ]);

  const freq = {};
  volumeRanking.forEach(k => { freq[k] = (freq[k] || 0) + 3; });
  searchRanking.forEach(k => { freq[k] = (freq[k] || 0) + 2; });
  newsKeywords.forEach(k => { freq[k] = (freq[k] || 0) + 1; });
  daumNews.forEach(k => { freq[k] = (freq[k] || 0) + 1; });
  hankyungNews.forEach(k => { freq[k] = (freq[k] || 0) + 1; });
  mtNews.forEach(k => { freq[k] = (freq[k] || 0) + 1; });

  const sorted = Object.entries(freq)
    .filter(([text, v]) => {
      if (v < 3) return false;
      const etfKeywords = ['KODEX', 'TIGER', '인버스', '레버리지', '선물', 'ETN', 'ETF', '2X', 'ACE', 'KOSEF'];
      if (etfKeywords.some(k => text.includes(k))) return false;
      return true;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([text, value]) => ({ text, value }));

  const outDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mindmap_stocks.json'), JSON.stringify(sorted, null, 2), 'utf8');

  console.log(`[collect-stocks-mindmap] 완료: ${sorted.length}개 키워드 저장`);
}

main().catch(e => {
  console.error('[collect-stocks-mindmap] 오류:', e.message);
  process.exit(1);
});
