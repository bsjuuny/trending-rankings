/**
 * collect-global-buzz.js
 * Google Trends (Global), Reddit, Hacker News에서 글로벌 키워드 추출
 * → public/data/global-buzz.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-global-buzz] 글로벌 트렌드 수집 시작...');
    const result = {
        bbc: [],
        reddit: [],
        hn: []
    };

    // 1. BBC World News (RSS)
    try {
        const res = await fetch('http://feeds.bbci.co.uk/news/world/rss.xml', { headers: { 'User-Agent': USER_AGENT } });
        const xml = await res.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        $('item > title').each((i, el) => {
            const text = $(el).text().trim();
            if (text && result.bbc.length < 12) {
                result.bbc.push({ text, value: 1 });
            }
        });
    } catch (e) { console.warn('[global] BBC 실패:', e.message); }

    // 2. Reddit Hot RSS (r/all)
    try {
        const res = await fetch('https://www.reddit.com/r/all/hot.rss', { headers: { 'User-Agent': USER_AGENT } });
        const xml = await res.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        $('entry > title').each((i, el) => {
            if (result.reddit.length < 15) {
                const text = $(el).text().trim();
                result.reddit.push({ text, value: 1 });
            }
        });
    } catch (e) { console.warn('[global] Reddit 실패:', e.message); }

    // 3. Hacker News Top Stories (API)
    try {
        const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const ids = await topIdsRes.json();
        const targetIds = ids.slice(0, 15);
        
        for (const id of targetIds) {
            const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            const item = await itemRes.json();
            if (item && item.title) result.hn.push({ text: item.title, value: 1 });
        }
    } catch (e) { console.warn('[global] Hacker News 실패:', e.message); }

    const outDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'global-buzz.json'), JSON.stringify(result, null, 2), 'utf8');
    console.log(`[collect-global-buzz] 완료: BBC(${result.bbc.length}), Reddit(${result.reddit.length}), HN(${result.hn.length}) 저장`);
}

main().catch(e => {
    console.error('[collect-global-buzz] 오류:', e.message);
    process.exit(1);
});
