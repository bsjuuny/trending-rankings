const cheerio = require('cheerio');
const puppeteer = require('puppeteer');const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getXRankings() {
    try {
        const response = await fetch('https://trends24.in/korea/', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items = [];
        $('.trend-link').each((i, el) => {
            const keyword = $(el).text().trim();
            if (keyword && items.length < 10) {
                items.push(`${items.length + 1}. ${keyword}`);
            }
        });
        return items.join('\n');
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
}

async function getYoutubeRankings() {
    try {
        const response = await fetch('https://kworb.net/youtube/trending/kr.html', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items = [];
        $('.text div a').each((i, el) => {
            const keyword = $(el).text().trim();
            if (keyword && items.length < 10) {
                items.push(`${items.length + 1}. ${keyword}`);
            }
        });
        return items.join('\n');
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
}

async function getSignalRankings() {
    try {
        const response = await fetch('https://api.signal.bz/news/realtime', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const data = await response.json();
        return data.top10.slice(0, 10).map((item, i) => `${i + 1}. ${item.keyword}`).join('\n');
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
}

async function getNateRankings() {
    try {
        const response = await fetch('https://www.nate.com/js/data/jsonLiveKeywordDataV1.js', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buffer);
        const data = JSON.parse(text);
        return data.slice(0, 10).map((item, i) => `${i + 1}. ${item[4]}`).join('\n');
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
}

async function getGoogleTrends() {
    try {
        const response = await fetch('https://trends.google.com/trending/rss?geo=KR', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const items = [];
        $('item').each((i, el) => {
            const keyword = $(el).children('title').text().trim();
            if (keyword && items.length < 10) {
                items.push(`${items.length + 1}. ${keyword}`);
            }
        });
        return items.join('\n');
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
}

async function getDaumRankings() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent(USER_AGENT);
        await page.goto('https://search.daum.net/search?w=tot&DA=23N&q=%EC%8B%A4%EC%8B%9C%EA%B0%84+%ED%8A%B8%EB%A0%8C%EB%93%9C', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const trends = await page.evaluate(() => {
            const results = [];
            const sections = document.querySelectorAll('div, section');
            for (const sec of sections) {
                const titleText = (sec.querySelector('h2, h3, h4, strong.tit_wrap') || {}).innerText || '';
                if (titleText.includes('실시간 트렌드') || titleText.includes('버블')) {
                    const links = sec.querySelectorAll('a');
                    links.forEach(a => {
                        const t = a.innerText.trim();
                        const cleanT = t.replace(/^[0-9]+/, '').split('\n')[0].trim();
                        if (cleanT && cleanT.length > 1 && !results.includes(cleanT) && !cleanT.includes('실시간')) {
                            results.push(cleanT);
                        }
                    });
                }
            }
            return results;
        });
        
        const keywords = trends.filter(t => t && !t.includes('안내') && !t.includes('자세히 보기') && !t.includes('닫기') && !t.includes('beta') && !t.includes('다양한 출처')).slice(0, 10);
        if (keywords.length > 0) {
             return keywords.map((k, i) => `${i + 1}. ${k}`).join('\n');
        }
        return '데이터를 가져올 수 없습니다.';
    } catch (e) {
        return '데이터를 가져올 수 없습니다.';
    } finally {
        if (browser) await browser.close();
    }
}

async function main() {
    const [nate, google, signal, x, youtube, daum] = await Promise.all([
        getNateRankings(),
        getGoogleTrends(),
        getSignalRankings(),
        getXRankings(),
        getYoutubeRankings(),
        getDaumRankings()
    ]);

    // Simple escape for HTML
    const escapeHTML = (str) => str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);

    const summary = `
<b>🔥 실시간 트렌드 요약</b>

<b>🏙 Nate 실시간 이슈</b>
${escapeHTML(nate)}

<b>🔍 Google Trends (KR)</b>
${escapeHTML(google)}

<b>🟡 Daum 실시간 트렌드 (Beta)</b>
${escapeHTML(daum)}

<b>🚥 Signal.bz 실시간</b>
${escapeHTML(signal)}

<b>🐦 X (Twitter) 트렌드</b>
${escapeHTML(x)}

<b>🎬 YouTube 인기 급상승</b>
${escapeHTML(youtube)}
    `.trim();

    console.log(summary);
}

main();
