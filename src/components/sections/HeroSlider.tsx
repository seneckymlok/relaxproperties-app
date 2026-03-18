"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type SwiperType from "swiper";
import HeroSearch from "./HeroSearch";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";

import "swiper/css";
import "swiper/css/effect-fade";

interface HeroSliderProps {
    lang?: string;
    dictionary?: Dictionary;
    featuredProperties?: PublicProperty[];
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

export default function HeroSlider({ lang = 'sk', dictionary, featuredProperties = [] }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [, setSwiperInstance] = useState<SwiperType | null>(null);

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

    return (
        <section className="relative z-40 h-[100dvh] min-h-[100dvh] md:min-h-[700px] md:h-screen w-full overflow-visible">
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false,
                }}
                loop
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex)}
                className="w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={slide.id}>
                        {/* Cinematic Gradient Overlay — top portion handled by header gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10" />

                        {/* Background Image with Ken Burns */}
                        <Image
                            src={slide.image}
                            alt={slide.location || 'Property'}
                            fill
                            className="object-cover"
                            style={{}}
                            priority={index === 0}
                        />

                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex items-end pb-52 sm:pb-60 md:pb-80">
                            <div className="container-custom px-4 sm:px-6">
                                {/* Location tag */}
                                <div className="flex items-center gap-2 mb-6 md:mb-8">
                                    <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    <span className="text-white text-sm sm:text-base font-medium">{slide.location}</span>
                                    {slide.country && (
                                        <>
                                            <span className="text-white/40">–</span>
                                            <span className="text-white/70 text-sm sm:text-base">{slide.country}</span>
                                        </>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <Link
                                    href={slide.ctaLink}
                                    className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-sm sm:text-base font-medium border border-white/20 hover:bg-white hover:text-[var(--color-secondary)] transition-all duration-300 active:scale-[0.98] tracking-wide"
                                >
                                    {slide.ctaLabel}
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Hero Search Component */}
            <HeroSearch lang={lang} dictionary={dictionary} />
        </section>
    );
}
