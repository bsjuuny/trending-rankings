# Trending Rankings

커뮤니티 이슈·증권사 검색어·실시간 트렌드를 모아 "얼마나 핫한가"를 점수화하고 마인드맵으로
보여주는 서비스. 텔레그램 요약 발송도 겸한다.

Next.js 16 (App Router, static export) + React 19 + Tailwind CSS 4, 수집은 fetch + cheerio.

## 명령어

| 명령 | 역할 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run collect:all` | 6개 수집기 순차 실행 (community, stocks, ipo, global, daiso, digital) |
| `npm run generate` | 수집 데이터로 텔레그램용 요약 생성 (`summary_main.txt`, `summary_buzz.txt`) |
| `npm run generate -- --send` | 요약 생성 + 텔레그램 발송 |
| `npm run build` | `collect:all` 후 `next build` (정적 export → `out/`) |
| `npm run build:push` | build 후 산출물 git add/commit/push |
| `npm run lint` | ESLint |

한국어 형태소 분석에 Python이 필요하다: `pip install -r requirements.txt` (kiwipiepy).

## 구조

- `scripts/collect-*.js` — 소스별 크롤러. 광고성 키워드 필터는 각 파일 안에 개별로 들어 있다.
- `scripts/generate-summary.js` — 요약 생성 + 텔레그램 발송
- `scripts/utils/daum-trends.js` — Daum 실시간 트렌드 (`src/lib/daum-trends.ts`와 동일 로직 사본)
- `scripts/utils/lenient-json.js` — 제어문자 섞인 피드용 관용 JSON 파서 (`src/lib/lenient-json.ts` 사본)
- `scripts/utils/korean-nlp.js`, `scripts/utils/kiwi_nlp.py` — 형태소 분석
- `src/lib/ranking.ts` — 웹 화면용 수집. `scripts/`와 소스별 함수가 **중복**되어 있어 한쪽만 고치면 안 된다.
- `src/components/RealTimeRanking.tsx`, `RankingCard.tsx` — 마인드맵/랭킹 시각화
- `public/data/*.json` — 웹 출력용 수집 결과

## 배포·스케줄링

Cafe24로 FTP 배포된다 (`.github/workflows/deploy.yml`, basePath `/trendingrankings`).
정기 실행은 이 저장소가 아니라 **별도 저장소 `C:/github/scheduler`** 의
`cron-trending-rankings.mjs` + Windows Task Scheduler가 담당한다. 여기에 크론을 새로 만들 필요 없음.

## 수집이 안 될 때

각 수집 함수는 예외를 삼키고 `'데이터를 가져올 수 없습니다.'` 로 조용히 폴백한다.
요약에 그 문구가 보이면 해당 소스의 셀렉터나 엔드포인트가 바뀐 것이므로,
`fetch` 로 원본을 받아 마커 문자열이 아직 있는지부터 실측한다.
