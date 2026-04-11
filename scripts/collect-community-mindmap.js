/**
 * collect-community-mindmap.js
 * 루리웹/도그드립/클리앙/오늘의유머/더쿠 커뮤니티 게시글 제목에서 키워드 추출
 * → public/data/mindmap.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-community-mindmap] 시작...');
    const titles = [];

    // 루리웹
    try {
        const res = await fetch('https://m.ruliweb.com/best', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        const $ = cheerio.load(html);
        $('.subject').each((i, el) => titles.push($(el).text().trim()));
    } catch (e) { console.warn('[community] 루리웹 실패:', e.message); }

    // 도그드립
    try {
        const res = await fetch('https://www.dogdrip.net', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        const $ = cheerio.load(html);
        $('.title').each((_i, el) => {
            const text = $(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) titles.push(text);
        });
    } catch (e) { console.warn('[community] 도그드립 실패:', e.message); }

    // 클리앙
    try {
        const res = await fetch('https://www.clien.net/service/board/park', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        const $ = cheerio.load(html);
        $('.list_title .list_subject').each((_i, el) => {
            const text = $(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) titles.push(text);
        });
    } catch (e) { console.warn('[community] 클리앙 실패:', e.message); }

    // 오늘의유머
    try {
        const res = await fetch('https://www.todayhumor.co.kr/board/list.php?table=bestofbest', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const buf = await res.arrayBuffer();
        const html = new TextDecoder('euc-kr').decode(buf);
        const $ = cheerio.load(html);
        $('.subject a').each((_i, el) => {
            const text = $(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) titles.push(text);
        });
    } catch (e) { console.warn('[community] 오늘의유머 실패:', e.message); }

    // 더쿠
    try {
        const res = await fetch('https://theqoo.net/hot', { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        const $ = cheerio.load(html);
        $('tbody tr td.title a').each((_i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.length >= 5 && text.length <= 60 && /[가-힣]/.test(text)) titles.push(text);
        });
    } catch (e) { console.warn('[community] 더쿠 실패:', e.message); }

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
