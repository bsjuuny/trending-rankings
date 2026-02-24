'use client';

import { useEffect, useState } from 'react';

/**
 * Accurately displays time remaining until the 59th minute of the hour.
 * This is a client component to avoid 'stuck timer' issues in the data cache.
 */
export default function CacheTimer() {
    const [minutesLeft, setMinutesLeft] = useState<number>(0);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            let target = new Date(now);
            target.setMinutes(59, 0, 0);

            if (now.getMinutes() >= 59) {
                target.setHours(now.getHours() + 1);
            }

            const diffMs = target.getTime() - now.getTime();
            const diffMin = Math.ceil(diffMs / (1000 * 60));
            setMinutesLeft(diffMin);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, []);

    if (minutesLeft <= 0) return null;

    return (
        <span className="cache-timer" style={{
            fontSize: '0.7em',
            fontWeight: 'normal',
            opacity: 0.7,
            marginLeft: '8px',
            verticalAlign: 'middle'
        }}>
            (캐시: {minutesLeft}분)
        </span>
    );
}
