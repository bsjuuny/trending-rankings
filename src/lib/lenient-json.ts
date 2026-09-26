/**
 * Nate 실시간 검색어 피드(`jsonLiveKeywordDataV1.js`)는 키워드 문자열 안에 이스케이프되지 않은
 * 개행이 그대로 섞여 나오는 경우가 있어 `JSON.parse`가 "Bad control character in string literal"로
 * 죽는다. 파싱 전에 문자열 리터럴 안의 제어문자만 이스케이프해 준다.
 *
 * `scripts/utils/lenient-json.js`에 같은 로직의 CJS 사본이 있다. 한쪽을 고치면 다른 쪽도 고칠 것.
 */
export function escapeControlCharsInJsonStrings(text: string): string {
    let out = '';
    let inString = false;
    let escaped = false;

    for (const ch of text) {
        if (inString) {
            if (escaped) {
                escaped = false;
                out += ch;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                out += ch;
                continue;
            }
            if (ch === '"') {
                inString = false;
                out += ch;
                continue;
            }
            const code = ch.charCodeAt(0);
            if (code < 0x20) {
                if (ch === '\n') out += '\\n';
                else if (ch === '\r') out += '\\r';
                else if (ch === '\t') out += '\\t';
                else out += `\\u${code.toString(16).padStart(4, '0')}`;
                continue;
            }
            out += ch;
            continue;
        }
        if (ch === '"') inString = true;
        out += ch;
    }
    return out;
}

/** 제어문자를 관용적으로 처리하는 JSON.parse. */
export function parseLenientJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return JSON.parse(escapeControlCharsInJsonStrings(text));
    }
}

/** 랭킹 키워드용: 개행·연속 공백을 한 칸으로 접는다. */
export function collapseWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}
