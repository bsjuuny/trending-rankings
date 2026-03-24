/**
 * 고급 형태소 분석기 (Heuristic 기반 100% JS NLP 엔진)
 * 외부 C++ 라이브러리(Mecab) 의존성 없이 독립적으로 구동 가능하도록 설계되었습니다.
 */

const STOPWORDS = new Set([
    // 일반 부사/대명사/감탄사
    '진짜', '오늘', '너무', '정말', '이거', '저거', '어떻게', '어떤', '무슨', '이런',
    '저런', '그리고', '이게', '내가', '근데', '뭐가', '그냥', '많이', '요즘', '다들', '지금', '약후',
    '아직', '벌써', '어제', '내일', '주말', '올해', '내년',
    '미친', '대박', '레전드', '진심', '아니', '이걸', '저걸', '왜케', '왜이렇게',
    
    // 무맥락 자주 나오는 동사성 명사 및 상투어
    '공개', '출시', '소개', '진행', '지난', '신규',
    '역대', '최근', '이유', '현재', '이번', '이후', '결과', '과연', '역시', '주의',
    '특징', '반응', '정도', '사진', '영상', '관련', '사실', '생각', '시간', '느낌',
    '경우', '오픈', '시작', '종료', '기념', '내용', '모습', '상황', '등장', '발표',
    '예정', '확인', '참여', '방법', '추가', '변경', '적용', '안내', '문제', '이유',
    
    // 주어/인칭/포괄적 명사
    '사람', '하루', '우리', '누가', '어디', '저희', '분들', '사람들', '자체', '자신',
    '부분', '하나', '둘다', '전부', '모두', '누군가', '누구', '무엇', '어느', '어느것',

    // 동사/형용사 변형 형태 (토큰화 실패로 잡히는 찌꺼기들)
    '있습니다', '있는', '하는', '에서', '으로', '하고', '같은', '대해', '대한', '위해',
    '관한', '없는', '합니다', '입니다', '할수', '될수', '같음', '같다', '했다', '왔다',
    '갔다', '해서', '하면', '하면서', '된다', '한다', '했다가', '한다고', '된다고',
    
    // 경제/주식/기타 범용 불용어
    '주식', '상장', '공모주', '주가', '투자', '매수', '매도', '수익', '시장', '기업'
]);

// 억울하게 조사가 잘리면 안 되는 고유명사나 일반명사 예외 사전
const EXCEPTIONS = new Set([
    '어린이', '고양이', '사나이', '지팡이', '원숭이', '호랑이', '거북이', '달팽이',
    '마늘', '하늘', '가을', '겨울', '오늘', '내일', '모레', '바늘', '연필', '지하철'
]);

class KoreanNLP {
    /**
     * 형태소 분석(명사 추출)
     */
    static extractNouns(text) {
        // 1. 영어/숫자/한글만 남기고 전부 띄어쓰기 1개로 치환 (특수기호, [단독] 등 괄호 날리기)
        let cleanText = text.replace(/\[.*?\]/g, ' ')
                            .replace(/[^\w가-힣\s]/g, ' ')
                            .replace(/\s+/g, ' ');

        const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 0);
        const nouns = [];

        // 다단계 조사/어미 제거 정규식 (가장 긴 것부터 제거하여 충돌 방지)
        const particles_4 = /((에서부터|으로부터|이라고도|까지만해도)$)/;
        const particles_3 = /((에서는|에서도|까지는|까지도|로부터|보다는|이라는|이라고|입니다|습니다)$)/;
        const particles_2 = /((은요|는요|이요|가요|을요|를요|에서|에게|한테|까지|부터|마저|조차|보다|처럼|같이|라도|이나|밖에|으로|로서|로써|이며|이고|이라|이야|하는|되는|있는|없는|할수|될수|한다|했다)$)/;
        const particles_1 = /((은|는|이|가|을|를|과|와|의|에|도|로|만|쯤|증)$)/;

        for (let w of rawWords) {
            // 예외 사전에 있는 단어면 훼손하지 않고 그대로 통과
            if (EXCEPTIONS.has(w)) {
                nouns.push(w);
                continue;
            }

            let word = w;
            let iter = 0;

            // 2. 조사/어미 꼬리 자르기 (재귀적으로 처리, 예: 에서부터 -> 에서 -> '')
            let prev;
            do {
                prev = word;
                if (word.length >= 5) word = word.replace(particles_4, '');
                if (word.length >= 4) word = word.replace(particles_3, '');
                if (word.length >= 3) word = word.replace(particles_2, '');
                if (word.length >= 2) word = word.replace(particles_1, '');
                iter++;
            } while (prev !== word && word.length > 1 && iter < 3);

            // 예외 사전에 파생되어 존재하는 단어인지 2차 검증
            if (EXCEPTIONS.has(word)) {
                nouns.push(word);
                continue;
            }

            // 3. 길이 & 불용어 & 순수 숫자 필터링
            if (word.length > 1 && !STOPWORDS.has(word) && isNaN(Number(word))) {
                nouns.push(word);
            }
        }

        return nouns;
    }

    /**
     * 문장 배열에서 복합적인 형태소 빈도수 집계
     */
    static getFrequencies(texts) {
        const counts = {};
        
        texts.forEach(t => {
            const nouns = this.extractNouns(t);
            nouns.forEach(n => {
                counts[n] = (counts[n] || 0) + 1;
            });
        });

        return counts;
    }
}

module.exports = KoreanNLP;
