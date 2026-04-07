"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroSearch from "./HeroSearch";
import MagneticButton from "@/components/ui/MagneticButton";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

interface HeroSliderProps {
    lang?: string;
    dictionary?: Dictionary;
    featuredProperties?: PublicProperty[];
    allProperties?: PublicProperty[];
}

const SLIDE_DURATION = 6000;

const countriesMap: Record<string, Record<string, string>> = {
    spain: { sk: 'Španielsko', en: 'Spain', cz: 'Španělsko' },
    croatia: { sk: 'Chorvátsko', en: 'Croatia', cz: 'Chorvatsko' },
    italy: { sk: 'Taliansko', en: 'Italy', cz: 'Itálie' },
    portugal: { sk: 'Portugalsko', en: 'Portugal', cz: 'Portugalsko' },
    greece: { sk: 'Grécko', en: 'Greece', cz: 'Řecko' },
    montenegro: { sk: 'Čierna Hora', en: 'Montenegro', cz: 'Černá Hora' },
    bulgaria: { sk: 'Bulharsko', en: 'Bulgaria', cz: 'Bulharsko' },
};

function translateCountry(country: string, lang: string): string {
    const key = country.toLowerCase();
    return countriesMap[key]?.[lang] || country;
}

export default function HeroSlider({ lang = 'sk', dictionary, featuredProperties = [], allProperties = [] }: HeroSliderProps) {
    const { hasConsented } = useCookieConsent();
    const [currentSlide, setCurrentSlide] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressAnimRef = useRef<number | null>(null);
    const slideStartRef = useRef<number>(0);

    const priceRange = (() => {
        const prices = allProperties.map(p => p.price).filter(p => p > 0);
        if (prices.length === 0) return { min: 0, max: 2_000_000 };
        return {
            min: Math.floor(Math.min(...prices) / 5000) * 5000,
            max: Math.ceil(Math.max(...prices) / 5000) * 5000,
        };
    })();

    const viewDetailsLabel = lang === 'en' ? 'View property' : lang === 'cz' ? 'Zobrazit detail' : 'Zobraziť detail';

    const propertySlides = featuredProperties
        .filter(p => p.images.length > 0)
        .slice(0, 3)
        .map((p) => {
            const heroIdx = p.heroImageIndex ?? 0;
            const image = p.images[Math.min(heroIdx, p.images.length - 1)] || p.images[0];
            return {
                id: p.id,
                location: p.location,
                country: translateCountry(p.country, lang),
                title: p.title,
                image,
                ctaLink: `/${lang}/properties/${p.slug || p.id}`,
                ctaLabel: viewDetailsLabel,
            };
        });

    const slides = propertySlides;

    // Intro photo overlay — shows main.webp/main_mobile.webp then fades to carousel (if properties exist)
    const [showIntro, setShowIntro] = useState(true);
    const [introRemoved, setIntroRemoved] = useState(false);

    useEffect(() => {
        if (slides.length === 0) return; // no properties selected — keep main photo visible
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const timer = setTimeout(() => setShowIntro(false), isMobile ? 4000 : 6000);
        return () => clearTimeout(timer);
    }, [slides.length]);

    const handleIntroTransitionEnd = useCallback(() => {
        if (!showIntro) setIntroRemoved(true);
    }, [showIntro]);

    const isPaused = showIntro || !hasConsented;

    // --- Progress bar ---
    const startProgress = useCallback(() => {
        slideStartRef.current = performance.now();
        if (progressRef.current) progressRef.current.style.width = '0%';
        function tick() {
            const elapsed = performance.now() - slideStartRef.current;
            const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
            if (progressRef.current) progressRef.current.style.width = `${pct}%`;
            if (pct < 100) progressAnimRef.current = requestAnimationFrame(tick);
        }
        progressAnimRef.current = requestAnimationFrame(tick);
    }, []);

    const stopProgress = useCallback(() => {
        if (progressAnimRef.current) {
            cancelAnimationFrame(progressAnimRef.current);
            progressAnimRef.current = null;
        }
    }, []);

    // --- Autoplay ---
    useEffect(() => {
        if (isPaused || slides.length <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            stopProgress();
            return;
        }
        startProgress();
        timerRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
            startProgress();
        }, SLIDE_DURATION);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopProgress();
        };
    }, [isPaused, slides.length, startProgress, stopProgress]);

    return (
        <section className="relative z-40 flex flex-col md:block h-[100svh] min-h-[100svh] md:min-h-[600px] md:h-screen w-full overflow-visible bg-[var(--color-secondary)]">
            <div className="relative h-[63svh] md:h-full flex-shrink-0 overflow-hidden">
                {/* Intro photo overlay */}
                {!introRemoved && (
                    <div
                        className="absolute inset-0 z-30 bg-[var(--color-secondary)]"
                        style={{
                            opacity: showIntro ? 1 : 0,
                            transition: 'opacity 1s ease-out',
                            pointerEvents: showIntro ? 'auto' : 'none',
                        }}
                        onTransitionEnd={handleIntroTransitionEnd}
                    >
                        <div className="absolute inset-0 md:hidden">
                            <Image
                                src="/images/main_mobile.webp"
                                alt="Luxury property"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="absolute inset-0 hidden md:block">
                            <Image
                                src="/images/main.webp"
                                alt="Luxury property"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                )}

                {/* CSS Fade Carousel */}
                <div className="relative w-full h-full">
                    {slides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        return (
                            <div
                                key={slide.id}
                                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                                style={{
                                    opacity: isActive ? 1 : 0,
                                    zIndex: isActive ? 1 : 0,
                                }}
                            >
                                {(index === 0 || isActive) && (
                                    <Image
                                        src={slide.image}
                                        alt={slide.location || 'Property'}
                                        fill
                                        sizes="100vw"
                                        quality={60}
                                        className="object-cover"
                                        {...(index === 0 ? { priority: true } : { loading: "lazy" as const })}
                                    />
                                )}

                                <div className="absolute inset-0 z-10 pointer-events-none" style={{
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.06) 100%)',
                                }} />

                                <div className="absolute inset-0 z-20 flex items-end pb-14 md:pb-[clamp(12rem,38vh,20rem)]">
                                    <div className="container-custom">
                                        <div className={`hidden md:flex items-center gap-2 mb-[clamp(1.25rem,2vw,1.5rem)] ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)' }}
                                        >
                                            <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                            </svg>
                                            <span className="text-white text-[clamp(0.875rem,2.5vw,1rem)] font-semibold">{slide.location}</span>
                                            {slide.country && (
                                                <>
                                                    <span className="text-white/60">–</span>
                                                    <span className="text-white text-[clamp(0.875rem,2.5vw,1rem)] font-medium">{slide.country}</span>
                                                </>
                                            )}
                                        </div>

                                        <h1 className={`md:hidden font-serif text-white text-[clamp(1.375rem,5.5vw,1.75rem)] leading-[1.15] mb-3 max-w-[320px] ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)' }}
                                        >
                                            {slide.title}
                                        </h1>

                                        <div className={`${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                                            <MagneticButton strength={0.2}>
                                                <Link
                                                    href={slide.ctaLink}
                                                    className="group inline-flex items-center gap-3 bg-black/20 backdrop-blur-md text-white px-[clamp(1.5rem,3.5vw,1.75rem)] py-[clamp(0.75rem,1.2vw,0.875rem)] rounded-full text-[clamp(0.875rem,2.5vw,1rem)] font-medium border border-white/20 hover:bg-white hover:text-[var(--color-secondary)] transition-all duration-300 active:scale-[0.98] tracking-wide"
                                                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                                                >
                                                    {slide.ctaLabel}
                                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </Link>
                                            </MagneticButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Slide progress bar — mobile */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 z-40 h-[2px] bg-white/15">
                    <div
                        ref={progressRef}
                        className="h-full bg-white/70"
                        style={{ width: '0%' }}
                    />
                </div>
            </div>

            <HeroSearch lang={lang} dictionary={dictionary} priceRange={priceRange} />
        </section>
    );
}
