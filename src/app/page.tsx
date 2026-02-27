import RankingCard from '@/components/RankingCard';
import { getAllRankings } from '@/lib/ranking';

export default async function Home() {
  const sources = await getAllRankings();

  // 정적 빌드 시점의 시간을 계산하여 한국 시간 기준으로 포맷팅
  const buildTime = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main>
      <h1>Real-time Trending</h1>
      <p className="subtitle">Discover what's happening now across major portals</p>
      <p className="info-text" style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '0.5rem' }}>
        ※ 데이터는 안정적인 제공을 위해 매시간 5분마다 최신 순위로 자동 갱신됩니다.
      </p>
      <p style={{ fontSize: '0.9rem', color: '#0070f3', textAlign: 'center', marginBottom: '2rem', fontWeight: '500' }}>
        최근 업데이트: {buildTime}
      </p>

      <div className="grid">
        {sources.map((source, index) => (
          <RankingCard key={index} source={source} />
        ))}
      </div>
    </main>
  );
}
