import { getAllRankings } from '@/lib/ranking';
import DonationPopup from '@/components/DonationPopup';
import RealTimeRanking from '@/components/RealTimeRanking';

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
      <h1>Rapidly Rising Trend</h1>
      <p className="subtitle">주요 포털의 실시간 급상승 트렌드를 한눈에 파악하세요</p>
      <p className="update-time flex items-center justify-center gap-2">
        <span>최근 업데이트: {buildTime}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">Snapshot</span>
      </p>

      <RealTimeRanking initialSources={sources} />
      <div className="mt-16 flex justify-center w-full" style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0, animationDelay: '0.5s' }}>
        <DonationPopup />
      </div>
    </main>
  );
}
