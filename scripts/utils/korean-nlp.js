/**
 * L-R Tokenizer 기반 고급 한국어 형태소 분석기 (Pure JS)
 * 조사(Particle)와 어미(Ending)를 가장 긴 접미사부터 정밀하게 분리하여 명사(Noun)의 원형 보존율을 대폭 끌어올린 엔진입니다.
 */

const STOPWORDS = new Set([
    '진짜', '오늘', '너무', '정말', '이거', '저거', '어떻게', '어떤', '무슨', '이런',
    '저런', '그리고', '이게', '내가', '근데', '뭐가', '그냥', '많이', '요즘', '다들', '지금', '약후',
    '아직', '벌써', '어제', '내일', '주말', '올해', '내년', '아침', '저녁', '새벽',
    '아닌', '다른', '그런', '같은', '모든', '많은', '적은', '크게', '아무',
    '어떻', '그렇', '이렇', '저렇', '어쩌', '대한', '대해', '관한', '관해', '위한',
    '미친', '대박', '레전드', '진심', '아니', '이걸', '저걸', '왜케', '왜이렇게',
    '공개', '출시', '소개', '진행', '지난', '신규', '역대', '최근', '이유', '현재', 
    '이번', '이후', '결과', '과연', '역시', '주의', '특징', '반응', '정도', '사진', 
    '영상', '관련', '사실', '생각', '시간', '느낌', '경우', '오픈', '시작', '종료', 
    '기념', '내용', '모습', '상황', '등장', '발표', '예정', '확인', '참여', '방법', 
    '추가', '변경', '적용', '안내', '문제', '사람', '하루', '우리', '누가', '어디', 
    '저희', '분들', '사람들', '자체', '자신', '부분', '하나', '둘다', '전부', '모두', 
    '누군가', '누구', '무엇', '어느', '어느것', '주식', '상장', '공모주', '주가', 
    '투자', '매수', '매도', '수익', '시장', '기업', 'jpg', 'png', 'gif', '베플', 
    '추천', '비추', '실시간', '달라지', '단독', '기소', '정신', '차릴', '수가', '있네', 
    '없네', '기대', '소멸', '진짜루', '암튼', '암턴', '어차피', '어짜피', '솔직히', 
    '암튼간', '어떻게든', '어찌됐든', '근황', '소식', '모음', '함께', '통해', '위해', 
    '만큼', '조금', '가장', '매우', '아주', '전혀', '별로', '보고', '해도', '에서', 
    '에게', '한테', '까지', '부터', '마저', '조차', '보다', '처럼', '같이', '라도', 
    '이나', '밖에', '으로', '에도', '이며', '이고', '이라', '이야', '마다', '해서',
    '때문', '관련', '정보', '최근', '뉴스', '기사', '하나', '두개', '세개', '가지',
    '누구', '누가', '저기', '여기에', '거기에', '어느', '어디', '언제', '여전히', '자꾸',
    '자세', '대박', '레전드', '한번', '두번', '세번', '내내', '자주', '가끔', '전부',
    '번째', '마디', '차례', '동안', '이후', '이전', '어제', '오늘', '내일', '모레',
    '올해', '내년', '이번', '저번', '그때', '지금', '나중', '항상', '맨날', '날마다'
]);

const DICTIONARY = new Set([
    '어린이', '고양이', '사나이', '지팡이', '원숭이', '호랑이', '거북이', '달팽이',
    '마늘', '하늘', '가을', '겨울', '오늘', '내일', '모레', '바늘', '연필', '지하철',
    '아이폰', '갤럭시', '컴퓨터', '스마트폰', '노트북', '카메라', '모니터',
    '닌텐도', '세키로', '배틀필드', '엔씨소프트', '스마일게이트', '마비노기',
    '갓생', '중꺾마', '중꺾단', '갑분싸', '뇌절', '추석', '설날', '민심', '어그로', 
    '티메프', '큐텐', '위메프', '티몬', '복날', '복달임', '말복', '초복', '중복',
    '붉은사막', '검은사막', '펄어비스', '니케', '트릭컬', '데이브', '스텔라', 
    '창세기전', '소울워커', '던파', '메이플', '로스트아크', '롤', '여야', '민주당', 
    '국힘', '대통령', '윤석열', '이재명', '한동훈', '정부', '수사', '검찰', '경찰'
]);

const BANNED_STEMS = new Set([
    '있', '없', '같', '그렇', '이렇', '저렇', '어떻', '안되', '못하', '않', '맞', '다르',
    '좋', '나쁘', '크', '작', '많', '적', '이', '아니', '되', '하', '그러', '이러', '어쩌',
    '보이', '주이', '먹이', '마시', '가시', '오시', '사시', '타시', '오르', '내리', '가', '오',
    '먹', '자', '깨', '불', '들', '놓', '주', '치', '나', '다', '라', '마', '바', '사', '아',
    '자', '차', '카', '타', '파', '하', '걸', '걸리', '버리', '보내', '해', '해봐', '해쥬'
]);

const JOSAS = [
    '에서부터', '으로부터', '이라고도', '까지만해도', '으로서의', '으로써의',
    '에서는', '에서도', '까지는', '까지도', '로부터', '보다는', '이라는', '이라고', 
    '입니다', '습니까', '습니다', '으로서', '으로써', '보다는', '라네요', '이라네요',
    '은요', '는요', '이요', '가요', '을요', '를요', '에게서', '에게로', '으로의', 
    '에는', '에서', '에게', '한테', '까지', '부터', '마저', '조차', '보다', '처럼', 
    '같이', '라도', '이나', '밖에', '으로', '이며', '이고', '이라', '이야', '마다', 
    '에도', '였다', '이가', '보다', '하고', '랑', '과', '와', '은', '는', '이', '가', 
    '을', '를', '에', '의', '로'
].sort((a, b) => b.length - a.length);

const EOMIS = [
    '해버렸다', '되어버렸다', '시켰다', '하다가', '했다가', '한다는', '된다는',
    '한다고', '된다고', '하는거', '되는거', '하면서', '시키며', '시키면',
    '합니다', '할수', '될수', '같음', '같다', '했다', '왔다', '갔다', '해서', '하면', 
    '된다', '한다', '하는', '되는', '있는', '없는', '치켜', '시켜', '했음', '됐음',
    '느냐', '나요', '네요', '군요', '고요', '라고', '다고', '냐고', '자고', '는지',
    '길래', '커녕', '던데', '든가', '라도', '거나', '도록', '으며', '면서', 'ㄴ다',
    'ㄴ가', 'ㄹ까', 'ㄹ게', 'ㄹ지', 'ㅂ니다', '습니까', '려니'
].sort((a, b) => b.length - a.length);


class KoreanNLP {
    static extractNouns(text) {
        // [괄호] 내용 제거 및 특수문자 제거
        let cleanText = text.replace(/\[.*?\]/g, ' ')
                            .replace(/\(.*?\)/g, ' ')
                            .replace(/[^\w가-힣\s]/g, ' ')
                            .replace(/\s+/g, ' ');

        const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 0);
        let nouns = [];

        for (let originalWord of rawWords) {
            let word = originalWord;
            
            // 숫자+단위 제외 (예: 1일, 10위 등)
            if (/^\d+[일위개층회분초]$/.test(word)) continue;
            
            if (DICTIONARY.has(word)) {
                nouns.push(word);
                continue;
            }

            // 어미 제거 (최장 일치 방식)
            let trimmedSuffix = true;
            while (trimmedSuffix && word.length > 1) {
                trimmedSuffix = false;
                // 명사형 어미/조사 포함 모든 접미사 시도
                const suffixes = [...EOMIS, ...JOSAS];
                for (let suffix of suffixes) {
                    if (word.endsWith(suffix)) {
                        const stem = word.slice(0, word.length - suffix.length);
                        // 떼어낸 결과가 유효한지 검사
                        if (stem.length > 0) {
                            word = stem;
                            trimmedSuffix = true;
                            // 만약 stem이 금지어 리스트에 있다면 이 단어는 버림
                            if (BANNED_STEMS.has(stem)) {
                                word = ''; 
                                trimmedSuffix = false;
                            }
                            break;
                        }
                    }
                }
            }

            // 정제된 단어가 유효한 명사인지 최종 판단
            if (word.length > 1 && !STOPWORDS.has(word) && !BANNED_STEMS.has(word) && isNaN(Number(word))) {
                // 특정 접두어/접미어 처리
                if (word.startsWith('베플')) word = word.replace('베플', '');
                
                // 너무 긴 단어는 복합명사로 간주하여 분해 시도
                if (word.length >= 5 && !DICTIONARY.has(word)) {
                    const decomposed = this.decompose(word);
                    if (decomposed.length > 1) {
                        nouns.push(...decomposed.filter(d => d.length > 1 && !STOPWORDS.has(d)));
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
        const docCounts = {};
        
        texts.forEach(t => {
            const nouns = this.extractNouns(t);
            const uniqueNouns = new Set(nouns);
            
            nouns.forEach(n => {
                counts[n] = (counts[n] || 0) + 1;
            });
            
            uniqueNouns.forEach(n => {
                docCounts[n] = (docCounts[n] || 0) + 1;
            });
        });

        // 더 엄격한 임계치 적용 (전체 문서의 15%만 넘어도 삭제)
        const threshold = Math.max(3, texts.length * 0.15);
        for (const word in counts) {
            if (docCounts[word] > threshold || STOPWORDS.has(word)) {
                delete counts[word];
            }
        }

        const ngrams = this.getNGrams(texts, 3);
        Object.assign(counts, ngrams);

        return counts;
    }
}

module.exports = KoreanNLP;
