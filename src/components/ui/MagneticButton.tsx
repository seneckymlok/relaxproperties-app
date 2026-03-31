"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    strength?: number;
}

/**
 * Wraps children with a magnetic hover effect.
 * The wrapper div subtly follows the cursor when hovered.
 * Automatically disabled on touch / mobile devices.
 */
export default function MagneticButton({
    children,
    className = "",
    strength = 0.35,
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("translate3d(0,0,0)");
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Coarse pointer = finger/touch — no magnetic effect needed
        const mq = window.matchMedia("(pointer: coarse)");
        setIsTouchDevice(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!ref.current || isTouchDevice) return;
            const rect = ref.current.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            setTransform(`translate3d(${x * strength}px, ${y * strength}px, 0)`);
        },
        [strength, isTouchDevice]
    );

    const handleMouseLeave = useCallback(() => {
        setTransform("translate3d(0,0,0)");
    }, []);

    // On touch devices, render a plain wrapper — no event handlers, no transforms
    if (isTouchDevice) {
        return (
            <div className={`inline-block ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`inline-block ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform,
                transition: "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
                willChange: "transform",
            }}
        >
            {children}
        </div>
    );
}
