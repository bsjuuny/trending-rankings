/**
 * collect-community-mindmap.js
 * 루리웹/도그드립/클리앙/오늘의유머 커뮤니티 게시글 제목에서 키워드 추출
 * → public/data/mindmap.json 저장
 * (기존 generate-summary.js의 getCommunityKeywords 로직 분리)
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-community-mindmap] 시작...');

    const titles = [];
    try {
        console.log('[community] 루리웹 시도...');
        const res1 = await fetch('https://m.ruliweb.com/best', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html1 = await res1.text();
        const $1 = cheerio.load(html1);
        $1('.subject').each((i, el) => titles.push($1(el).text().trim()));
        console.log(`[community] 루리웹 완료 (${titles.length}개)`);
    } catch (e) { console.warn('[community] 루리웹 실패:', e.message); }

    try {
        console.log('[community] 도그드립 시도...');
        const res2 = await fetch('https://www.dogdrip.net', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html2 = await res2.text();
        const $2 = cheerio.load(html2);
        let count = 0;
        $2('.title').each((_i, el) => {
            const text = $2(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) {
                titles.push(text);
                count++;
            }
        });
        console.log(`[community] 도그드립 완료 (+${count}개)`);
    } catch (e) { console.warn('[community] 도그드립 실패:', e.message); }

    try {
        console.log('[community] 클리앙 시도...');
        const res4 = await fetch('https://www.clien.net/service/board/park', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html4 = await res4.text();
        const $4 = cheerio.load(html4);
        let count = 0;
        $4('.list_title .list_subject').each((_i, el) => {
            const text = $4(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) {
                titles.push(text);
                count++;
            }
        });
        console.log(`[community] 클리앙 완료 (+${count}개)`);
    } catch (e) { console.warn('[community] 클리앙 실패:', e.message); }

    try {
        console.log('[community] 오늘의유머 시도...');
        // URL 수정: listtop.php -> list.php?table=bestofbest
        const res5 = await fetch('https://www.todayhumor.co.kr/board/list.php?table=bestofbest', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html5 = await res5.text();
        const $5 = cheerio.load(html5);
        let count = 0;
        $5('.subject a').each((_i, el) => {
            const text = $5(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) {
                titles.push(text);
                count++;
            }
        });
        console.log(`[community] 오늘의유머 완료 (+${count}개)`);
    } catch (e) { console.warn('[community] 오늘의유머 실패:', e.message); }

    // 고급 형태소 분석기를 통한 명사 빈도수 추출
    const wordCounts = KoreanNLP.getFrequencies(titles);

    const sorted = Object.entries(wordCounts)
        .filter(([, v]) => v >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }));

    const outDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'mindmap.json'), JSON.stringify(sorted, null, 2), 'utf8');

    console.log(`[collect-community-mindmap] 완료: ${sorted.length}개 키워드 저장`);
}

main().catch(e => {
    console.error('[collect-community-mindmap] 오류:', e.message);
    process.exit(1);
});
