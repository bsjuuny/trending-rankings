'use client';

import { useEffect, useState } from 'react';
import RankingCard from './RankingCard';
import { RankingSource, RankingItem } from '@/lib/ranking';
import { fetchSignalData } from '@/lib/api';

interface RealTimeRankingProps {
    initialSources: RankingSource[];
}

export default function RealTimeRanking({ initialSources }: RealTimeRankingProps) {
    const [sources, setSources] = useState<RankingSource[]>(initialSources);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const updateSignal = async () => {
            try {
                const data = await fetchSignalData();
                const items: RankingItem[] = data.top10.map((item: any) => ({
                    rank: item.rank,
                    keyword: item.keyword,
                    link: `https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`,
                }));

                const newSignalSource: RankingSource = { title: 'Signal.bz', items };

                setSources(prev => prev.map(s =>
                    s.title.includes('Signal.bz') ? newSignalSource : s
                ));
                setIsLive(true);
            } catch (error) {
                console.error('Failed to fetch live Signal data:', error);
            }
        };

        // 브라우저 환경에서만 실행 (Next.js export 시점에는 실행되지 않음)
        if (typeof window !== 'undefined') {
            // 약간의 지연을 주어 정적 데이터가 먼저 보이게 함 (UX)
            const timer = setTimeout(updateSignal, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="grid">
            {sources.map((source, index) => (
                <div key={source.title} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative">
                        <RankingCard source={source} />
                        {source.title.includes('Signal.bz') && isLive && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
