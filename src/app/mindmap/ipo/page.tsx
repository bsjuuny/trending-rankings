"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";

export default function IpoMindmapPage() {
    const [words, setWords] = useState<{ text: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/trendingrankings/data/mindmap_ipo.json')
            .then(res => res.json())
            .then(data => {
                setWords(data.sort((a: any, b: any) => b.value - a.value).slice(0, 16));
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch mindmap_ipo data", err);
                setLoading(false);
            });
    }, []);

    const colors = [
        "#8b5cf6", "#7c3aed", "#6d28d9", "#a855f7", "#9333ea",
        "#6366f1", "#4f46e5", "#4338ca", "#c084fc", "#a78bfa",
        "#818cf8", "#d946ef", "#c026d3", "#e879f9", "#f0abfc", "#e9d5ff"
    ];

    const maxVal = words.length > 0 ? words.reduce((max, w) => Math.max(max, w.value), 1) : 1;
    const minVal = words.length > 0 ? words.reduce((min, w) => Math.min(min, w.value), maxVal) : 0;

    const SVG_SIZE = 800;
    const CENTER = SVG_SIZE / 2;
    const CENTER_SIZE = 140;

    return (
        <div className="h-screen bg-[#0f172a] text-white flex flex-col items-center overflow-hidden font-sans">
            <Head>
                <title>공모주 트렌드 마인드맵</title>
            </Head>

            <header className="shrink-0 pt-3 pb-1 text-center">
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent inline-block">
                    🏢 공모주 마인드맵
                </h1>
            </header>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : words.length === 0 ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-12 text-center text-slate-400">
                        <p>아직 추출된 키워드 데이터가 없습니다.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
                    <div className="h-full w-full max-w-[800px] bg-[#1e293b] rounded-3xl shadow-2xl border border-[#334155] overflow-hidden">
                        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full h-full drop-shadow-xl" style={{ display: "block" }}>

                            {words.map((w, idx) => {
                                const isInner = idx < 6;
                                const totalInRing = isInner ? 6 : (words.length - 6);
                                const ringIdx = isInner ? idx : (idx - 6);
                                const distance = isInner ? 180 : 320;
                                const theta = (ringIdx / totalInRing) * 2 * Math.PI - (Math.PI / 2);
                                const x = CENTER + Math.cos(theta) * distance;
                                const y = CENTER + Math.sin(theta) * distance;
                                const color = colors[w.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length];

                                return (
                                    <line
                                        key={`line-${idx}`}
                                        x1={CENTER} y1={CENTER}
                                        x2={x} y2={y}
                                        stroke={color}
                                        strokeWidth={isInner ? 4 : 2}
                                        strokeOpacity={0.5}
                                    />
                                );
                            })}

                            <foreignObject x={CENTER - CENTER_SIZE/2} y={CENTER - CENTER_SIZE/2} width={CENTER_SIZE} height={CENTER_SIZE}>
                                <div style={{
                                    width: "100%", height: "100%",
                                    borderRadius: "50%",
                                    backgroundColor: "#0f172a",
                                    border: "6px solid #334155",
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center",
                                    color: "white",
                                    boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                                    textAlign: "center"
                                }}>
                                    <span style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1.1 }}>🏢<br/>공모주</span>
                                </div>
                            </foreignObject>

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
                                const color = colors[w.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length];

                                return (
                                    <foreignObject
                                        key={`bubble-${idx}`}
                                        x={x - nodeSize/2}
                                        y={y - nodeSize/2}
                                        width={nodeSize}
                                        height={nodeSize}
                                        style={{ overflow: "visible" }}
                                    >
                                        <div
                                            style={{
                                                width: "100%", height: "100%",
                                                borderRadius: "50%",
                                                backgroundColor: color,
                                                border: "4px solid #0f172a",
                                                display: "flex", flexDirection: "column",
                                                alignItems: "center", justifyContent: "center",
                                                color: "white",
                                                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                                                transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                                cursor: "default"
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                        >
                                            <span style={{ fontSize: `${fontSize}px`, fontWeight: 900, textAlign: "center", lineHeight: 1.1, padding: "0 6px", wordBreak: "keep-all" }}>
                                                {w.text}
                                            </span>
                                            <span style={{ fontSize: "14px", fontWeight: "bold", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>
                                                {w.value}점
                                            </span>
                                        </div>
                                    </foreignObject>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
