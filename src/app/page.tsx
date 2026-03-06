import RankingCard from '@/components/RankingCard';
import { getAllRankings } from '@/lib/ranking';
import DonationPopup from '@/components/DonationPopup';

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
      <p style={{ fontSize: '0.9rem', color: '#0070f3', textAlign: 'center', marginBottom: '2rem', fontWeight: '500' }}>
        최근 업데이트: {buildTime}
      </p>

      <div className="grid">
        {sources.map((source, index) => (
          <RankingCard key={index} source={source} />
        ))}
      </div>
      <DonationPopup />
    </main>
  );
}
