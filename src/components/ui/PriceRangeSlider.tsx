"use client";

import { useState, useEffect } from "react";

interface PriceRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatLabel?: (value: number) => string;
}

function defaultFormat(v: number): string {
    if (v >= 1_000_000) {
        const m = v / 1_000_000;
        return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M €`;
    }
    if (v >= 1_000) return `${Math.round(v / 1_000).toLocaleString()}k €`;
    return `${v.toLocaleString()} €`;
}

export default function PriceRangeSlider({
    min,
    max,
    step = 1000,
    value,
    onChange,
    formatLabel = defaultFormat,
}: PriceRangeSliderProps) {
    const [localMin, setLocalMin] = useState(value[0]);
    const [localMax, setLocalMax] = useState(value[1]);

    useEffect(() => {
        setLocalMin(value[0]);
        setLocalMax(value[1]);
    }, [value]);

    const minPercent = ((localMin - min) / (max - min)) * 100;
    const maxPercent = ((localMax - min) / (max - min)) * 100;

    const handleMinChange = (val: number) => {
        const clamped = Math.min(val, localMax - step);
        const safe = Math.max(min, clamped);
        setLocalMin(safe);
        onChange([safe, localMax]);
    };

    const handleMaxChange = (val: number) => {
        const clamped = Math.max(val, localMin + step);
        const safe = Math.min(max, clamped);
        setLocalMax(safe);
        onChange([localMin, safe]);
    };

    return (
        <div className="space-y-2">
            {/* Current value labels */}
            <div className="flex justify-between text-xs font-medium text-[var(--color-foreground)]">
                <span className="bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)] tabular-nums">
                    {formatLabel(localMin)}
                </span>
                <span className="text-[var(--color-muted)] self-center">—</span>
                <span className="bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)] tabular-nums">
                    {formatLabel(localMax)}
                </span>
            </div>

            {/* Dual Range Slider — uses shared .range-slider CSS from globals.css */}
            <div className="range-slider relative h-[18px]">
                {/* Background track */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] rounded-full"
                    style={{ background: 'var(--color-border)' }}
                />
                {/* Active range highlight */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        right: `${100 - maxPercent}%`,
                        background: 'var(--color-primary)',
                    }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localMin}
                    onChange={(e) => handleMinChange(Number(e.target.value))}
                    style={{ zIndex: localMin > max - step * 5 ? 5 : 3 }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localMax}
                    onChange={(e) => handleMaxChange(Number(e.target.value))}
                    style={{ zIndex: 4 }}
                />
            </div>

            {/* Min/Max boundary labels */}
            <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
                <span>{formatLabel(min)}</span>
                <span>{formatLabel(max)}</span>
            </div>
        </div>
    );
}
