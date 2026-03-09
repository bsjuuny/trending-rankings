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
        
        fs.writeFileSync('daum-all-json-responses.txt', '');

        page.on('response', async (response) => {
            const url = response.url();
            const type = response.request().resourceType();
            
            // Only care about XHR or Fetch
            if (type === 'xhr' || type === 'fetch') {
                try {
                    const text = await response.text();
                    // We only want JSON-like responses
                    if (text.startsWith('{') || text.startsWith('[')) {
                        fs.appendFileSync('daum-all-json-responses.txt', `\n\n--- URL: ${url} ---\n`);
                        fs.appendFileSync('daum-all-json-responses.txt', text);
                    }
                } catch (e) { }
            }
        });
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 8000));
        console.log('Done capturing JSON responses');
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}
checkDaumMainNetwork();
