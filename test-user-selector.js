const puppeteer = require('puppeteer');

async function testUserSelector() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const selector = '.box_g.box_trendrank > .list_trendrank_wrap > ol > .tit_item';
        
        const results = await page.evaluate((sel) => {
            const elements = Array.from(document.querySelectorAll(sel));
            return elements.map(el => {
                // Try to find the keyword and link within this element
                const linkEl = el.querySelector('a') || (el.tagName === 'A' ? el : null);
                const keywordEl = el.querySelector('strong') || el;
                return {
                    tagName: el.tagName,
                    className: el.className,
                    text: el.innerText.trim(),
                    keyword: keywordEl ? keywordEl.innerText.trim() : '',
                    link: linkEl ? linkEl.href : ''
                };
            });
        }, selector);
        
        console.log('User Selector Results:', JSON.stringify(results, null, 2));
        
    } catch (e) {
        console.error('Error testing user selector:', e);
    } finally {
        if (browser) await browser.close();
    }
}
testUserSelector();
