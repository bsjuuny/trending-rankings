import RankingCard from '@/components/RankingCard';
import { getAllRankings } from '@/lib/ranking';

export default async function Home() {
  const sources = await getAllRankings();

  return (
    <main>
      <h1>Real-time Trending</h1>
      <p className="subtitle">Discover what's happening now across major portals</p>
      <p className="info-text" style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
        ※ 데이터는 안정적인 제공을 위해 매시간 5분마다 최신 순위로 자동 갱신됩니다.
      </p>

      <div className="grid">
        {sources.map((source, index) => (
          <RankingCard key={index} source={source} />
        ))}
      </div>
    </main>
  );
}
