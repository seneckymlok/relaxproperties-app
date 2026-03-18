"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Language {
    code: string;
    label: string;
    flag: string;
}

const languages: Language[] = [
    { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
    { code: "cz", label: "Čeština", flag: "🇨🇿" },
    { code: "en", label: "English", flag: "🇬🇧" },
];

interface LanguageSwitcherProps {
    isScrolled?: boolean;
    onLanguageChange?: (lang: Language) => void;
}

export default function LanguageSwitcher({ isScrolled = false, onLanguageChange }: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Determine current language from URL
    const currentLangCode = pathname?.split('/')[1] || 'sk';
    const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageChange = (lang: Language) => {
        setIsOpen(false);

        if (onLanguageChange) {
            onLanguageChange(lang);
        }

        // Navigate to the same page in the new language
        const segments = pathname?.split('/') || [];
        const supportedLangs = languages.map(l => l.code);

        // Check if the first segment is a language code
        if (segments.length > 1 && supportedLangs.includes(segments[1])) {
            segments[1] = lang.code; // Replace language
        } else {
            segments.splice(1, 0, lang.code); // Insert language
        }

        const newPath = segments.join('/') || `/${lang.code}`;
        router.push(newPath);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${isScrolled
                    ? "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                    : "text-white/90 hover:bg-white/10"
                    }`}
                aria-label="Zmeniť jazyk"
            >
                <span>{currentLang.code.toUpperCase()}</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-[var(--color-border)] overflow-hidden z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--color-surface)] ${currentLang.code === lang.code
                                ? "bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                                : "text-[var(--color-foreground)]"
                                }`}
                        >
                            <span className="font-medium">{lang.code.toUpperCase()}</span>
                            <span>{lang.label}</span>
                            {currentLang.code === lang.code && (
                                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
