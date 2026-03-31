"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type SwiperType from "swiper";
import { gsap } from "gsap";
import HeroSearch from "./HeroSearch";
import MagneticButton from "@/components/ui/MagneticButton";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";

import "swiper/css";
import "swiper/css/effect-fade";

interface HeroSliderProps {
    lang?: string;
    dictionary?: Dictionary;
    featuredProperties?: PublicProperty[];
    allProperties?: PublicProperty[];
}

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
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
    const progressRef = useRef<HTMLDivElement>(null);

    // Compute dynamic price range from all properties
    const priceRange = (() => {
        const prices = allProperties.map(p => p.price).filter(p => p > 0);
        if (prices.length === 0) return { min: 0, max: 2_000_000 };
        return {
            min: Math.floor(Math.min(...prices) / 5000) * 5000,
            max: Math.ceil(Math.max(...prices) / 5000) * 5000,
        };
    })();

    // Intro overlay state
    const [showIntro, setShowIntro] = useState(true);
    const [introRemoved, setIntroRemoved] = useState(false);

    const viewDetailsLabel = lang === 'en' ? 'View property' : lang === 'cz' ? 'Zobrazit detail' : 'Zobraziť detail';

    // Build slides from the 3 most recent properties
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

    // Fallback static slides (only if no properties at all)
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

    // Priority: property slides > static fallbacks
    const slides = propertySlides.length > 0
        ? propertySlides
        : fallbackSlides;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Pause Swiper autoplay during intro phase
    useEffect(() => {
        if (swiperInstance) {
            if (showIntro) {
                swiperInstance.autoplay?.stop();
            } else {
                swiperInstance.autoplay?.start();
            }
        }
    }, [swiperInstance, showIntro]);

    // Fade out intro after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    // Remove intro overlay from DOM after the fade-out transition completes
    const handleIntroTransitionEnd = useCallback(() => {
        if (!showIntro) {
            setIntroRemoved(true);
        }
    }, [showIntro]);

    // Animate content on slide change with GSAP
    useEffect(() => {
        if (showIntro) return;
        const contentEl = contentRefs.current[currentSlide];
        if (!contentEl) return;

        // Text elements: gentle fade with minimal lift
        const textElements = contentEl.querySelectorAll("[data-hero-animate='text']");
        gsap.fromTo(
            textElements,
            { y: 12, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.08,
                ease: "power2.out",
                delay: 0.1,
            }
        );

        // Glass elements (CTA button): slide only, NO opacity change
        // Animating opacity breaks backdrop-blur (invisible at opacity:0)
        const glassElements = contentEl.querySelectorAll("[data-hero-animate='glass']");
        gsap.fromTo(
            glassElements,
            { y: 8 },
            {
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.25,
            }
        );
    }, [currentSlide, showIntro]);

    return (
        <section className="relative z-40 flex flex-col md:block h-[100dvh] min-h-[100dvh] md:min-h-[600px] md:h-screen w-full overflow-visible bg-[var(--color-secondary)]">
            {/* Image carousel area — shorter on mobile to make room for inline filters */}
            <div className="relative h-[63dvh] md:h-full flex-shrink-0 overflow-hidden">

            {/* Intro Photo Overlay */}
            {!introRemoved && (
                <div
                    className="absolute inset-0 z-30 transition-opacity duration-700 ease-in-out bg-[var(--color-secondary)]"
                    style={{ opacity: showIntro ? 1 : 0, pointerEvents: showIntro ? 'auto' : 'none' }}
                    onTransitionEnd={handleIntroTransitionEnd}
                >
                    <Image
                        src="/images/nehnutelnost more.webp"
                        alt="Luxury property with pool"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false,
                }}
                loop
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => {
                    setCurrentSlide(swiper.realIndex);
                    if (progressRef.current) progressRef.current.style.width = '0%';
                }}
                onAutoplayTimeLeft={(_s, _t, pct) => {
                    if (progressRef.current) progressRef.current.style.width = `${(1 - pct) * 100}%`;
                }}
                className={`w-full h-full transition-opacity duration-700 ${showIntro ? "opacity-0" : "opacity-100"}`}
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={slide.id}>
                        {/* Background Image — no priority; intro overlay shows first */}
                        <Image
                            src={slide.image}
                            alt={slide.location || 'Property'}
                            fill
                            className="object-cover"
                            loading={index === 0 ? "eager" : "lazy"}
                        />

                        {/* Dark gradient overlay — ensures white text is always readable */}
                        <div className="absolute inset-0 z-10 pointer-events-none" style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.06) 100%)',
                        }} />

                        {/* Content — fades in when intro ends, animates per-element on slide change */}
                        <div
                            ref={(el) => { contentRefs.current[index] = el; }}
                            className="absolute inset-0 z-20 flex items-end pb-14 md:pb-[clamp(12rem,38vh,20rem)] transition-opacity duration-500 ease-in-out"
                            style={{
                                opacity: showIntro ? 0 : 1,
                                transitionDelay: showIntro ? '0ms' : '200ms',
                            }}
                        >
                            <div className="container-custom">
                                {/* Location tag — desktop only */}
                                <div data-hero-animate="text" className="hidden md:flex items-center gap-2 mb-[clamp(1.25rem,2vw,1.5rem)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)' }}>
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

                                {/* Property title — mobile only */}
                                <h1 data-hero-animate="text" className="md:hidden font-serif text-white text-[clamp(1.375rem,5.5vw,1.75rem)] leading-[1.15] mb-3 max-w-[320px]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)' }}>
                                    {slide.title}
                                </h1>

                                {/* CTA Button with magnetic effect — uses 'glass' animation (no opacity) */}
                                <div data-hero-animate="glass">
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
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Slide progress bar — mobile */}
            <div className={`md:hidden absolute bottom-0 left-0 right-0 z-40 h-[2px] bg-white/15 transition-opacity duration-700 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
                <div
                    ref={progressRef}
                    className="h-full bg-white/70"
                    style={{ width: '0%' }}
                />
            </div>

            </div>{/* end image carousel area */}

            {/* Hero Search Component — always visible */}
            <HeroSearch lang={lang} dictionary={dictionary} priceRange={priceRange} />
        </section>
    );
}
