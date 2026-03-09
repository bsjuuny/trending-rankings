const puppeteer = require('puppeteer');

async function testDaumMainTrends() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for the trend links to appear
        await page.waitForSelector('.link_trendrank', { timeout: 10000 });
        
        const trends = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.link_trendrank'));
            return items.map(a => {
                const keywordEl = a.querySelector('strong');
                return {
                    keyword: keywordEl ? keywordEl.innerText.trim() : '',
                    link: a.href
                };
            }).filter(item => item.keyword);
        });
        
        console.log('Detected Trends:', JSON.stringify(trends, null, 2));
        
    } catch (e) {
        console.error('Error fetching trends:', e);
    } finally {
        if (browser) await browser.close();
    }
}
testDaumMainTrends();
