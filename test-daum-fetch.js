const cheerio = require('cheerio');

async function testFetchDaum() {
    const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
        console.log('Fetching Daum main page...');
        const response = await fetch('https://www.daum.net/', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log('Searching for trends...');
        const trends = [];
        $('.box_trendrank .tit_item').each((i, el) => {
            trends.push($(el).text().trim());
        });
        
        if (trends.length > 0) {
            console.log('Trends found:', trends.slice(0, 10));
        } else {
            console.log('No trends found using fetch. This confirms Puppeteer or a browser-like environment is likely needed for this specific selector.');
            // Try another selector if common
            const alternative = $('.item_trend .txt_pctop').length;
            console.log('Alternative selector count:', alternative);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

testFetchDaum();
