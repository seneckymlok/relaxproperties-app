"use client";

import { useRef, useState, useCallback } from "react";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    strength?: number;
}

/**
 * Wraps children with a magnetic hover effect.
 * The wrapper div subtly follows the cursor when hovered.
 */
export default function MagneticButton({
    children,
    className = "",
    strength = 0.35,
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("translate3d(0,0,0)");

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            setTransform(`translate3d(${x * strength}px, ${y * strength}px, 0)`);
        },
        [strength]
    );

    const handleMouseLeave = useCallback(() => {
        setTransform("translate3d(0,0,0)");
    }, []);

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
