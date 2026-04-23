const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const KoreanNLP = require('./utils/korean-nlp');
const fs = require('fs');
const path = require('path');

// .env 및 .env.local 수동 로드 로직 (node 직접 실행 대응)
const loadEnv = () => {
    ['.env', '.env.local'].forEach(file => {
        const envPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key && value) {
                        process.env[key] = value; // 덮어씌우기 허용
                    }
                }
            });
        }
    });
};
loadEnv();

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
        fs.writeFileSync('public/data/mindmap.json', JSON.stringify(sortedWords.slice(0, 50).map(w => ({ text: w[0], value: w[1] })), null, 2), 'utf8');
    }

    const keywords = sortedWords.slice(0, 20);
    if (keywords.length > 0) {
        return keywords.map((w, i) => `${i + 1}. ${w[0]} (${w[1]}회)`).join('\n');
    }
    return '데이터를 가져올 수 없습니다.';
}

async function getJSONMindmap(fs, filename, title) {
    try {
        const filePath = `public/data/${filename}`;
        if (!fs.existsSync(filePath)) return '데이터가 아직 준비되지 않았습니다.';
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const items = Array.isArray(data) ? data : (data.items || []);
        const keywords = items.slice(0, 20); // 상위 20개
        if (keywords.length > 0) {
            return keywords.map((w, i) => `${i + 1}. ${w.text} (${w.value}회)`).join('\n');
        }
        return '수집된 키워드가 없습니다.';
    } catch (e) { return '데이터를 가져올 수 없습니다.'; }
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
        getCommunityKeywords(fs) // 20개 가져오도록 내부 수정 필요
    ]);

    // 주식 및 공모주 마인드맵 추가 로드
    const stocksBuzz = await getJSONMindmap(fs, 'mindmap_stocks.json', '주식 트렌드');
    const ipoBuzz = await getJSONMindmap(fs, 'mindmap_ipo.json', '공모주 트렌드');

    const escapeHTML = (str) => str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);

    const formatSection = (title, icon, data) => {
        const lines = data.split('\n');
        const formattedData = lines.map(line => `  ${line}`).join('\n');
        return `<b>${icon} ${title}</b>\n${escapeHTML(formattedData)}`;
    };

    // 1. 메인 리포트 (포털 실시간 순위 중심)
    const mainSummary = [
        formatSection('Nate 이슈', '🏙', nate),
        '',
        formatSection('Google Trends', '🔍', google),
        '',
        formatSection('Daum 트렌드', '🟡', daum),
        '',
        formatSection('Signal.bz', '🚥', signal),
        '',
        formatSection('X (Twitter)', '🐦', x),
        '',
        formatSection('YouTube 인기 급상승', '🎬', youtube),
    ].join('\n');

    // 2. 통합 인텔리전스 버즈 리포트 (커뮤니티 + 마인드맵)
    const buzzSummary = [
        formatSection('종합 커뮤니티 트렌드 (TOP 20)', '🔥', comm),
        '',
        formatSection('주식 트렌드 마인드맵 (TOP 20)', '📈', stocksBuzz),
        '',
        formatSection('공모주 트렌드 마인드맵 (TOP 20)', '💎', ipoBuzz),
    ].join('\n');

    fs.writeFileSync('summary_main.txt', mainSummary, 'utf8');
    fs.writeFileSync('summary_buzz.txt', buzzSummary, 'utf8');
    console.log('Dual-bot summaries generated successfully.');

    if (process.argv.includes('--send')) {
        // 새벽 (01시~05시) 및 일요일 알림 건너뜀
        const nowKST = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000);
        const hour = nowKST.getHours();
        const day = nowKST.getDay(); // 0: 일요일

        if (day === 0) {
            console.log('[scheduler] 일요일은 텔레그램 알림을 발송하지 않습니다.');
            return;
        }
        if (hour >= 1 && hour < 5) {
            console.log(`[scheduler] 새벽 시간대(${hour}시) 알림 발송 건너뜀 (01:00~05:00)`);
            return;
        }

        try {
            const { execSync } = require('child_process');
            const notifyScript = 'C:/github/antigravity-bot/scripts/notify.mjs';
            const gap = '\u200B\n\n';

            // 1. 메인 리포트 발송 (기존 봇)
            const mainToken = process.env.TELEGRAM_BOT_TOKEN;
            console.log(`Sending Main Report... (Token: ${mainToken ? mainToken.substring(0,6) : 'N/A'}...)`);
            execSync(`node ${notifyScript} --prefix "📑 [Main Rankings]" --html --force --token "${mainToken}"`, {
                input: gap + mainSummary, encoding: 'utf-8', windowsHide: true
            });

            // 2. 인텔리전스 버즈 발송 (새로운 전용 봇)
            const buzzToken = process.env.TELEGRAM_BOT_TOKEN_BUZZ || mainToken;
            console.log(`Sending Intelligence Buzz Report via dedicated bot... (Token: ${buzzToken ? buzzToken.substring(0,6) : 'N/A'}...)`);
            
            execSync(`node ${notifyScript} --prefix "🧠 [Intelligence Buzz]" --html --force --token "${buzzToken}"`, {
                input: gap + buzzSummary, 
                encoding: 'utf-8', 
                windowsHide: true
            });
            
            console.log('✅ All specialized Telegram reports sent successfully.');
        } catch (e) {
            console.error('❌ Failed to send Telegram summary:', e.message);
        }
    }
}

main();
