import RankingCard from '@/components/RankingCard';
import { getAllRankings } from '@/lib/ranking';

export default async function Home() {
  const sources = await getAllRankings();

  return (
    <main>
      <h1>Real-time Trending</h1>
      <p className="subtitle">Discover what's happening now across major portals</p>

      <div className="grid">
        {sources.map((source, index) => (
          <RankingCard key={index} source={source} />
        ))}
      </div>
    </main>
  );
}
