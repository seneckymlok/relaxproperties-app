"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Dictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

interface HeaderProps {
    lang: Language;
    dictionary: Dictionary;
}

/**
 * Contact info per locale:
 *  SK → Vierka  +421 911 819 152
 *  CZ / EN → Aleš  +421 911 989 895
 */
function getContact(lang: Language) {
    if (lang === "sk") {
        return { name: "Vierka", phone: "+421 911 819 152", phoneRaw: "+421911819152" };
    }
    if (lang === "cz") {
        return { name: "Aleš", phone: "+420 608 007 088", phoneRaw: "+420608007088" };
    }
    // EN
    return { name: "Aleš", phone: "+421 911 989 895", phoneRaw: "+421911989895" };
}

/** Determine if the current page has a full-screen hero behind the header */
function isHeroRoute(pathname: string | null): boolean {
    if (!pathname) return false;
    // Homepage: /sk, /en, /cz (with or without trailing slash)
    return /^\/(sk|en|cz)\/?$/.test(pathname);
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export default function Header({ lang, dictionary }: HeaderProps) {
    // Continuous scroll progress: 0 (top) → 1 (fully scrolled past threshold)
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { favoritesCount } = useFavorites();
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    const contact = getContact(lang);
    const isHeroPage = isHeroRoute(pathname);

    // ─── RAF-throttled scroll listener with continuous interpolation ───
    const handleScroll = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const SCROLL_THRESHOLD = 120; // px to complete transition
            const progress = clamp(window.scrollY / SCROLL_THRESHOLD, 0, 1);
            setScrollProgress(progress);
        });
    }, []);

    useEffect(() => {
        // Set initial state
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafRef.current);
        };
    }, [handleScroll]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    // ─── Interpolated values ───
    // t=0: transparent/hero mode, t=1: solid/scrolled mode
    // On non-hero pages, always fully solid
    const t = isHeroPage ? scrollProgress : 1;

    // Background: fully transparent at top → warm sand-white on scroll
    const bgR = 249, bgG = 249, bgB = 247; // --color-background
    const bgOpacity = t * 0.97; // clean transparent → solid

    // Backdrop blur: none at top → full on scroll
    const blurValue = t * 20;

    // Padding: generous → compact (desktop)
    const paddingY = lerp(20, 10, t); // px
    const paddingYMobile = lerp(14, 10, t); // px

    // Shadow: invisible → multi-layered atmospheric
    const shadowOpacity = t;

    // Accent line: center-expanding
    const accentLineScale = t;

    // Logo filter: white at top → original on scroll
    // brightness(0) invert(1) = pure white; brightness(1) invert(0) = original
    const logoBrightness = lerp(0, 1, t);
    const logoInvert = lerp(1, 0, t);

    const navLinks = [
        { href: `/${lang}/properties`, label: dictionary.nav.properties },
        { href: `/${lang}/buying-process`, label: dictionary.nav.buyingProcess },
        { href: `/${lang}/about`, label: dictionary.nav.about },
        { href: `/${lang}/blog`, label: dictionary.nav.blog },
        { href: `/${lang}/contact`, label: dictionary.nav.contact },
    ];

    // Determine if we're in "light text" mode (over hero)
    const isLightMode = isHeroPage && t < 0.5;

    return (
        <>
            {/* ─── Dark gradient vignette behind header (broker.hr style) ─── */}
            {isHeroPage && (
                <div
                    className="fixed top-0 left-0 right-0 z-[49] pointer-events-none"
                    style={{
                        height: '160px',
                        background: `linear-gradient(to bottom, rgba(15,23,35,${lerp(0.55, 0, t)}) 0%, rgba(15,23,35,${lerp(0.3, 0, t)}) 40%, transparent 100%)`,
                    }}
                />
            )}

            {/* ─── Main Header ─── */}
            <header
                className="fixed left-0 right-0 z-50 top-0"
                style={{
                    // Progressive glassmorphism background
                    backgroundColor: `rgba(${bgR}, ${bgG}, ${bgB}, ${bgOpacity})`,
                    backdropFilter: `blur(${blurValue}px) saturate(${lerp(1, 1.2, t)})`,
                    WebkitBackdropFilter: `blur(${blurValue}px) saturate(${lerp(1, 1.2, t)})`,
                    // Multi-layered atmospheric shadow
                    boxShadow: shadowOpacity > 0.05
                        ? `0 1px 3px rgba(0,0,0,${0.04 * shadowOpacity}), 0 4px 12px rgba(0,0,0,${0.03 * shadowOpacity}), 0 8px 32px rgba(0,0,0,${0.02 * shadowOpacity})`
                        : 'none',
                    // GPU-accelerated
                    willChange: 'backdrop-filter, background-color, box-shadow',
                }}
            >
                <style>{`
                    .header-pad { padding-top: ${paddingYMobile}px; padding-bottom: ${paddingYMobile}px; }
                    @media (min-width: 768px) {
                        .header-pad { padding-top: ${paddingY}px; padding-bottom: ${paddingY}px; }
                    }
                `}</style>
                <div className="header-pad">
                    <div className="container-custom px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            {/* ─── Logo with crossfade filter ─── */}
                            <Link href={`/${lang}`} className="block flex-shrink-0 relative">
                                {isHeroPage ? (
                                    <div className="relative h-8 sm:h-9 md:h-10 w-[140px] sm:w-[155px] md:w-[170px]">
                                        {/* Original logo — fades in on scroll */}
                                        <Image
                                            src="/images/relax-logo.png"
                                            alt="Relax Properties"
                                            width={180}
                                            height={45}
                                            className="h-8 sm:h-9 md:h-10 w-auto absolute inset-0 object-contain object-left"
                                            style={{
                                                opacity: t,
                                                transition: 'opacity 0.15s ease',
                                            }}
                                            priority
                                        />
                                        {/* White logo variant — visible at top, fades out on scroll */}
                                        <Image
                                            src="/images/relax-logo.png"
                                            alt=""
                                            width={180}
                                            height={45}
                                            className="h-8 sm:h-9 md:h-10 w-auto absolute inset-0 object-contain object-left"
                                            aria-hidden="true"
                                            style={{
                                                opacity: 1 - t,
                                                filter: `brightness(${logoBrightness}) invert(${logoInvert})`,
                                                transition: 'opacity 0.15s ease, filter 0.15s ease',
                                            }}
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <Image
                                        src="/images/relax-logo.png"
                                        alt="Relax Properties"
                                        width={180}
                                        height={45}
                                        className="h-8 sm:h-9 md:h-10 w-auto"
                                        priority
                                    />
                                )}
                            </Link>

                            {/* ─── Desktop Navigation — centered ─── */}
                            <nav className="hidden md:flex items-center gap-7 lg:gap-9">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="relative text-[13px] font-medium tracking-wide uppercase"
                                            style={{
                                                color: isActive
                                                    ? (isLightMode ? 'white' : 'var(--color-primary)')
                                                    : (isHeroPage
                                                        ? `rgba(${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(0.92, 1, t)})`
                                                        : 'var(--color-foreground)'),
                                                transition: 'color 0.2s ease',
                                                textShadow: isHeroPage && t < 0.3
                                                    ? `0 1px 3px rgba(0,0,0,${lerp(0.3, 0, t)})`
                                                    : 'none',
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* ─── Desktop Actions ─── */}
                            <div className="hidden md:flex items-center gap-3">
                                {/* Phone */}
                                <a
                                    href={`tel:${contact.phoneRaw}`}
                                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                                    style={{
                                        color: isHeroPage
                                            ? `rgba(${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(0.92, 1, t)})`
                                            : 'var(--color-foreground)',
                                        textShadow: isHeroPage && t < 0.3
                                            ? `0 1px 3px rgba(0,0,0,${lerp(0.2, 0, t)})`
                                            : 'none',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {contact.phone}
                                </a>
                                {/* Email */}
                                <a
                                    href="mailto:info@relaxproperties.sk"
                                    className="hidden lg:flex items-center gap-1.5 text-xs transition-colors"
                                    style={{
                                        color: isHeroPage
                                            ? `rgba(${lerp(255, 107, t)}, ${lerp(255, 107, t)}, ${lerp(255, 107, t)}, ${lerp(0.7, 1, t)})`
                                            : 'var(--color-muted)',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    info@relaxproperties.sk
                                </a>

                                {/* Divider */}
                                <span
                                    className="w-px h-5"
                                    style={{
                                        backgroundColor: isHeroPage
                                            ? `rgba(255, 255, 255, ${lerp(0.25, 0, t)})`
                                            : 'transparent',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                />
                                <span
                                    className="w-px h-5"
                                    style={{
                                        backgroundColor: isHeroPage
                                            ? `rgba(237, 236, 233, ${t})`
                                            : 'var(--color-border)',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                />

                                {/* Favorites Icon */}
                                <Link
                                    href={`/${lang}/favorites`}
                                    className="relative p-2 rounded-full transition-colors"
                                    aria-label={dictionary.nav.favorites}
                                    style={{
                                        color: isHeroPage
                                            ? `rgba(${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(255, 45, t)}, ${lerp(0.92, 1, t)})`
                                            : 'var(--color-foreground)',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full" style={{ width: '18px', height: '18px' }}>
                                            {favoritesCount > 9 ? '9+' : favoritesCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Language Switcher */}
                                <LanguageSwitcher isScrolled={!isLightMode} />
                            </div>

                            {/* ─── Mobile Menu Toggle ─── */}
                            <button
                                className="md:hidden w-11 h-11 flex items-center justify-center rounded-full transition-colors"
                                style={{
                                    color: isHeroPage
                                        ? `rgba(${lerp(255, 26, t)}, ${lerp(255, 26, t)}, ${lerp(255, 26, t)}, 1)`
                                        : 'var(--color-secondary)',
                                    backgroundColor: isMobileMenuOpen
                                        ? (isLightMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)')
                                        : 'transparent',
                                    transition: 'color 0.2s ease, background-color 0.2s ease',
                                }}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Center-expanding accent line ─── */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden"
                    style={{ opacity: t > 0.1 ? 1 : 0 }}
                >
                    <div
                        className="h-full w-full"
                        style={{
                            background: `linear-gradient(to right, var(--color-primary), var(--color-primary-light), var(--color-primary))`,
                            transform: `scaleX(${accentLineScale})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            opacity: lerp(0, 0.6, t),
                        }}
                    />
                </div>
            </header>

            {/* Desktop gradient removed — single unified vignette above handles both */}

            {/* ─── Mobile Menu Overlay ─── */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* ─── Mobile Menu Panel ─── */}
            <div
                ref={menuRef}
                className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 md:hidden transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Menu Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                    <span className="font-serif text-lg text-[var(--color-secondary)]">{dictionary.header.menu}</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface)] transition-colors"
                        aria-label={dictionary.common.close}
                    >
                        <svg className="w-5 h-5 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-[calc(100%-64px)]">
                    {/* Navigation Links */}
                    <nav className="px-5 py-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center justify-between py-4 border-b border-[var(--color-border)] transition-colors ${isActive
                                        ? "text-[var(--color-primary)]"
                                        : "text-[var(--color-foreground)] active:text-[var(--color-primary)]"
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span className="font-medium">{link.label}</span>
                                    <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            );
                        })}

                        {/* Favorites Link with Badge */}
                        <Link
                            href={`/${lang}/favorites`}
                            className="flex items-center justify-between py-4 border-b border-[var(--color-border)] text-[var(--color-foreground)] active:text-[var(--color-primary)] transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="font-medium">{dictionary.nav.favorites}</span>
                            </div>
                            {favoritesCount > 0 && (
                                <span className="w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
                                    {favoritesCount > 9 ? '9+' : favoritesCount}
                                </span>
                            )}
                        </Link>
                    </nav>

                    {/* Contact Info in Mobile */}
                    <div className="px-5 py-4 border-b border-[var(--color-border)]">
                        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">{dictionary.nav.contact}</p>
                        <a
                            href={`tel:${contact.phoneRaw}`}
                            className="flex items-center gap-2 text-sm text-[var(--color-foreground)] mb-2"
                        >
                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="font-medium">{contact.name}:</span> {contact.phone}
                        </a>
                        <a
                            href="mailto:info@relaxproperties.sk"
                            className="flex items-center gap-2 text-sm text-[var(--color-foreground)]"
                        >
                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            info@relaxproperties.sk
                        </a>
                    </div>

                    {/* Language Switcher */}
                    <div className="px-5 py-4">
                        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">{dictionary.header.language}</p>
                        <LanguageSwitcher isScrolled={true} />
                    </div>

                    {/* Contact CTA */}
                    <div className="px-5 py-4 mt-auto">
                        <a
                            href={`tel:${contact.phoneRaw}`}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {contact.phone}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
