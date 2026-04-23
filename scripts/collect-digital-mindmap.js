/**
 * collect-digital-mindmap.js
 * 퀘이사존 쇼핑정보/특가 게시판에서 디지털/가전 키워드 추출
 * → public/data/mindmap_digital.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-digital-mindmap] 시작...');
    const titles = [];

    // 퀘이사존 핫딜 (여러 페이지)
    for (let page = 1; page <= 8; page++) {
        try {
            const res = await fetch(`https://quasarzone.com/bbs/qb_saleinfo?page=${page}`, { 
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(10000)
            });
            const html = await res.text();
            const $ = cheerio.load(html);
            $('.subject-link .ellipsis-with-reply-cnt').each((_i, el) => {
                const text = $(el).text().trim();
                // 괄호 안에 있는 쇼핑몰 이름 등 제거 (예: [네이버] 삼성전자 -> 삼성전자)
                const filterText = text.replace(/\[.*?\]/g, ' ').trim();
                if (filterText.length >= 2) titles.push(filterText);
            });
        } catch (e) {
            console.warn(`[digital] 퀘이사존 추출 실패 (페이지 ${page}): ${e.message}`);
        }
    }

    if (titles.length === 0) {
        console.warn('[collect-digital-mindmap] 수집된 제목이 없습니다!');
    }

    const wordCounts = KoreanNLP.getFrequencies(titles);
    
    // 특가 용어, 불필요한 단어 제거 옵션
    const excludeWords = ['무배', '할인', '특가', '배송', '무료', '체감가', '원', '만', '쿠폰'];
    
    const sorted = Object.entries(wordCounts)
        .filter(([k, v]) => v >= 2 && !excludeWords.includes(k) && !/^\d+$/.test(k))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }));

    const outDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    fs.writeFileSync(path.join(outDir, 'mindmap_digital.json'), JSON.stringify(sorted, null, 2), 'utf8');
    console.log(`[collect-digital-mindmap] 완료: ${sorted.length}개 키워드 저장`);
}

main().catch(e => {
    console.error('[collect-digital-mindmap] 오류:', e.message);
    process.exit(1);
});
