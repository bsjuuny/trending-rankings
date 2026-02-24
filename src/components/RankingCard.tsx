import Link from 'next/link';
import { RankingSource } from '@/lib/ranking';
import CacheTimer from './CacheTimer';

interface RankingCardProps {
    source: RankingSource;
}

export default function RankingCard({ source }: RankingCardProps) {
    return (
        <div className="card">
            <h2>
                <span className="source-icon">🔥</span>
                {source.title}
                <CacheTimer />
            </h2>
            <ul className="ranking-list">
                {source.items.length > 0 ? (
                    source.items.map((item) => (
                        <li key={item.rank} className="ranking-item">
                            <span className="rank-number">{item.rank}</span>
                            <Link href={item.link} target="_blank" className="keyword">
                                {item.keyword}
                            </Link>
                            <span className="external-icon">↗</span>
                        </li>
                    ))
                ) : (
                    <li className="ranking-item" style={{ color: '#555' }}>
                        데이터를 불러올 수 없습니다.
                    </li>
                )}
            </ul>
        </div>
    );
}
