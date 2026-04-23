const cheerio = require('cheerio');
const fs = require('fs');
const KoreanNLP = require('./utils/korean-nlp');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrapNaver() {
    console.log("Scraping Naver Daiso...");
    try {
        const res = await fetch('https://search.naver.com/search.naver?where=view&query=' + encodeURIComponent('다이소 추천템'), {
            headers: { 'User-Agent': USER_AGENT }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const titles = [];
        $('.title_link').each((i, el) => titles.push($(el).text().trim()));
        console.log("Naver Titles:", titles.slice(0, 5));
        return titles;
    } catch(e) { console.log(e); return []; }
}
scrapNaver();
