const puppeteer = require('puppeteer');
const fs = require('fs');
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDaumMain() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent(USER_AGENT);
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const html = await page.content();
        fs.writeFileSync('daum-main-dom.html', html);
        console.log("Saved DOM to daum-main-dom.html");
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
testDaumMain();
