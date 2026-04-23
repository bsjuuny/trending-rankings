/**
 * collect-daiso-mindmap.js
 * 네이버 블로그/카페 (View) 다이소 추천템 키워드 추출
 * → public/data/mindmap_daiso.json 저장
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const KoreanNLP = require('./utils/korean-nlp');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
    console.log('[collect-daiso-mindmap] 시작...');
    const titles = [];

    // 클리앙 다이소 검색결과 (여러 페이지)
    for (let i = 0; i <= 2; i++) {
        try {
            const page = i;
            const res = await fetch(`https://www.clien.net/service/search?q=${encodeURIComponent('다이소')}&p=${page}`, { 
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(10000)
            });
            const html = await res.text();
            const $ = cheerio.load(html);
            $('.list_title .subject_fixed').each((_i, el) => {
                const text = $(el).text().trim();
                // '다이소', '추천', '추천템' 등 너무 뻔한 단어 제외 (KoreanNLP에서 걸러질 수도 있지만 명시적으로 필터 목적)
                const filterText = text.replace(/다이소|추천템|추천/g, ' ');
                if (filterText.length >= 2) titles.push(filterText);
            });
        } catch (e) {
            console.warn(`[daiso] 검색 추출 실패: ${e.message}`);
        }
    }

    if (titles.length === 0) {
        console.warn('[collect-daiso-mindmap] 수집된 제목이 없습니다!');
    }

    const wordCounts = KoreanNLP.getFrequencies(titles);
    const sorted = Object.entries(wordCounts)
        .filter(([, v]) => v >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }));

    const outDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    fs.writeFileSync(path.join(outDir, 'mindmap_daiso.json'), JSON.stringify(sorted, null, 2), 'utf8');
    console.log(`[collect-daiso-mindmap] 완료: ${sorted.length}개 키워드 저장`);
}

main().catch(e => {
    console.error('[collect-daiso-mindmap] 오류:', e.message);
    process.exit(1);
});
