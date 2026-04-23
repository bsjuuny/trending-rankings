"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, MessageSquare, TrendingUp, Landmark } from "lucide-react";

type Category = "community" | "stocks" | "ipo" | "daiso" | "digital";

export default function MindmapPage() {
    const [category, setCategory] = useState<Category>("community");
    const [words, setWords] = useState<{ text: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: "community", label: "커뮤니티", icon: <MessageSquare size={18} />, file: 'mindmap.json' },
        { id: "stocks", label: "주식/증권", icon: <TrendingUp size={18} />, file: 'mindmap_stocks.json' },
        { id: "ipo", label: "공모주", icon: <Landmark size={18} />, file: 'mindmap_ipo.json' },
        { id: "daiso", label: "다이소", icon: <MessageSquare size={18} />, file: 'mindmap_daiso.json' },
        { id: "digital", label: "디지털가전", icon: <TrendingUp size={18} />, file: 'mindmap_digital.json' },
    ];

    useEffect(() => {
        setLoading(true);
        const fileName = categories.find(c => c.id === category)?.file || 'mindmap.json';
        // 캐시 방지를 위해 타임스탬프 추가
        fetch(`../data/${fileName}?t=${new Date().getTime()}`)
            .then(res => res.json())
            .then(data => { 
                setWords(data.sort((a: any, b: any) => b.value - a.value).slice(0, 30)); 
                setLoading(false); 
            })
            .catch(() => setLoading(false));
    }, [category]);

    const colors = [
        "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80",
        "#2dd4bf", "#22d3ee", "#38bdf8", "#60a5fa", "#818cf8",
        "#a78bfa", "#c084fc", "#f472b6", "#fb7185"
    ];

    const maxVal = words.length > 0 ? words.reduce((max, w) => Math.max(max, w.value), 1) : 1;
    const minVal = words.length > 0 ? words.reduce((min, w) => Math.min(min, w.value), maxVal) : 0;

    const SVG_SIZE = 1000;
    const CENTER = SVG_SIZE / 2;
    const CENTER_SIZE = 140;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at top right, #1e1b4b, #020617, #0f172a)', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-heading)' }}>
            <Head><title>TREND MINDMAP</title></Head>

            {/* Premium Header */}
            <header style={{ 
                flexShrink: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '30px 20px',
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                zIndex: 10
            }}>
                <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Link href="/" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        color: '#94a3b8', 
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'color 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                        <ArrowLeft size={18} /> BACK
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        LIVE TREND ANALYSIS
                    </div>
                </div>

                <h1 style={{ 
                    fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', 
                    fontWeight: 900, 
                    marginBottom: '10px',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {categories.find(c => c.id === category)?.label} 트렌드 맵
                </h1>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id as Category)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: category === cat.id ? 'var(--accent)' : 'transparent',
                                color: category === cat.id ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Mindmap Canvas */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', minHeight: 0, position: 'relative' }}>
                {loading ? (
                    <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                ) : words.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '1.2rem' }}>데이터를 불러올 수 없습니다.</p>
                ) : (
                    <svg
                        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                        style={{ width: '100%', height: '100%', maxWidth: '100vh', display: 'block', overflow: 'visible' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <defs>
                            <radialGradient id="centerGradient">
                                <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
                                <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                            </radialGradient>
                            {colors.map((color, i) => (
                                <filter key={`glow-${i}`} id={`glow-${i}`}>
                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            ))}
                        </defs>

                        {/* Background center glow */}
                        <circle cx={CENTER} cy={CENTER} r={400} fill="url(#centerGradient)" style={{ opacity: 0.5 }} />

                        {/* Connection Lines */}
                        {words.map((w, idx) => {
                            const isInner = idx < 8;
                            const totalInRing = isInner ? 8 : (words.length - 8);
                            const ringIdx = isInner ? idx : (idx - 8);
                            const distance = isInner ? 260 : 440;
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[idx % colors.length];
                            return (
                                <line 
                                    key={`line-${idx}`} 
                                    x1={CENTER} y1={CENTER} x2={x} y2={y} 
                                    stroke={color} 
                                    strokeWidth={isInner ? 2 : 1} 
                                    strokeOpacity={0.15}
                                    style={{ transition: 'all 0.5s' }}
                                />
                            );
                        })}

                        {/* Center Node */}
                        <circle cx={CENTER} cy={CENTER} r={CENTER_SIZE / 2} fill="#020617" stroke="rgba(139, 92, 246, 1)" strokeWidth={4} />
                        <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={28} fontWeight={900}>TOP TREND</text>

                        {/* Word Nodes */}
                        {words.map((w, idx) => {
                            const ratio = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
                            const isInner = idx < 8;
                            const totalInRing = isInner ? 8 : (words.length - 8);
                            const ringIdx = isInner ? idx : (idx - 8);
                            const baseSize = isInner ? 150 : 110;
                            const nodeSize = baseSize + (ratio * 50);
                            const fontSize = isInner ? (18 + ratio * 6) : (14 + ratio * 4);
                            const distance = isInner ? 260 : 440;
                            const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2) + (isInner ? 0 : 0.1);
                            const x = CENTER + Math.cos(theta) * distance;
                            const y = CENTER + Math.sin(theta) * distance;
                            const color = colors[idx % colors.length];
                            const r = nodeSize / 2;
                            
                            return (
                                <g key={`bubble-${idx}`} style={{ cursor: 'pointer' }} transform={`translate(${x}, ${y})`}>
                                    <circle 
                                        cx={0} cy={0} r={r} 
                                        fill={color} 
                                        fillOpacity={0.9}
                                        stroke="#020617" 
                                        strokeWidth={3} 
                                        filter={`url(#glow-${idx % colors.length})`}
                                        style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                    />
                                    <text 
                                        x={0} y={-8} 
                                        textAnchor="middle" 
                                        dominantBaseline="middle" 
                                        fill="white" 
                                        fontSize={fontSize} 
                                        fontWeight={900} 
                                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                    >
                                        {w.text.length > 10 ? w.text.substring(0, 9) + '..' : w.text}
                                    </text>
                                    <text 
                                        x={0} y={fontSize * 1} 
                                        textAnchor="middle" 
                                        dominantBaseline="middle" 
                                        fill="rgba(255,255,255,0.9)" 
                                        fontSize={12} 
                                        fontWeight={700}
                                    >
                                        {w.value}{category === 'community' ? '회' : ''}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Float Decoration */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '40px', fontSize: '0.8rem', color: '#94a3b8', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {words.length} KEYWORDS DISCOVERED
                </div>
            </div>
        </div>
    );
}
