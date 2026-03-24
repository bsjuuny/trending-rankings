"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

export default function StocksMindmapPage() {
    const [words, setWords] = useState<{ text: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [win, setWin] = useState({ w: 0, h: 0 });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const update = () => setWin({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener('resize', update);
        return () => { window.removeEventListener('resize', update); document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        fetch('/trendingrankings/data/mindmap_stocks.json')
            .then(res => res.json())
            .then(data => { setWords(data.sort((a: any, b: any) => b.value - a.value).slice(0, 16)); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const colors = [
        "#22c55e", "#16a34a", "#15803d", "#0ea5e9", "#0284c7",
        "#0369a1", "#06b6d4", "#0891b2", "#10b981", "#059669",
        "#3b82f6", "#2563eb", "#1d4ed8", "#84cc16", "#65a30d", "#4d7c0f"
    ];

    const maxVal = words.length > 0 ? words.reduce((max, w) => Math.max(max, w.value), 1) : 1;
    const minVal = words.length > 0 ? words.reduce((min, w) => Math.min(min, w.value), maxVal) : 0;

    const SVG_SIZE = 800;
    const CENTER = SVG_SIZE / 2;
    const CENTER_SIZE = 140;
    const HEADER_H = 56;

    const svgPx = win.w > 0 ? Math.min(win.w - 16, win.h - HEADER_H - 8) : 0;
    const svgLeft = win.w > 0 ? (win.w - svgPx) / 2 : 0;
    const svgTop = HEADER_H + (win.h - HEADER_H - svgPx) / 2;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#0f172a', overflow: 'hidden', color: 'white' }}>
            <Head><title>주식 트렌드 마인드맵</title></Head>

            <header style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, paddingTop: '10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10 }}>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                    📈 주식 트렌드 마인드맵
                </h1>
            </header>

            {loading || win.w === 0 ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : words.length === 0 ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#94a3b8' }}>아직 추출된 키워드 데이터가 없습니다.</p>
                </div>
            ) : (
                <svg
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                    style={{ position: 'absolute', left: svgLeft, top: svgTop, width: svgPx, height: svgPx, display: 'block' }}
                >
                    {words.map((w, idx) => {
                        const innerCount = words.length <= 8 ? Math.min(4, words.length) : 6;
                        const isInner = idx < innerCount;
                        const totalInRing = isInner ? innerCount : (words.length - innerCount);
                        const ringIdx = isInner ? idx : (idx - innerCount);
                        const distance = isInner ? 180 : 320;
                        const outerOffset = isInner ? 0 : (Math.PI / totalInRing);
                        const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2) + outerOffset;
                        const x = CENTER + Math.cos(theta) * distance;
                        const y = CENTER + Math.sin(theta) * distance;
                        const color = colors[w.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
                        return <line key={`line-${idx}`} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke={color} strokeWidth={isInner ? 4 : 2} strokeOpacity={0.5} />;
                    })}

                    <foreignObject x={CENTER - CENTER_SIZE/2} y={CENTER - CENTER_SIZE/2} width={CENTER_SIZE} height={CENTER_SIZE}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#0f172a', border: '6px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center' }}>
                            <span style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.1 }}>📈<br/>주식</span>
                        </div>
                    </foreignObject>

                    {words.map((w, idx) => {
                        const ratio = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
                        const innerCount = words.length <= 8 ? Math.min(4, words.length) : 6;
                        const isInner = idx < innerCount;
                        const totalInRing = isInner ? innerCount : (words.length - innerCount);
                        const ringIdx = isInner ? idx : (idx - innerCount);
                        const baseSize = isInner ? 100 : 70;
                        const nodeSize = baseSize + (ratio * (isInner ? 30 : 20));
                        const fontSize = isInner ? (18 + ratio * 8) : (14 + ratio * 6);
                        const distance = isInner ? 180 : 320;
                        const outerOffset = isInner ? 0 : (Math.PI / totalInRing);
                        const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2) + outerOffset;
                        const x = CENTER + Math.cos(theta) * distance;
                        const y = CENTER + Math.sin(theta) * distance;
                        const color = colors[w.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
                        return (
                            <foreignObject key={`bubble-${idx}`} x={x - nodeSize/2} y={y - nodeSize/2} width={nodeSize} height={nodeSize} style={{ overflow: 'visible' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: color, border: '4px solid #0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)', cursor: 'default' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                                    <span style={{ fontSize: `${fontSize}px`, fontWeight: 900, textAlign: 'center', lineHeight: 1.1, padding: '0 6px', wordBreak: 'keep-all' }}>{w.text}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>{w.value}회</span>
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>
            )}
        </div>
    );
}
