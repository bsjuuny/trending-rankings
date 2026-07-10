const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GENERAL_STOPWORDS = [
  '오늘', '내일', '어제', '최근', '이번', '지난', '현재', '관련', '기사', '뉴스',
  '영상', '사진', '게시글', '댓글', '사람', '정도', '경우', '이유', '내용', '모습',
  '공개', '출시', '진행', '발표', '확인', '참여', '방법', '추가', '변경', '주의',
  '시작', '종료', '결과', '상황', '정보', '문제', '시간', '기간', '이벤트',
  '추천', '비추천', '실시간', '온라인', '오프라인', '공식', '단독', '속보',
  '국내', '해외', '글로벌', '오늘의', '이번주', '지난주', '이미지', '본문',
  '더보기', '보내기', '출처', '기자', '조회수', '게시판', '공지', '링크',
  'jpg', 'jpeg', 'png', 'gif', 'webp',
];

const QUALITY_STOPWORDS = [
  '있다', '있는', '있음', '있네요', '있습니다', '없다', '없는', '없음', '합니다',
  '했다', '한다', '된다', '됐다', '하는', '되는', '하면', '해서', '되어', '하고',
  '요즘', '지금', '여전히', '최대', '최소', '최신', '신규', '전체', '모든',
  '계획', '가격', '인하', '인상', '할인', '무료', '배송', '구매', '사용',
  '후기', '질문', '답변', '정리', '업데이트', '오픈', '마감', '예정', '가능',
  '필수', '꿀팁', '비교', '리뷰', '모음', '순위', '목록', '보기', '오브',
  '일정', '관심', '있네', '있나', '있을까', '중입니다', '저렴한', '오는',
  '페이지', '버전', '진짜', '파는', '좋네', '가다듬', '마트', '한국',
  '안내', '서비스', '완성', '인터뷰', '선생', '제거', '속도', '장사', '상품',
  '네이버', '쇼핑', '라이브', '운용', '개미', '배정',
  '대한', '위한', '때문', '그리고', '그러나', '하지만', '그래서', '이라며',
];

const FINANCE_STOPWORDS = [
  '경제', '시장', '증시', '주식', '종목', '기업', '투자', '투자자', '매수', '매도',
  '상승', '하락', '강세', '약세', '전망', '분석', '코스피', '코스닥', '증권',
  '거래량', '상한가', '하한가', '특징주', '테마주', '관련주', '공모주', '청약',
  '상장', '공시', '실적', '영업이익', '순이익', '매출', '금리', '환율', '채권',
  '선물', '옵션', 'ETF', 'ETN', 'KODEX', 'TIGER', 'ACE', 'KBSTAR', 'SOL', 'KOSEF',
  '인버스', '레버리지',
];

const DEFAULT_STOPWORDS = new Set([
  ...GENERAL_STOPWORDS,
  ...QUALITY_STOPWORDS,
  ...FINANCE_STOPWORDS,
]);

const DEFAULT_DICTIONARY = new Set([
  '삼성전자', 'SK하이닉스', 'LG전자', '현대차', '기아', '네이버', '카카오',
  '두산에너빌리티', '한화에어로스페이스', '셀트리온', '알테오젠', '에코프로',
  '티웨이홀딩스', '한온시스템', '대우건설', '삼화전자', '광전자', '흥아해운',
  '로봇', '반도체', 'AI반도체', '배터리', '전기차', '인공지능', 'AI', '데이터센터',
  '원전', '조선', '방산', '바이오', '화장품', '게임', '콘텐츠', '웹툰',
  '쿠팡', '다이소', '올리브영', '무신사', '스타벅스', '메가커피', '알리',
  '아이폰', '갤럭시', '맥북', '아이패드', '플레이스테이션', '닌텐도',
  '게이밍', '모니터', '마우스', '키보드', '케이블', '맥세이프', '케이스',
  '손톱깎이', '데카트론', '9800X3D', 'USB-C', 'ASUS', 'CBT',
  '스페이스X', '공모청약', '레몬헬스케어', '빅웨이브로보틱스', '스트라드비젼',
  '마키나락스', '메리츠스팩2호', '미래에셋', '신한스팩',
]);

const COMPOUND_ALIASES = new Map([
  ['공모 청약', '공모청약'],
  ['에스 케이 하이닉스', 'SK하이닉스'],
  ['sk 하이닉스', 'SK하이닉스'],
  ['에이아이 반도체', 'AI반도체'],
  ['ai 반도체', 'AI반도체'],
  ['스페이스 x', '스페이스X'],
  ['맥 세이프', '맥세이프'],
]);

const KIWI_SCRIPT = path.join(__dirname, 'kiwi_nlp.py');

const POSTPOSITIONS = [
  '으로부터', '로부터', '에게서', '에서도', '에서는', '으로써', '으로서', '이라서',
  '라서', '에게', '한테', '께서', '에서', '으로', '부터', '까지', '보다', '처럼',
  '만큼', '하고', '이며', '라며', '이라며', '라는', '이라는', '라고', '이라고',
  '부터는', '까지는', '에서는', '에도', '에는', '으로는', '로는', '은', '는',
  '이', '가', '을', '를', '에', '의', '와', '과', '도', '만', '로',
].sort((a, b) => b.length - a.length);

const VERB_ENDINGS = [
  '했습니다', '하였습니다', '합니다', '됩니다', '됐습니다', '되었습니다', '이었다',
  '합니다만', '했다는', '한다는', '됐다는', '했다며', '한다며', '되면서', '하면서',
  '했습니다만', '했습니다가', '있습니다', '없습니다', '입니다', '였다', '했다',
  '한다', '된다', '됐다', '있는', '없는', '하며', '하고', '되는', '하는', '하면',
  '되어', '해서', '어요', '아요', '예요', '에요', '네요', '군요', '죠', '요',
].sort((a, b) => b.length - a.length);

const TOKEN_PATTERN = /[가-힣A-Za-z0-9][가-힣A-Za-z0-9+.#&-]{1,}/g;
const HANGUL_PATTERN = /[가-힣]/;
const CLEANUP_PATTERN = /(\[[^\]]*\]|\([^)]*\)|https?:\/\/\S+|www\.\S+)/g;

function normalizeToken(token) {
  return String(token || '')
    .normalize('NFKC')
    .replace(/[“”"']/g, '')
    .replace(/^[^\w가-힣]+|[!?.,;:~…·ㆍ/\\|()[\]{}<>]+$/g, '')
    .trim();
}

function normalizeText(text) {
  let normalized = String(text || '').normalize('NFKC').replace(CLEANUP_PATTERN, ' ');
  for (const [from, to] of COMPOUND_ALIASES) {
    normalized = normalized.replace(new RegExp(from, 'gi'), to);
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

class KoreanNLP {
  constructor() {
    this.stopwords = new Set(DEFAULT_STOPWORDS);
    this.dictionary = new Set(DEFAULT_DICTIONARY);
    this.sourceWeights = {
      title: 1.5,
      community: 1.2,
      news: 1.3,
      stock: 1.6,
      ipo: 1.4,
      global: 1.1,
      default: 1.0,
    };
    this.loadFeedback();
  }

  loadFeedback() {
    const feedbackPath = path.join(__dirname, '..', '..', 'data', 'nlp_feedback.json');
    try {
      if (!fs.existsSync(feedbackPath)) return;
      const feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));

      for (const word of feedback.stopwords || []) {
        if (typeof word === 'string' && word.trim()) this.stopwords.add(word.trim());
      }
      for (const word of feedback.dictionary || []) {
        if (typeof word === 'string' && word.trim()) this.dictionary.add(word.trim());
      }
      if (feedback.sourceWeights && typeof feedback.sourceWeights === 'object') {
        this.sourceWeights = { ...this.sourceWeights, ...feedback.sourceWeights };
      }

      console.log(`[KoreanNLP] feedback loaded: stopwords=${feedback.stopwords?.length || 0}, dictionary=${feedback.dictionary?.length || 0}`);
    } catch (err) {
      console.warn(`[KoreanNLP] feedback load failed: ${err.message}`);
    }
  }

  stripSuffix(token) {
    let word = normalizeToken(token);
    let changed = true;

    while (changed && word.length > 2 && !this.dictionary.has(word)) {
      changed = false;
      for (const suffix of [...POSTPOSITIONS, ...VERB_ENDINGS]) {
        if (!word.endsWith(suffix)) continue;
        const stem = word.slice(0, -suffix.length);
        if (stem.length >= 2 && !/^\d+$/.test(stem)) {
          word = stem;
          changed = true;
          break;
        }
      }
    }

    return word;
  }

  isNoise(token) {
    const word = normalizeToken(token);
    if (word.length < 2 || word.length > 28) return true;
    if (this.stopwords.has(word)) return true;
    if (/^\d+$/.test(word)) return true;
    if (/^\d+(개|명|원|억|조|분|시|일|월|년|회|주|kg|g|GB|TB|%|퍼센트)$/i.test(word)) return true;
    if (/^[A-Za-z]$/.test(word)) return true;
    if (/^[가-힣][은는이가을를]$/.test(word)) return true;
    if (!HANGUL_PATTERN.test(word) && word.length < 3) return true;
    if (/TOP\d+/i.test(word)) return true;
    if (/^(the|and|for|with|from|into|over|under|sale)$/i.test(word)) return true;
    if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(word)) return true;
    if (/^[가-힣]{2,3}(하다|한다|했다|된다|됐다)$/.test(word)) return true;
    if (/^(그리고|그러나|하지만|그래서|때문|관련|대한|위한)$/.test(word)) return true;
    return false;
  }

  extractNouns(text, options = {}) {
    const source = options.source || 'default';
    const cleanText = normalizeText(text);
    const matches = cleanText.match(TOKEN_PATTERN) || [];
    const tokens = [];

    matches.forEach((raw, index) => {
      const word = this.stripSuffix(raw);
      if (this.isNoise(word)) return;

      tokens.push({
        text: word,
        isFirst: index === 0,
        source,
        inDictionary: this.dictionary.has(word),
      });
    });

    return tokens;
  }

  analyzeWithKiwi(texts) {
    if (!fs.existsSync(KIWI_SCRIPT)) return null;

    const python = process.env.KOREAN_NLP_PYTHON || 'python';
    const payload = {
      texts: texts.map((item) => String(typeof item === 'string' ? item : item?.text || '')),
      dictionary: [...this.dictionary],
      aliases: Object.fromEntries(COMPOUND_ALIASES),
    };

    const result = spawnSync(python, [KIWI_SCRIPT], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
      maxBuffer: 1024 * 1024 * 16,
      windowsHide: true,
    });

    if (result.status !== 0 || !result.stdout) {
      if (!this._kiwiWarned) {
        const message = (result.stderr || result.error?.message || 'unknown error').trim();
        console.warn(`[KoreanNLP] Kiwi unavailable, falling back to rule tokenizer: ${message}`);
        this._kiwiWarned = true;
      }
      return null;
    }

    try {
      const parsed = JSON.parse(result.stdout);
      if (!Array.isArray(parsed.documents)) return null;
      return parsed.documents;
    } catch (err) {
      if (!this._kiwiWarned) {
        console.warn(`[KoreanNLP] Kiwi output parse failed, falling back to rule tokenizer: ${err.message}`);
        this._kiwiWarned = true;
      }
      return null;
    }
  }

  getTrendScores(texts, options = {}) {
    const scores = {};
    const docCounts = {};
    const source = options.source || 'default';
    const sourceWeight = Number(this.sourceWeights[source] || this.sourceWeights.default || 1);
    const inputTexts = Array.isArray(texts) ? texts : [];
    const kiwiDocuments = options.useKiwi === false ? null : this.analyzeWithKiwi(inputTexts);

    for (const [docIndex, item] of inputTexts.entries()) {
      const text = typeof item === 'string' ? item : item?.text;
      const itemSource = typeof item === 'string' ? source : item?.source || source;
      const itemSourceWeight = Number(this.sourceWeights[itemSource] || sourceWeight);
      const nouns = kiwiDocuments
        ? kiwiDocuments[docIndex].map((token, index) => ({
          text: this.stripSuffix(token),
          isFirst: index === 0,
          source: itemSource,
          inDictionary: this.dictionary.has(this.stripSuffix(token)),
        })).filter((token) => !this.isNoise(token.text))
        : this.extractNouns(text, { source: itemSource });
      const unique = new Set();

      for (const noun of nouns) {
        const firstWeight = noun.isFirst ? 1.25 : 1.0;
        const dictionaryWeight = noun.inDictionary ? 1.35 : 1.0;
        const lengthWeight = noun.text.length >= 4 ? 1.08 : 1.0;
        const weight = firstWeight * dictionaryWeight * lengthWeight * itemSourceWeight;

        scores[noun.text] = (scores[noun.text] || 0) + weight;
        unique.add(noun.text);
      }

      for (const noun of unique) {
        docCounts[noun] = (docCounts[noun] || 0) + 1;
      }
    }

    const totalDocs = Array.isArray(texts) ? texts.length : 0;
    const tooCommonThreshold = Math.max(8, totalDocs * 0.35);

    for (const word of Object.keys(scores)) {
      if (this.stopwords.has(word) || docCounts[word] > tooCommonThreshold) {
        delete scores[word];
        continue;
      }

      const documentFrequencyBoost = Math.min(1.35, 1 + Math.max(0, docCounts[word] - 1) * 0.08);
      scores[word] = Math.round(scores[word] * documentFrequencyBoost * 10) / 10;
    }

    return scores;
  }
}

module.exports = new KoreanNLP();
