/**
 * collect-community-mindmap.js
 * 루리웹/도그드립 커뮤니티 게시글 제목에서 키워드 추출
 * → public/data/mindmap.json 저장
 * (기존 generate-summary.js의 getCommunityKeywords 로직 분리)
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-community-mindmap] 시작...');

    const titles = [];
    try {
        const res1 = await fetch('https://m.ruliweb.com/best', { headers: { 'User-Agent': USER_AGENT } });
        const html1 = await res1.text();
        const $1 = cheerio.load(html1);
        $1('.subject').each((i, el) => titles.push($1(el).text().trim()));
    } catch (e) { console.warn('[community] 루리웹 실패:', e.message); }

    try {
        const res2 = await fetch('https://www.dogdrip.net', { headers: { 'User-Agent': USER_AGENT } });
        const html2 = await res2.text();
        const $2 = cheerio.load(html2);
        $2('.title').each((_i, el) => {
            const text = $2(el).text().trim();
            if (text.length >= 5 && text.length <= 80 && /[가-힣]/.test(text)) titles.push(text);
        });
    } catch (e) { console.warn('[community] 도그드립 실패:', e.message); }

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
