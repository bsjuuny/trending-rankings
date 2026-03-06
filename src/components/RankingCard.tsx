import Link from 'next/link';
import { RankingSource } from '@/lib/ranking';
import { Youtube, Search, ArrowUpRight, TrendingUp, Hash } from 'lucide-react';

interface RankingCardProps {
    source: RankingSource;
}

// 헬퍼: 소스 이름에 따른 아이콘 및 테마 반환
const getPlatformConfig = (title: string) => {
    const config = {
        'Google Trends': { icon: <Search className="w-5 h-5" />, color: '#4285F4' },
        'YouTube': { icon: <Youtube className="w-5 h-5" />, color: '#FF0000' },
        'Nate': { icon: <TrendingUp className="w-5 h-5" />, color: '#E53E3E' },
        'X (Twitter)': { icon: <Hash className="w-5 h-5" />, color: '#E2E8F0' },
    };

    // 패턴 매칭으로 찾기
    const match = Object.entries(config).find(([key]) => title.includes(key));
    return match ? match[1] : { icon: <TrendingUp className="w-5 h-5" />, color: '#8B5CF6' };
};

export default function RankingCard({ source }: RankingCardProps) {
    const platform = getPlatformConfig(source.title);

    return (
        <div className="card" style={{ '--card-border-hover': `${platform.color}80`, '--accent-glow': `${platform.color}40` } as React.CSSProperties}>
            <h2>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm" style={{ color: platform.color }}>
                    {platform.icon}
                </div>
                {source.title}
            </h2>
            <ul className="ranking-list">
                {source.items.length > 0 ? (
                    source.items.map((item) => (
                        <li key={item.rank} className="ranking-item group">
                            <span className="rank-number">{item.rank}</span>
                            <Link href={item.link} target="_blank" className="keyword group-hover:text-white">
                                {item.keyword}
                            </Link>
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 group-hover:text-white" />
                        </li>
                    ))
                ) : (
                    <li className="ranking-item" style={{ color: '#64748b', justifyContent: 'center', padding: '2rem 1rem' }}>
                        데이터를 불러올 수 없습니다
                    </li>
                )}
            </ul>
        </div>
    );
}
