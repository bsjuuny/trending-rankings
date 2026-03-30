/**
 * L-R Tokenizer 기반 고급 한국어 형태소 분석기 (Pure JS)
 * 조사(Particle)와 어미(Ending)를 가장 긴 접미사부터 정밀하게 분리하여 명사(Noun)의 원형 보존율을 대폭 끌어올린 엔진입니다.
 */

const STOPWORDS = new Set([
    '진짜', '오늘', '너무', '정말', '이거', '저거', '어떻게', '어떤', '무슨', '이런',
    '저런', '그리고', '이게', '내가', '근데', '뭐가', '그냥', '많이', '요즘', '다들', '지금', '약후',
    '아직', '벌써', '어제', '내일', '주말', '올해', '내년', '아침', '저녁', '새벽',
    '아닌', '다른', '그런', '어떤', '같은', '모든', '많은', '적은', '크게', '아무',
    '어떻', '그렇', '이렇', '저렇', '어쩌', '대한', '대해', '관한', '관해', '위한',
    '미친', '대박', '레전드', '진심', '아니', '이걸', '저걸', '왜케', '왜이렇게',
    '공개', '출시', '소개', '진행', '지난', '신규', '모든', '많은', '적은', '크게',
    '역대', '최근', '이유', '현재', '이번', '이후', '결과', '과연', '역시', '주의',
    '특징', '반응', '정도', '사진', '영상', '관련', '사실', '생각', '시간', '느낌',
    '경우', '오픈', '시작', '종료', '기념', '내용', '모습', '상황', '등장', '발표',
    '예정', '확인', '참여', '방법', '추가', '변경', '적용', '안내', '문제', '이유',
    '사람', '하루', '우리', '누가', '어디', '저희', '분들', '사람들', '자체', '자신',
    '부분', '하나', '둘다', '전부', '모두', '누군가', '누구', '무엇', '어느', '어느것',
    // ... (기존 불용어 유지)
    '주식', '상장', '공모주', '주가', '투자', '매수', '매도', '수익', '시장', '기업',
    'jpg', 'png', 'gif', '베플', '추천', '비추', '실시간', '달라지', '단독', '기소', '정신', '차릴', '수가', '있네', '없네', '기대', '소멸',
    '진짜루', '암튼', '암턴', '어차피', '어짜피', '솔직히', '암튼간', '어떻게든', '어찌됐든',
    // 조사/부사 단독 등장 방지
    '부터', '까지', '마저', '조차', '보다', '처럼', '같이', '라도', '밖에', '이나',
    '이며', '이고', '이라', '이야', '마다', '에서', '에게', '한테', '으로', '에도'
]);

// 억울하게 잘릴 위험이 있는 명사 원형 보호 (사전)
const DICTIONARY = new Set([
    '어린이', '고양이', '사나이', '지팡이', '원숭이', '호랑이', '거북이', '달팽이',
    '마늘', '하늘', '가을', '겨울', '오늘', '내일', '모레', '바늘', '연필', '지하철',
    '아이폰', '갤럭시', '컴퓨터', '스마트폰', '노트북', '카메라', '모니터',
    '닌텐도', '세키로', '배틀필드', '엔씨소프트', '스마일게이트', '마비노기',
    // 신조어 및 커뮤니티 용어 보강
    '갓생', '중꺾마', '중꺾단', '갑분싸', '뇌절', '추석', '설날', '민심', '어그로', 
    '티메프', '큐텐', '위메프', '티몬', '복날', '복달임', '말복', '초복', '중복'
]);

// 절대로 명사로 취급해서는 안 되는 동사/형용사 어간 (L-Part)
const BANNED_STEMS = new Set([
    '있', '없', '같', '그렇', '이렇', '저렇', '어떻', '안되', '못하', '않', '맞', '다르',
    '좋', '나쁘', '크', '작', '많', '적', '이', '아니', '되', '하', '그러', '이러', '어쩌'
]);

// 조사(Josa) 최장 일치 배열 (글자 수 기준 내림차순 정렬 필수)
const JOSAS = [
    '에서부터', '으로부터', '이라고도', '까지만해도', '으로서의', '으로써의',
    '에서는', '에서도', '까지는', '까지도', '로부터', '보다는', '이라는', '이라고', 
    '입니다', '습니까', '습니다', '으로서', '으로써', '보다는',
    '은요', '는요', '이요', '가요', '을요', '를요', '에서', '에게', '한테', '까지', 
    '부터', '마저', '조차', '보다', '처럼', '같이', '라도', '이나', '밖에', '으로', 
    '이며', '이고', '이라', '이야', '마다',
    '은', '는', '이', '가', '을', '를', '과', '와', '의', '에', '도', '로', '만'
];

// 서술격 어미 및 관형사형 어미 (Eomi) 배열 (동사/형용사를 뒤집어씀)
const EOMIS = [
    '해버렸다', '되어버렸다', '시켰다', '하다가', '했다가', '한다는', '된다는',
    '한다고', '된다고', '하는거', '되는거', '하면서', '시키며', '시키면',
    '합니다', '할수', '될수', '같음', '같다', '했다', '왔다', '갔다', '해서', '하면', 
    '된다', '한다', '하는', '되는', '있는', '없는', '치켜', '시켜'
];

class KoreanNLP {
    static extractNouns(text) {
        let cleanText = text.replace(/\[.*?\]/g, ' ')
                            .replace(/[^\w가-힣\s]/g, ' ')
                            .replace(/\s+/g, ' ');

        const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 0);
        let nouns = [];

        for (let word of rawWords) {
            if (/^\d+[일위개층회분초]$/.test(word)) continue;
            
            let isException = DICTIONARY.has(word);

            if (!isException) {
                for (let eomi of EOMIS) {
                    if (word.endsWith(eomi)) {
                        const stem = word.slice(0, word.length - eomi.length);
                        if (stem.length === 0 || BANNED_STEMS.has(stem)) return nouns; // Skip entire word if it's a verb
                        word = stem;
                        break;
                    }
                }
            }

            if (!isException) {
                for (let josa of JOSAS) {
                    if (word.endsWith(josa)) {
                        const nominal = word.slice(0, word.length - josa.length);
                        if (DICTIONARY.has(nominal) || nominal.length >= 2) {
                            word = nominal;
                            break;
                        }
                    }
                }
            }

            if (word.length > 1 && !STOPWORDS.has(word) && !BANNED_STEMS.has(word) && isNaN(Number(word))) {
                if (word.startsWith('베플')) word = word.replace('베플', '');
                
                // [고도화] 복합 명사 분해 시도 (단어가 길고 사전에 없는 경우)
                if (word.length >= 5 && !DICTIONARY.has(word)) {
                    const decomposed = this.decompose(word);
                    if (decomposed.length > 1) {
                        nouns.push(...decomposed);
                        continue;
                    }
                }

                if (word.length > 1 && !STOPWORDS.has(word)) {
                    nouns.push(word);
                }
            }
        }
        return nouns;
    }

    /**
     * [고도화] 복합 명사 분해 로직
     * 단순 2분할 매칭 방식 (사전에 있는 단어 우선)
     */
    static decompose(word) {
        for (let i = 2; i <= word.length - 2; i++) {
            const left = word.slice(0, i);
            const right = word.slice(i);
            if (DICTIONARY.has(left) && (DICTIONARY.has(right) || right.length >= 2)) {
                return [left, right];
            }
        }
        return [word];
    }

    /**
     * [고도화] N-gram (Bigram) 추출
     * 의미 있는 단어 쌍 (예: '티몬 위메프') 추출
     */
    static getNGrams(texts, minCount = 3) {
        const ngrams = {};
        texts.forEach(t => {
            const nouns = this.extractNouns(t);
            for (let i = 0; i < nouns.length - 1; i++) {
                const pair = `${nouns[i]} ${nouns[i+1]}`;
                ngrams[pair] = (ngrams[pair] || 0) + 1;
            }
        });
        return Object.fromEntries(Object.entries(ngrams).filter(([, v]) => v >= minCount));
    }

    static getFrequencies(texts) {
        const counts = {};
        const docCounts = {}; // 특정 단어가 포함된 '문장 수' (DF)
        
        texts.forEach(t => {
            const nouns = this.extractNouns(t);
            const uniqueNouns = new Set(nouns);
            
            nouns.forEach(n => {
                counts[n] = (counts[n] || 0) + 1;
            });
            
            // DF 카운트
            uniqueNouns.forEach(n => {
                docCounts[n] = (docCounts[n] || 0) + 1;
            });
        });

        // 🛡️ 통계 기반 자동 불용어 필터링 (IDF 원리 적용)
        // 전체 문장의 50% 이상에서 등장하는 단어는 '도구어'로 판단하여 가감
        const threshold = Math.max(5, texts.length * 0.5);
        for (const word in counts) {
            if (docCounts[word] > threshold) {
                delete counts[word];
            }
        }

        // [고도화] 유의미한 N-gram 추가
        const ngrams = this.getNGrams(texts, 3);
        Object.assign(counts, ngrams);

        return counts;
    }
}

module.exports = KoreanNLP;
