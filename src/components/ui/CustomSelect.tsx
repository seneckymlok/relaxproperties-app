"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    variant?: "default" | "hero";
    searchable?: boolean;
    alphabetical?: boolean;
}

function normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Vyberte",
    label,
    variant = "default",
    searchable = false,
    alphabetical = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const processedOptions = useMemo(() => {
        let result = [...options];
        if (alphabetical) {
            // Keep "all" options at top, sort the rest
            const allOption = result.find(o => o.value === 'all');
            const rest = result.filter(o => o.value !== 'all');
            rest.sort((a, b) => a.label.localeCompare(b.label));
            result = allOption ? [allOption, ...rest] : rest;
        }
        if (searchable && searchQuery) {
            const normalized = normalizeText(searchQuery);
            result = result.filter(opt =>
                opt.value === 'all' || normalizeText(opt.label).includes(normalized)
            );
        }
        return result;
    }, [options, alphabetical, searchable, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery("");
    };

    const isHero = variant === "hero";

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="block text-[10px] text-[var(--color-muted)] mb-1.5 uppercase tracking-[0.15em]">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 text-left transition-all ${isHero
                    ? "bg-transparent py-2.5 text-white/90 hover:text-white"
                    : `bg-white border rounded-lg px-4 py-3 ${isOpen
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                    }`
                    }`}
            >
                <span className={`text-sm ${isHero
                    ? (selectedOption ? "text-white font-medium" : "text-white/50")
                    : (selectedOption ? "text-[var(--color-foreground)] font-medium" : "text-[var(--color-muted)]")
                    }`}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={`w-3.5 h-3.5 ${isHero ? "text-white/40" : "text-[var(--color-muted)]"} transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            <div
                className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[var(--shadow-xl)] z-50 max-h-60 overflow-y-auto border border-[var(--color-border)]/50 transition-all duration-200 origin-top ${isOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {/* Search input */}
                {searchable && (
                    <div className="sticky top-0 bg-white p-2 border-b border-[var(--color-border)]/50">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Hľadať..."
                            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 outline-none"
                        />
                    </div>
                )}
                {processedOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2.5 ${option.value === value
                            ? "text-[var(--color-primary)] font-medium"
                            : "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                            }`}
                    >
                        {/* Accent dot for selected */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${option.value === value
                            ? "bg-[var(--color-accent)] scale-100"
                            : "bg-transparent scale-0"
                            }`} />
                        {option.label}
                    </button>
                ))}
                {processedOptions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-[var(--color-muted)]">
                        Žiadne výsledky
                    </div>
                )}
            </div>
        </div>
    );
}
