"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

export default function MindmapPage() {
    const [words, setWords] = useState<{ text: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/trendingrankings/data/mindmap.json')
            .then(res => res.json())
            .then(data => { setWords(data.sort((a: any, b: any) => b.value - a.value).slice(0, 15)); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const colors = [
        "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
        "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
        "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
    ];

    const maxVal = words.length > 0 ? words.reduce((max, w) => Math.max(max, w.value), 1) : 1;
    const minVal = words.length > 0 ? words.reduce((min, w) => Math.min(min, w.value), maxVal) : 0;

    const SVG_SIZE = 800;
    const CENTER = SVG_SIZE / 2;
    const CENTER_SIZE = 140;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Head><title>커뮤니티 트렌드 마인드맵</title></Head>

            <header style={{ flexShrink: 0, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">
                    🔥 실시간 커뮤니티 트렌드
                </h1>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', minHeight: 0 }}>
                {loading ? (
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                ) : words.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>아직 추출된 키워드 데이터가 없습니다.</p>
                ) : (
                    <svg
                        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                        style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {words.map((w, idx) => {
                            const isInner = idx < 6;
                            const totalInRing = isInner ? 6 : (words.length - 6);
                            const ringIdx = isInner ? idx : (idx - 6);
                            const distance = isInner ? 180 : 320;
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[w.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
                            return <line key={`line-${idx}`} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={color} strokeWidth={isInner ? 4 : 2} strokeOpacity={0.5} />;
                        })}

                        <circle cx={CENTER} cy={CENTER} r={CENTER_SIZE / 2} fill="#0f172a" stroke="#334155" strokeWidth={6} />
                        <text x={CENTER} y={CENTER - 10} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={28} fontWeight={900}>HOT</text>
                        <text x={CENTER} y={CENTER + 22} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={28} fontWeight={900}>이슈</text>

                        {words.map((w, idx) => {
                            const ratio = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
                            const isInner = idx < 6;
                            const totalInRing = isInner ? 6 : (words.length - 6);
                            const ringIdx = isInner ? idx : (idx - 6);
                            const baseSize = isInner ? 100 : 70;
                            const nodeSize = baseSize + (ratio * (isInner ? 30 : 20));
                            const fontSize = isInner ? (18 + ratio * 8) : (14 + ratio * 6);
                            const distance = isInner ? 180 : 320;
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[w.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
                            const r = nodeSize / 2;
                            return (
                                <g key={`bubble-${idx}`}>
                                    <circle cx={x} cy={y} r={r} fill={color} stroke="#0f172a" strokeWidth={4} />
                                    <text x={x} y={y - 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={fontSize} fontWeight={900}>{w.text}</text>
                                    <text x={x} y={y + fontSize * 0.9} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.85)" fontSize={13} fontWeight={700}>{w.value}회</text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
        </div>
    );
}
