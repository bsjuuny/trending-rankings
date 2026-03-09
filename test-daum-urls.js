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
        
        fs.writeFileSync('daum-all-urls.txt', '');

        page.on('request', async (request) => {
            const url = request.url();
            fs.appendFileSync('daum-all-urls.txt', url + '\n');
        });
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 8000));
        console.log('Done checking network URLs');
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
checkDaumMainNetwork();
