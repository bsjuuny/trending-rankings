const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDC() {
    try {
        console.log("Testing DC Daiso...");
        const res = await fetch('https://gall.dcinside.com/board/lists/?id=daiso', { 
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const titles = [];
        $('.gall_tit a:not(.reply_numbox)').each((i, el) => {
            const text = $(el).text().trim();
            if (text) titles.push(text);
        });
        console.log("DC Daiso Titles:", titles.slice(0, 5));
    } catch (e) {
        console.log("DC Error:", e);
    }
}

async function testQuasar() {
    try {
        console.log("Testing Quasarzone...");
        const res = await fetch('https://quasarzone.com/bbs/qb_saleinfo', { 
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const titles = [];
        $('.subject-link .ellipsis-with-reply-cnt').each((i, el) => {
            const text = $(el).text().trim();
            if (text) titles.push(text);
        });
        console.log("Quasarzone Titles:", titles.slice(0, 5));
    } catch (e) {
        console.log("Quasarzone Error:", e);
    }
}

async function testPomppu() {
    try {
        console.log("Testing Pomppu...");
        const buf = await fetch('https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu', { 
            headers: { 'User-Agent': USER_AGENT }
        }).then(r => r.arrayBuffer());
        const html = new TextDecoder('euc-kr').decode(buf);
        const $ = cheerio.load(html);
        const titles = [];
        $('font.list_title').each((i, el) => {
            const text = $(el).text().trim();
            if (text) titles.push(text);
        });
        console.log("Pomppu Titles:", titles.slice(0, 5));
    } catch (e) {
        console.log("Pomppu Error:", e);
    }
}

async function run() {
    await testDC();
    await testQuasar();
    await testPomppu();
}

run();
