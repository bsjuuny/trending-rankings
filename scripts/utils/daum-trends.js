/**
 * Daum 실시간 트렌드 수집기.
 *
 * daum.net 메인은 더 이상 `.box_trendrank .tit_item` 마크업을 데스크톱 HTML로 내려주지 않는다.
 * 대신 `window.tillerInitData` JSON 안의 REALTIME_TREND 슬롯에 키워드가 들어 있다.
 * 모바일(m.daum.net)은 여전히 정적 HTML로 내려주므로 폴백으로 쓴다.
 * 둘 다 일반 fetch로 되기 때문에 puppeteer가 필요 없다.
 */

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MOBILE_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// html[start] 가 '[' 또는 '{' 일 때 짝이 맞는 닫는 괄호까지 잘라낸다 (JSON 문자열/이스케이프 인식).
function sliceBalanced(html, start) {
    const open = html[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < html.length; i++) {
        const ch = html[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === open) depth++;
        else if (ch === close) {
            depth--;
            if (depth === 0) return html.slice(start, i + 1);
        }
    }
    return null;
}

function parseDesktopTrends(html) {
    for (const anchor of ['REALTIME_TREND_TOP', 'REALTIME_TREND_MIDDLE']) {
        let from = 0;
        for (;;) {
            const slotIdx = html.indexOf(anchor, from);
            if (slotIdx === -1) break;
            from = slotIdx + anchor.length;

            const kwIdx = html.indexOf('"keywords":', slotIdx);
            if (kwIdx === -1) break;
            const arrayText = sliceBalanced(html, kwIdx + '"keywords":'.length);
            if (!arrayText) continue;

            let parsed;
            try {
                parsed = JSON.parse(arrayText);
            } catch {
                continue;
            }
            if (!Array.isArray(parsed)) continue;

            const keywords = parsed
                .filter(entry => entry && typeof entry.keyword === 'string')
                .slice()
                .sort((a, b) => (a.displayRank ?? a.rank ?? 0) - (b.displayRank ?? b.rank ?? 0))
                .map(entry => entry.keyword.trim())
                .filter(Boolean);
            if (keywords.length) return keywords;
        }
    }
    return [];
}

function parseMobileTrends(html, cheerio) {
    const $ = cheerio.load(html);
    const keywords = [];
    $('.list_trendrank .tit_item, .box_trendrank .tit_item').each((_, el) => {
        const text = $(el).text().trim();
        if (text) keywords.push(text);
    });
    return keywords;
}

function dedupe(keywords) {
    return [...new Set(keywords)];
}

/**
 * @returns {Promise<string[]>} 순위순 키워드 (실패 시 빈 배열)
 */
async function fetchDaumTrendKeywords(cheerio, limit = 10) {
    try {
        const response = await fetch('https://www.daum.net/', { headers: { 'User-Agent': USER_AGENT } });
        if (response.ok) {
            const keywords = dedupe(parseDesktopTrends(await response.text()));
            if (keywords.length) return keywords.slice(0, limit);
        }
        console.warn('[daum-trends] desktop tillerInitData에서 트렌드를 찾지 못해 m.daum.net으로 폴백합니다.');
    } catch (e) {
        console.warn(`[daum-trends] desktop fetch failed: ${e.message}`);
    }

    try {
        const response = await fetch('https://m.daum.net/', { headers: { 'User-Agent': MOBILE_USER_AGENT } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const keywords = dedupe(parseMobileTrends(await response.text(), cheerio));
        return keywords.slice(0, limit);
    } catch (e) {
        console.warn(`[daum-trends] mobile fetch failed: ${e.message}`);
        return [];
    }
}

module.exports = { fetchDaumTrendKeywords, parseDesktopTrends, parseMobileTrends };
