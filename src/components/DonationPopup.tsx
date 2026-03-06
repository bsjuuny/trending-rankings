"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function DonationPopup() {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setMounted(true);
        const hasClosed = sessionStorage.getItem("donationPopupClosed");
        if (!hasClosed) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                setTimeout(() => setShow(true), 50);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                width: "288px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                color: "#374151",
                transition: "all 0.5s ease-out",
                transform: show ? "translateY(0)" : "translateY(20px)",
                opacity: show ? 1 : 0,
            }}
        >
            <button
                onClick={() => {
                    sessionStorage.setItem("donationPopupClosed", "true");
                    setShow(false);
                    setTimeout(() => setIsVisible(false), 500);
                }}
                style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    padding: "6px",
                    color: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "50%",
                }}
                aria-label="닫기"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div style={{ width: "100%", marginBottom: "16px", backgroundColor: "#f9fafb", borderRadius: "12px", display: "flex", justifyContent: "center", padding: "12px", border: "1px solid #f3f4f6" }}>
                <img
                    src="/trendingrankings/donation-qr.png"
                    alt="기부 QR 코드"
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                />
            </div>

            <div style={{ textAlign: "center", width: "100%" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.6, wordBreak: "keep-all", margin: "0", color: "#374151" }}>
                    이 글이 도움이 되셨다면,<br />
                    커피 한 잔 값으로 응원해 주실 수 있어요 ☕<br />
                    작은 기부가 앞으로 더 좋은 글을 쓰는 데 큰 힘이 됩니다.
                </p>
            </div>
        </div>,
        document.body
    );
}
