"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";

import "swiper/css";
import "swiper/css/free-mode";

interface CountryBannersProps {
    lang?: string;
    dictionary?: Dictionary;
    properties?: PublicProperty[];
}

interface CountryData {
    id: string;
    name: string;
    image: string;
    properties: number;
}

export default function CountryBanners({ lang = 'sk', dictionary, properties = [] }: CountryBannersProps) {
    const getCountryName = (id: string): string => {
        if (dictionary?.buyingProcess?.countries) {
            const countryData = dictionary.buyingProcess.countries[id as keyof typeof dictionary.buyingProcess.countries];
            return countryData?.name || id;
        }
        const fallback: Record<string, string> = {
            croatia: lang === 'en' ? 'Croatia' : lang === 'cz' ? 'Chorvatsko' : 'Chorvátsko',
            bulgaria: lang === 'en' ? 'Bulgaria' : lang === 'cz' ? 'Bulharsko' : 'Bulharsko',
            spain: lang === 'en' ? 'Spain' : lang === 'cz' ? 'Španělsko' : 'Španielsko',
            greece: lang === 'en' ? 'Greece' : lang === 'cz' ? 'Řecko' : 'Grécko',
        };
        return fallback[id] || id;
    };

    const getCount = (countryId: string): number => {
        if (properties.length === 0) return 0;
        return properties.filter(p => p.country === countryId).length;
    };

    const countries: CountryData[] = [
        {
            id: "croatia",
            name: getCountryName("croatia"),
            image: "/images/countries/croatia.jpg",
            properties: getCount("croatia"),
        },
        {
            id: "bulgaria",
            name: getCountryName("bulgaria"),
            image: "/images/countries/bulgaria.jpg",
            properties: getCount("bulgaria"),
        },
        {
            id: "spain",
            name: getCountryName("spain"),
            image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
            properties: getCount("spain"),
        },
        {
            id: "greece",
            name: getCountryName("greece"),
            image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
            properties: getCount("greece"),
        },
    ];

    const propertiesLabel = lang === 'en' ? 'properties' : lang === 'cz' ? 'nemovitostí' : 'nehnuteľností';

    function CountryCard({ country }: { country: CountryData }) {
        return (
            <Link
                href={`/${lang}/properties?country=${country.id}`}
                className="group relative block h-56 sm:h-64 md:h-72 lg:h-80 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            >
                {/* Background Image */}
                <Image
                    src={country.image}
                    alt={country.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Refined Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-7">
                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-white mb-3 sm:mb-4">
                        {country.name}
                    </h3>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-[11px] sm:text-xs font-medium border border-white/10">
                            {country.properties} {propertiesLabel}
                        </span>
                        <svg
                            className="w-4 h-4 text-white/50 transform group-hover:translate-x-1.5 group-hover:text-white transition-all duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <section className="relative z-0 py-6 sm:py-8 md:py-12 lg:py-14 bg-[var(--color-surface)]">
            <div className="container-custom px-4 sm:px-6">
                {/* Mobile: Swipeable Carousel */}
                <div className="md:hidden -mx-4 px-4">
                    <Swiper
                        modules={[FreeMode]}
                        slidesPerView={1.5}
                        spaceBetween={12}
                        freeMode
                        breakpoints={{
                            480: { slidesPerView: 2, spaceBetween: 16 },
                            640: { slidesPerView: 2.5, spaceBetween: 16 },
                        }}
                        className="countries-swiper"
                    >
                        {countries.map((country) => (
                            <SwiperSlide key={country.id} className="!h-auto">
                                <CountryCard country={country} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-4 gap-6">
                    {countries.map((country) => (
                        <CountryCard key={country.id} country={country} />
                    ))}
                </div>
            </div>
        </section>
    );
}
