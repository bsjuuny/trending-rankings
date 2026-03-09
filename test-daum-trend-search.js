const puppeteer = require('puppeteer');

async function testDaumTrendSearch() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        
        await page.goto('https://search.daum.net/search?w=tot&DA=23N&q=%EC%8B%A4%EC%8B%9C%EA%B0%84+%ED%8A%B8%EB%A0%8C%EB%93%9C', { waitUntil: 'networkidle0', timeout: 30000 });
        
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('daum-trend-search-dom.html', html);
        console.log('Saved daum-trend-search-dom.html');
        
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
testDaumTrendSearch();
