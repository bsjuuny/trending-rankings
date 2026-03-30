const cheerio = require('cheerio');
const puppeteer = require('puppeteer'); 
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle2', timeout: 30000 });

        const trends = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.box_trendrank .tit_item');
            items.forEach(el => {
                const text = el.innerText.trim();
                if (text && !results.includes(text)) {
                    results.push(text);
                }
            });
            return results;
        });

        const keywords = trends.slice(0, 10);
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

async function getCommunityKeywords(fs) {
    const titles = [];
    try {
        const response1 = await fetch('https://m.ruliweb.com/best', { headers: { 'User-Agent': USER_AGENT } });
        const html1 = await response1.text();
        const $1 = cheerio.load(html1);
        $1('.subject').each((i, el) => titles.push($1(el).text().trim()));

        const response2 = await fetch('https://pann.nate.com/talk/ranking', { headers: { 'User-Agent': USER_AGENT } });
        const html2 = await response2.text();
        const $2 = cheerio.load(html2);
        $2('.tit').each((i, el) => titles.push($2(el).text().trim()));
    } catch (e) { console.error('Community fetch error:', e); }

    const wordCounts = KoreanNLP.getFrequencies(titles);

    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(w => w[1] > 1);

    if (fs) {
        if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
        fs.writeFileSync('public/data/mindmap.json', JSON.stringify(sortedWords.slice(0, 50).map(w => ({text: w[0], value: w[1]})), null, 2), 'utf8');
    }

    const keywords = sortedWords.slice(0, 10);
    if (keywords.length > 0) {
        return keywords.map((w, i) => `${i + 1}. ${w[0]} (${w[1]}회)`).join('\n');
    }
    return '데이터를 가져올 수 없습니다.';
}

async function main() {
    const fs = require('fs');
    const [nate, google, signal, x, youtube, daum, comm] = await Promise.all([
        getNateRankings(),
        getGoogleTrends(),
        getSignalRankings(),
        getXRankings(),
        getYoutubeRankings(),
        getDaumRankings(),
        getCommunityKeywords(fs)
    ]);

    // Simple escape for HTML
    const escapeHTML = (str) => str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);

    const formatSection = (title, icon, data) => {
        const lines = data.split('\n');
        const formattedData = lines.map(line => `  ${line}`).join('\n');
        return `<b>${icon} ${title}</b>\n${escapeHTML(formattedData)}`;
    };

    const summary = [
        formatSection('종합 커뮤니티 트렌드', '🔥', comm),
        '',
        formatSection('Nate 이슈', '🏙', nate),
        '',
        formatSection('Google Trends', '🔍', google),
        '',
        formatSection('Daum 트렌드 (Beta)', '🟡', daum),
        '',
        formatSection('Signal.bz', '🚥', signal),
        '',
        formatSection('X (Twitter)', '🐦', x),
        '',
        formatSection('YouTube 인기 급상승', '🎬', youtube),
    ].join('\n');

    fs.writeFileSync('summary.txt', summary, 'utf8');
    console.log('Summary generated and saved to summary.txt');

    // 텔레그램 발송 (Global Hub)
    if (process.argv.includes('--send')) {
        try {
            const { execSync } = require('child_process');
            const notifyScript = 'C:/github/antigravity-bot/scripts/notify.mjs';
            const cmd = `node ${notifyScript} --prefix "🔥 [Trending]" --html --force`;
            execSync(cmd, {
                input: summary,
                encoding: 'utf-8',
                windowsHide: true
            });
            console.log('✅ Telegram summary sent successfully.');
        } catch (e) {
            console.error('❌ Failed to send Telegram summary:', e.message);
        }
    }
}

main();
