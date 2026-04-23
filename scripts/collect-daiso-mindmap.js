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
    for (let i = 0; i <= 5; i++) {
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
                const filterText = text.replace(/다이소|추천템|추천/g, ' ');
                if (filterText.length >= 2) titles.push(filterText);
            });
        } catch (e) {
            console.warn(`[daiso-clien] 검색 추출 실패: ${e.message}`);
        }
    }

    // 루리웹 다이소 검색결과 (여러 페이지)
    for (let i = 1; i <= 5; i++) {
        try {
            const page = i;
            const res = await fetch(`https://bbs.ruliweb.com/search?q=${encodeURIComponent('다이소')}&page=${page}`, { 
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(10000)
            });
            const html = await res.text();
            const $ = cheerio.load(html);
            $('.subject a').each((_i, el) => {
                const text = $(el).text().trim();
                const filterText = text.replace(/다이소|추천템|추천/g, ' ');
                if (filterText.length >= 2) titles.push(filterText);
            });
        } catch (e) {
            console.warn(`[daiso-ruliweb] 검색 추출 실패: ${e.message}`);
        }
    }

    if (titles.length === 0) {
        console.warn('[collect-daiso-mindmap] 수집된 제목이 없습니다!');
    }

    const wordCounts = KoreanNLP.getFrequencies(titles);
    
    const excludeWords = [
        '대통령', '광주', '서울', '동네', '계신', '도보여행기', '갔다', '새로운', '하게된', '이야기', 
        '최종', '제품', '사용', '괜찮', '반월', '있을까요', '질문', '추천', '다이소', '추천템', '구매', '가격', '얼마', 
        '어디서', '파나요', '있나요', '가성비', '이거', '저거', '써보신분', '어떤가요', '비교', '품절', '재고',
        '설치', '아파트'
    ];

    const sorted = Object.entries(wordCounts)
        .filter(([k, v]) => {
            if (v < 2) return false;
            // 제외 단어 완전 일치 및 포함 (부분 일치) 필터링
            if (excludeWords.includes(k) || excludeWords.some(ew => k.includes(ew))) return false;
            // 5천원짜리 등 숫자+문자 조합 제거
            if (/^\d+[a-zA-Z가-힣]+$/.test(k)) return false;
            if (/^\d+$/.test(k)) return false;
            return true;
        })
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
