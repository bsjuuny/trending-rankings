const puppeteer = require('puppeteer');

async function testUserSelectorMain() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://www.daum.net/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Let's try to find ANY elements with these classes first
        const structureCheck = await page.evaluate(() => {
            return {
                boxTrendrank: document.querySelectorAll('.box_trendrank').length,
                listTrendrankWrap: document.querySelectorAll('.list_trendrank_wrap').length,
                titItem: document.querySelectorAll('.tit_item').length,
                olInsideWrap: document.querySelectorAll('.list_trendrank_wrap ol').length
            };
        });
        console.log('Structure Check:', structureCheck);

        const selector = '.box_g.box_trendrank > .list_trendrank_wrap > ol > .tit_item';
        const results = await page.evaluate((sel) => {
            const elements = Array.from(document.querySelectorAll(sel));
            return elements.map(el => ({
                text: el.innerText.trim(),
                html: el.innerHTML.substring(0, 100),
                link: el.querySelector('a') ? el.querySelector('a').href : 'no link'
            }));
        }, selector);
        
        console.log('Results for ' + selector + ':', JSON.stringify(results, null, 2));

        // If not found, look for something similar
        if (results.length === 0) {
            console.log('Searching for .tit_item globally...');
            const globTit = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.tit_item')).map(el => el.innerText.trim());
            });
            console.log('Global .tit_item:', globTit);
        }
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (browser) await browser.close();
    }
}
testUserSelectorMain();
