const puppeteer = require('puppeteer');

async function testDaumSearch() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        
        // Go directly to a search page
        await page.goto('https://search.daum.net/search?w=tot&DA=YZR&t__nil_searchbox=btn&sug=&sugo=&sq=&o=&q=%EB%82%A0%EC%94%A8', { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Output the HTML
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('daum-search-dom.html', html);
        console.log('Saved daum-search-dom.html');
        
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
testDaumSearch();
