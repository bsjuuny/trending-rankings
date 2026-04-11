'use client';

import { useEffect, useState } from 'react';
import RankingCard from './RankingCard';
import { RankingSource, RankingItem } from '@/lib/ranking';
import { fetchSignalData } from '@/lib/api';

interface RealTimeRankingProps {
    initialData: { domestic: RankingSource[], overseas: RankingSource[] };
}

export default function RealTimeRanking({ initialData }: RealTimeRankingProps) {
    const [activeTab, setActiveTab] = useState<'domestic' | 'overseas'>('domestic');
    const [sources, setSources] = useState<RankingSource[]>(initialData.domestic);
    const [signalLoading, setSignalLoading] = useState(true);

    // 탭 전환 처리
    useEffect(() => {
        setSources(activeTab === 'domestic' ? initialData.domestic : initialData.overseas);
    }, [activeTab, initialData]);

    useEffect(() => {
        if (typeof window === 'undefined' || activeTab !== 'domestic') return;

        const updateSignal = async () => {
            try {
                const data = await fetchSignalData();
                if (!data || !data.top10) return;
                const items: RankingItem[] = data.top10.map((item: { rank: number; keyword: string }) => ({
                    rank: item.rank,
                    keyword: item.keyword,
                    link: `https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`,
                }));

                const newSignalSource: RankingSource = { title: 'Signal.bz', items };

                setSources(prev => prev.map(s =>
                    s.title.includes('Signal.bz') ? newSignalSource : s
                ));
            } catch (error) {
                console.error('Failed to fetch live Signal data:', error);
            } finally {
                setSignalLoading(false);
            }
        };

        updateSignal();
    }, [activeTab]);

    return (
        <div className="w-full flex flex-col gap-8">
            {/* 프리미엄 슬라이딩 탭 내비게이션 */}
            <div className="flex justify-center mb-8">
                <div className="relative p-1.5 bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center overflow-hidden">
                    {/* 슬라이딩 인디케이터 */}
                    <div 
                        className={`absolute top-1.5 bottom-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-xl shadow-lg ${
                            activeTab === 'domestic' 
                            ? 'left-1.5 w-[calc(50%-6px)] bg-gradient-to-br from-blue-500 to-indigo-700' 
                            : 'left-[calc(50%+3px)] w-[calc(50%-6px)] bg-gradient-to-br from-purple-500 to-rose-700'
                        }`}
                    >
                        <div className="absolute inset-0 bg-white/10 rounded-xl blur-[1px]"></div>
                    </div>

                    <button 
                        onClick={() => setActiveTab('domestic')}
                        className={`relative z-10 px-10 py-3.5 rounded-xl font-black text-sm transition-all duration-500 flex items-center gap-3 min-w-[180px] justify-center ${
                            activeTab === 'domestic' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <span className={`text-xl transition-transform duration-500 ${activeTab === 'domestic' ? 'scale-125' : 'grayscale opacity-50'}`}>🇰🇷</span>
                        <span className="tracking-widest">KOREA</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('overseas')}
                        className={`relative z-10 px-10 py-3.5 rounded-xl font-black text-sm transition-all duration-500 flex items-center gap-3 min-w-[180px] justify-center ${
                            activeTab === 'overseas' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <span className={`text-xl transition-transform duration-500 ${activeTab === 'overseas' ? 'scale-125' : 'grayscale opacity-50'}`}>🌎</span>
                        <span className="tracking-widest">GLOBAL</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                {sources.map((source, index) => {
                    const isSignal = source.title.includes('Signal.bz');
                    const showSkeleton = isSignal && signalLoading;

                    return (
                        <div key={`${activeTab}-${source.title}`} style={{ animationDelay: `${index * 0.1}s` }} role="listitem" tabIndex={0}>
                            <div className="relative">
                                {showSkeleton ? (
                                    <SignalSkeleton />
                                ) : (
                                    <RankingCard source={source} />
                                )}
                            </div>
                        </div>
                    );
                })}
                {sources.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        데이터를 불러오는 중이거나 수집된 트렌드가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}

function SignalSkeleton() {
    return (
        <div className="card">
            <h2>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm" style={{ color: '#48BB78' }}>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                </div>
                Signal.bz
                <span style={{ fontSize: '0.7rem', color: '#48BB78', marginLeft: '0.5rem', opacity: 0.8 }}>실시간 로딩중…</span>
            </h2>
            <ul className="ranking-list">
                {Array.from({ length: 10 }).map((_, i) => (
                    <li key={i} className="ranking-item" style={{ gap: '0.75rem' }}>
                        <span className="rank-number" style={{ opacity: 0.3 }}>{i + 1}</span>
                        <div className="skeleton-bar" style={{
                            flex: 1,
                            height: '1rem',
                            borderRadius: '0.375rem',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                        }} />
                    </li>
                ))}
            </ul>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
