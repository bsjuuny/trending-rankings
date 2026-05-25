/**
 * L-R Tokenizer 기반 지능형 트렌드 분석 엔진 (v3.0)
 * 1단계: 통계적 신어 보호
 * 2단계: 사용자 피드백(feedback.json) 동적 반영
 * 3단계: 맥락 기반 가중치 (Contextual Weighting)
 */

const fs = require('fs');
const path = require('path');

// 기본 불용어 (Static Stopwords)
const DEFAULT_STOPWORDS = new Set([
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
    '올해', '내년', '이번', '저번', '그때', '지금', '나중', '항상', '맨날', '날마다',
    '최고', '전달', '가장', '자주', '매번', '까닭', '줄줄', '첫날', '일정',
    '발매', '패치', '서비스', '노트', '정리', '제목', '내용', '방법', '이유', '고유',
    '인터뷰', '디렉터', '쇼케이스', '영상', '사진', '베스트', '게시물', '게시글',
    '최대', '최소', '보니', '멋지게', '예정', '확인', '참여',
    '여기', '거기', '저기', '상단', '하단', '아래', '위쪽', '아래쪽', '오른쪽', '왼쪽',
    '중간', '가운데', '맨위', '맨아래', '좌측', '우측', '상단부', '하단부',
    '산업', '분야', '업계', '섹터', '종목', '부문', '항목', '내역', '목록', '리스트',
    '뚫고', '파고든', '뛰어든', '빠져든', '끌어든', '들어든', '몰아든',
    '깨고', '올리고', '내리고', '빠지고', '오르고', '넘고', '넘어서고',
    '꺾고', '이기고', '지고', '줄고', '늘고', '치솟고', '급등하고',
]);

// 기본 사전 (Static Dictionary)
const DEFAULT_DICTIONARY = new Set([
    '어린이', '고양이', '사나이', '지팡이', '원숭이', '호랑이', '거북이', '달팽이',
    '마늘', '하늘', '가을', '겨울', '오늘', '내일', '모레', '바늘', '연필', '지하철',
    '아이폰', '갤럭시', '컴퓨터', '스마트폰', '노트북', '카메라', '모니터',
    '닌텐도', '세키로', '배틀필드', '엔씨소프트', '스마일게이트', '마비노기',
    '갓생', '중꺾마', '중꺾단', '갑분싸', '뇌절', '추석', '설날', '민심', '어그로', 
    '티메프', '큐텐', '위메프', '티몬', '복날', '복달임', '말복', '초복', '중복',
    '붉은사막', '검은사막', '펄어비스', '니케', '트릭컬', '데이브', '스텔라', 
    '창세기전', '소울워커', '던파', '메이플', '로스트아크', '롤', '여야', '민주당', 
    '국힘', '대통령', '윤석열', '이재명', '한동훈', '정부', '수사', '검찰', '경찰',
    '케이뱅크', '스트라드비젼', '마키나락스', '대영채비', '피스피스스튜디오', '폴레드',
    '남선알미늄', '신성이엔지', '흥아해운', '대한해운', '퍼스텍', '대우건설', '몬길',
    '삼성전자', '엘지전자', 'LG전자', '에어팟', '아이패드', '맥북', '애플워치', '갤럭시워치',
    '보조배터리', '무선청소기', '로봇청소기', '공기청정기', '식기세척기', '건조기', '스타일러',
    '그래픽카드', '메인보드', '키보드', '마우스', '모니터', '프린터', '공유기', '블루투스',
    '이어폰', '헤드폰', '스피커', '사운드바', '스마트오디오', '리들샷', '니들샷', 'VT코스메틱',
    '홈스타', '테크', '다이소', '올리브영', '쿠팡', '알리', '테무', '알리익스프레스', '직구',
    '구글플레이', '손톱깎이', '펩시제로', '제로콜라', '스타벅스', '메가커피', '배달의민족'
]);

const BANNED_STEMS = new Set([
    '있', '없', '같', '그렇', '이렇', '저렇', '어떻', '안되', '못하', '않', '맞', '다르',
    '좋', '나쁘', '크', '작', '많', '적', '높', '낮', '이', '아니', '되', '하', '그러', '이러', '어쩌',
    '보이', '주이', '먹이', '마시', '가시', '오시', '사시', '타시', '오르', '내리', '가', '오',
    '먹', '자', '깨', '불', '들', '놓', '주', '치', '나', '다', '라', '마', '바', '사', '아',
    '자', '차', '카', '타', '파', '하', '걸', '걸리', '버리', '보내', '해', '해봐', '해쥬',
    '보', '멋지', '예쁘', '기쁘', '슬프', '바쁘', '아프'
]);

const JOSAS = ['에서부터', '으로부터', '이라고도', '까지만해도', '으로서의', '으로써의', '에서는', '에서도', '까지는', '까지도', '로부터', '보다는', '이라는', '이라고', '에서만', '으로만', '에서나', '으로도', '으로는', '로서는', '로써는', '입니다', '습니까', '습니다', '으로서', '으로써', '보다는', '라네요', '이라네요', '은요', '는요', '이요', '가요', '을요', '를요', '에게서', '에게로', '으로의', '에는', '에서', '에게', '한테', '까지', '부터', '마저', '조차', '보다', '처럼', '같이', '라도', '이나', '밖에', '으로', '이며', '이고', '이라', '이야', '마다', '에도', '였다', '이가', '보다', '하고', '랑', '과', '와', '은', '는', '이', '가', '을', '를', '에', '의', '로', '도', '만', '요'].sort((a, b) => b.length - a.length);
const EOMIS = ['해버렸다', '되어버렸다', '했습니다', '됐습니다', '됩니다', '시켰다', '하다가', '했다가', '했다는', '했다며', '했다고', '했지만', '했는데', '한다는', '된다는', '한다고', '된다고', '하는거', '되는거', '하면서', '시키며', '시키면', '합니다', '할수', '될수', '같음', '같다', '했다', '됐다', '왔다', '갔다', '해서', '하면', '된다', '한다', '하는', '되는', '있는', '없는', '치켜', '시켜', '했음', '됐음', '느냐', '나요', '네요', '군요', '고요', '라고', '다고', '냐고', '자고', '는지', '길래', '커녕', '던데', '든가', '라도', '거나', '도록', '으며', '면서', '아서', '어서', '해서', '했고', '하며', '하면', '한다', '됐다', '된다', 'ㄴ다', 'ㄴ가', 'ㄹ까', 'ㄹ게', 'ㄹ지', 'ㅂ니다', '습니까', '려니', '아든', '어든', '이든', '고든', '고서', '아서', '어서'].sort((a, b) => b.length - a.length);

class KoreanNLP {
    constructor() {
        this.stopwords = new Set(DEFAULT_STOPWORDS);
        this.dictionary = new Set(DEFAULT_DICTIONARY);
        this.loadFeedback();
    }

    /**
     * 2단계: 사용자 피드백 로드 (data/nlp_feedback.json)
     */
    loadFeedback() {
        const feedbackPath = path.join(__dirname, '..', '..', 'data', 'nlp_feedback.json');
        try {
            if (fs.existsSync(feedbackPath)) {
                const feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
                if (feedback.stopwords) feedback.stopwords.forEach(s => this.stopwords.add(s));
                if (feedback.dictionary) feedback.dictionary.forEach(d => this.dictionary.add(d));
                console.log(`[KoreanNLP] 사용자 피드백 로드 완료: 불용어 ${feedback.stopwords?.length || 0}개, 사전 ${feedback.dictionary?.length || 0}개`);
            }
        } catch (e) {
            console.warn('[KoreanNLP] 피드백 로드 실패:', e.message);
        }
    }

    hasJongseong(ch) {
        const code = ch.charCodeAt(0) - 0xAC00;
        return code >= 0 && code <= 11171 && (code % 28) !== 0;
    }

    isVerbConnector(word) {
        if (word.length < 2) return false;
        const last = word[word.length - 1];
        const prev = word[word.length - 2];
        if (last === '고' && this.hasJongseong(prev) && word.length >= 3) return true;
        if (last === '든' && word.length >= 3) return true;
        return false;
    }

    isNoise(word) {
        return !word || word.length < 2 || this.stopwords.has(word) || BANNED_STEMS.has(word) || isNaN(Number(word)) === false || /^\d+[a-zA-Z가-힣]+$/.test(word) || (!this.dictionary.has(word) && this.isVerbConnector(word));
    }

    /**
     * 재귀적 복합명사 분해 (Step 1+)
     */
    recursiveDecompose(word) {
        if (word.length <= 3 || this.dictionary.has(word)) return [word];
        
        for (let i = word.length - 1; i >= 2; i--) {
            const left = word.slice(0, i);
            const right = word.slice(i);
            if (this.dictionary.has(left)) {
                return [left, ...this.recursiveDecompose(right)];
            }
        }
        return [word];
    }

    extractNouns(text) {
        let cleanText = text.replace(/\[.*?\]/g, ' ').replace(/\(.*?\)/g, ' ').replace(/[^\w가-힣\s]/g, ' ').replace(/\s+/g, ' ');
        const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 0);
        let results = [];

        rawWords.forEach((originalWord, index) => {
            let word = originalWord;
            if (/^\d+[월일위개층회분초]$/.test(word)) return;
            if (this.isNoise(word)) return;

            // 최장 일치 접미사 제거
            let trimmed = true;
            while (trimmed && word.length > 1) {
                trimmed = false;
                for (let suffix of [...EOMIS, ...JOSAS]) {
                    if (word.endsWith(suffix)) {
                        const stem = word.slice(0, word.length - suffix.length);
                        if (stem.length > 0 && !this.isNoise(stem)) {
                            word = stem;
                            trimmed = true;
                            break;
                        } else if (this.isNoise(stem)) {
                            word = '';
                            trimmed = false;
                            break;
                        }
                    }
                }
            }

            if (word.endsWith('했') || word.endsWith('됐')) word = word.slice(0, -1);

            if (!this.isNoise(word)) {
                // 재귀적 분해 시도
                const decomposed = this.recursiveDecompose(word);
                decomposed.forEach(w => {
                    if (!this.isNoise(w)) {
                        results.push({
                            text: w,
                            isFirst: index === 0 // 3단계: 문두 위치 여부
                        });
                    }
                });
            }
        });
        return results;
    }

    /**
     * 3단계: 맥락 기반 가중치 적용 주파수 계산
     */
    getTrendScores(texts) {
        const scores = {};
        const docCounts = {};

        texts.forEach(text => {
            const nouns = this.extractNouns(text);
            const uniqueNouns = new Set(nouns.map(n => n.text));

            nouns.forEach(n => {
                // 문두 가중치 1.5, 일반 1.0
                const weight = n.isFirst ? 1.5 : 1.0;
                scores[n.text] = (scores[n.text] || 0) + weight;
            });

            uniqueNouns.forEach(n => {
                docCounts[n] = (docCounts[n] || 0) + 1;
            });
        });

        // 불용어 및 과잉 출현 단어(15% 이상) 제거
        const threshold = Math.max(3, texts.length * 0.15);
        for (const word in scores) {
            if (docCounts[word] > threshold || this.stopwords.has(word)) {
                delete scores[word];
            }
        }

        return scores;
    }
}

module.exports = new KoreanNLP(); // 싱글톤 인스턴스
