const puppeteer = require('puppeteer');
const fs = require('fs');

async function checkDaumMainNetwork() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        
        page.on('response', async (response) => {
            const url = response.url();
            const type = response.request().resourceType();
            if (url.includes('api') || url.includes('json') || url.includes('trend') || type === 'xhr' || type === 'fetch') {
                try {
                    const text = await response.text();
                    fs.appendFileSync('daum-main-api-all.txt', 'URL: ' + url + '\n' + text.substring(0, 1000) + '\n\n');
                } catch (e) { }
            }
        });
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 8000));
        console.log('Done checking network');
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
checkDaumMainNetwork();
