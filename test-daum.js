
const puppeteer = require('puppeteer');
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDaum() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
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

        console.log('Daum Trends:', trends);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (browser) await browser.close();
    }
}

testDaum();
