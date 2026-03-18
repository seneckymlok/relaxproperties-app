"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpNumberProps {
    end: string | number;
    duration?: number;
    className?: string;
}

export default function CountUpNumber({ end, duration = 2000, className = "" }: CountUpNumberProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef<HTMLSpanElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Parse the end value and suffix
    const endStr = end.toString();
    const value = parseInt(endStr.replace(/\D/g, ""), 10);
    const suffix = endStr.replace(/[0-9]/g, "");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                }
            },
            { threshold: 0.1 }
        );

        if (countRef.current) {
            observer.observe(countRef.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated]);

    useEffect(() => {
        if (!hasAnimated) return;
        if (isNaN(value)) return;

        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function (easeOutExpo)
            const easeOut = (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

            setCount(Math.floor(easeOut(percentage) * value));

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [hasAnimated, value, duration]);

    return (
        <span ref={countRef} className={className}>
            {count}{suffix}
        </span>
    );
}
