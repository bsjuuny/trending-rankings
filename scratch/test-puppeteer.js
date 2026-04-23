const puppeteer = require('puppeteer');
const KoreanNLP = require('./utils/korean-nlp');

async function scrapeDC_Daiso() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const titles = [];
    
    try {
        await page.goto('https://gall.dcinside.com/board/lists/?id=daiso', { waitUntil: 'domcontentloaded', timeout: 15000 });
        const list = await page.$$eval('.gall_tit a:not(.reply_numbox)', links => links.map(a => a.innerText.trim()));
        titles.push(...list.filter(t => t.length > 2));
        console.log("Titles found:", list.slice(0, 5));
    } catch (e) {
        console.log("Error:", e.message);
    }
    
    await browser.close();
}

scrapeDC_Daiso();
