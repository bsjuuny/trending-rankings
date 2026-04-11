"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

export default function MindmapPage() {
    const [words, setWords] = useState<{ text: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('../data/mindmap.json')
            .then(res => res.json())
            .then(data => { 
                setWords(data.sort((a: any, b: any) => b.value - a.value).slice(0, 25)); 
                setLoading(false); 
            })
            .catch(() => setLoading(false));
    }, []);

    const colors = [
        "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80",
        "#2dd4bf", "#22d3ee", "#38bdf8", "#60a5fa", "#818cf8",
        "#a78bfa", "#c084fc", "#f472b6", "#fb7185"
    ];

    const maxVal = words.length > 0 ? words.reduce((max, w) => Math.max(max, w.value), 1) : 1;
    const minVal = words.length > 0 ? words.reduce((min, w) => Math.min(min, w.value), maxVal) : 0;

    const SVG_SIZE = 1000;
    const CENTER = SVG_SIZE / 2;
    const CENTER_SIZE = 160;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#020617', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Head><title>COMMUNITY TRENDS</title></Head>

            <header style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 0' }}>
                <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl">
                    🔥 실시간 커뮤니티 트렌드
                </h1>
                <p className="text-slate-400 font-medium tracking-wide">
                    국내 주요 온라인 커뮤니티에서 가장 많이 언급되는 키워드
                </p>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: 0 }}>
                {loading ? (
                    <div className="w-16 h-16 border-4 border-white/20 border-t-rose-500 rounded-full animate-spin" />
                ) : words.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '1.2rem' }}>데이터를 불러올 수 없습니다.</p>
                ) : (
                    <svg
                        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                        style={{ width: '100%', height: '100%', maxWidth: '90vh', display: 'block' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {words.map((w, idx) => {
                            const isInner = idx < 6;
                            const totalInRing = isInner ? 6 : (words.length - 6);
                            const ringIdx = isInner ? idx : (idx - 6);
                            const distance = isInner ? 250 : 420; // 거리 대폭 확대
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[idx % colors.length];
                            return <line key={`line-${idx}`} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={color} strokeWidth={isInner ? 2 : 1} strokeOpacity={0.2} />;
                        })}

                        <circle cx={CENTER} cy={CENTER} r={CENTER_SIZE / 2} fill="#020617" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
                        <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={32} fontWeight={900}>TREND</text>

                        {words.map((w, idx) => {
                            const ratio = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
                            const isInner = idx < 6;
                            const totalInRing = isInner ? 6 : (words.length - 6);
                            const ringIdx = isInner ? idx : (idx - 6);
                            const baseSize = isInner ? 160 : 120; // 버블 크기도 약간 확대
                            const nodeSize = baseSize + (ratio * 40);
                            const fontSize = isInner ? (18 + ratio * 6) : (14 + ratio * 4);
                            const distance = isInner ? 250 : 420;
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[idx % colors.length];
                            const r = nodeSize / 2;
                            
                            return (
                                <g key={`bubble-${idx}`} className="cursor-default text-white">
                                    <circle cx={x} cy={y} r={r} fill={color} stroke="#020617" strokeWidth={3} className="drop-shadow-lg" />
                                    <text x={x} y={y - 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={fontSize} fontWeight={900} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                        {w.text.length > 10 ? w.text.substring(0, 9) + '..' : w.text}
                                    </text>
                                    <text x={x} y={y + fontSize * 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.8)" fontSize={12} fontWeight={700}>
                                        {w.value}회
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
        </div>
    );
}
