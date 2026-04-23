const cheerio = require('cheerio');

async function testDaiso() {
    try {
        const res = await fetch('https://www.daisomall.co.kr/ds/exbi/EXBICategory.action?disp_ctg_no=119&depth=1'); // Examples of Daiso categories
        const html = await res.text();
        console.log(html.substring(0, 500));
        console.log('---');
    } catch (e) {
        console.log('Error', e);
    }
}
testDaiso();
