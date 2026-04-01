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

const SLIDE_DURATION = 6000; // ms per slide

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
    const [animKey, setAnimKey] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressAnimRef = useRef<number | null>(null);
    const slideStartRef = useRef<number>(0);

    // Compute dynamic price range from all properties
    const priceRange = (() => {
        const prices = allProperties.map(p => p.price).filter(p => p > 0);
        if (prices.length === 0) return { min: 0, max: 2_000_000 };
        return {
            min: Math.floor(Math.min(...prices) / 5000) * 5000,
            max: Math.ceil(Math.max(...prices) / 5000) * 5000,
        };
    })();

    // Two-phase intro:
    //   Phase 1 (showLogo): Frosted glass + brand logo (matches loading.tsx)
    //   Phase 2 (showIntro, !showLogo): Property image overlay
    //   Phase 3 (!showIntro): Carousel plays
    const [showLogo, setShowLogo] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    const [introRemoved, setIntroRemoved] = useState(false);

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
                ctaLink: `/${lang}/properties/${p.id}`,
                ctaLabel: viewDetailsLabel,
            };
        });

    const viewOffersLabel = dictionary?.common?.viewOffers || "Zobraziť ponuky";
    const fallbackSlides = [
        {
            id: 'fallback-1',
            location: dictionary?.home?.slides?.bulgaria?.location || "Slnečné pobrežie",
            country: dictionary?.home?.slides?.bulgaria?.region || "Bulharsko",
            title: dictionary?.home?.slides?.bulgaria?.title || "Apartmány pri mori od 45 000 €",
            image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2670&auto=format&fit=crop",
            ctaLink: `/${lang}/properties?country=bulgaria`,
            ctaLabel: viewOffersLabel,
        },
        {
            id: 'fallback-2',
            location: dictionary?.home?.slides?.croatia?.location || "Dalmácia",
            country: dictionary?.home?.slides?.croatia?.region || "Chorvátsko",
            title: dictionary?.home?.slides?.croatia?.title || "Luxusné vily v prvej línii pri mori",
            image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2572&auto=format&fit=crop",
            ctaLink: `/${lang}/properties?country=croatia`,
            ctaLabel: viewOffersLabel,
        },
        {
            id: 'fallback-3',
            location: dictionary?.home?.slides?.spain?.location || "Costa del Sol",
            country: dictionary?.home?.slides?.spain?.region || "Španielsko",
            title: dictionary?.home?.slides?.spain?.title || "Prémiové rezidencie s golfom",
            image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2670&auto=format&fit=crop",
            ctaLink: `/${lang}/properties?country=spain`,
            ctaLabel: viewOffersLabel,
        },
    ];

    const slides = propertySlides.length > 0 ? propertySlides : fallbackSlides;
    const isPaused = showIntro || !hasConsented;

    // Progress bar animation
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

    // Autoplay timer
    useEffect(() => {
        if (isPaused || slides.length <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            stopProgress();
            return;
        }
        startProgress();
        timerRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
            setAnimKey(prev => prev + 1);
            startProgress();
        }, SLIDE_DURATION);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopProgress();
        };
    }, [isPaused, slides.length, startProgress, stopProgress]);

    // Phase 1 → Phase 2: Logo fades out after 2s, revealing property image beneath
    useEffect(() => {
        const timer = setTimeout(() => setShowLogo(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Phase 2 → Phase 3: Property image fades out (4s mobile, 6s desktop total)
    useEffect(() => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const timer = setTimeout(() => {
            setShowIntro(false);
            setAnimKey(prev => prev + 1);
        }, isMobile ? 4000 : 6000);
        return () => clearTimeout(timer);
    }, []);

    // Remove intro overlays from DOM after transitions complete
    const handleIntroTransitionEnd = useCallback(() => {
        if (!showIntro) setIntroRemoved(true);
    }, [showIntro]);

    return (
        <section className="relative z-40 flex flex-col md:block h-[100svh] min-h-[100svh] md:min-h-[600px] md:h-screen w-full overflow-visible bg-[var(--color-secondary)]">
            <div className="relative h-[63svh] md:h-full flex-shrink-0 overflow-hidden">

            {/* Phase 1: Frosted glass + logo (matches loading.tsx) */}
            {/* Phase 2: Property image (revealed when logo fades) */}
            {!introRemoved && (
                <div
                    className="absolute inset-0 z-30 transition-opacity ease-out bg-[var(--color-secondary)]"
                    style={{
                        opacity: showIntro ? 1 : 0,
                        transitionDuration: '1200ms',
                        pointerEvents: showIntro ? 'auto' : 'none',
                    }}
                    onTransitionEnd={handleIntroTransitionEnd}
                >
                    {/* Property image — always present, visible when logo overlay lifts */}
                    <Image
                        src="/images/nehnutelnost more.webp"
                        alt="Luxury property with pool"
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Frosted logo overlay — fades out to reveal property image */}
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center transition-opacity ease-out"
                        style={{
                            opacity: showLogo ? 1 : 0,
                            transitionDuration: '1200ms',
                            backgroundColor: 'rgba(var(--color-background-rgb, 247, 246, 243), 0.88)',
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                        }}
                    >
                        <div className={showLogo ? 'hero-logo-entrance' : ''}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/relax-logo.png"
                                alt="Relax Properties"
                                width={260}
                                height={67}
                                className="h-[clamp(3.5rem,10vw,5rem)] w-auto"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Fade Carousel */}
            <div className={`relative w-full h-full transition-opacity duration-700 ${showIntro ? "opacity-0" : "opacity-100"}`}>
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

                            <div
                                className="absolute inset-0 z-20 flex items-end pb-14 md:pb-[clamp(12rem,38vh,20rem)] transition-opacity duration-500 ease-in-out"
                                style={{
                                    opacity: showIntro ? 0 : 1,
                                    transitionDelay: showIntro ? '0ms' : '200ms',
                                }}
                            >
                                <div className="container-custom">
                                    <div
                                        key={`loc-${animKey}`}
                                        className={`hidden md:flex items-center gap-2 mb-[clamp(1.25rem,2vw,1.5rem)] ${isActive && !showIntro ? 'hero-text-reveal' : 'opacity-0'}`}
                                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)', animationDelay: '100ms' }}
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

                                    <h1
                                        key={`title-${animKey}`}
                                        className={`md:hidden font-serif text-white text-[clamp(1.375rem,5.5vw,1.75rem)] leading-[1.15] mb-3 max-w-[320px] ${isActive && !showIntro ? 'hero-text-reveal' : 'opacity-0'}`}
                                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)', animationDelay: '100ms' }}
                                    >
                                        {slide.title}
                                    </h1>

                                    <div
                                        key={`cta-${animKey}`}
                                        className={isActive && !showIntro ? 'hero-glass-reveal' : 'opacity-0'}
                                        style={{ animationDelay: '250ms' }}
                                    >
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
            <div className={`md:hidden absolute bottom-0 left-0 right-0 z-40 h-[2px] bg-white/15 transition-opacity duration-700 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
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
