"use client";

import Link from "next/link";
import Image from "next/image";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Dictionary } from "@/lib/dictionaries";
import type { PublicProperty } from "@/lib/data-access";

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
        const names: Record<string, Record<string, string>> = {
            croatia: { sk: 'Chorvátsko', en: 'Croatia', cz: 'Chorvatsko' },
            bulgaria: { sk: 'Bulharsko', en: 'Bulgaria', cz: 'Bulharsko' },
            spain: { sk: 'Španielsko', en: 'Spain', cz: 'Španělsko' },
            greece: { sk: 'Grécko', en: 'Greece', cz: 'Řecko' },
            italy: { sk: 'Taliansko', en: 'Italy', cz: 'Itálie' },
            portugal: { sk: 'Portugalsko', en: 'Portugal', cz: 'Portugalsko' },
            montenegro: { sk: 'Čierna Hora', en: 'Montenegro', cz: 'Černá Hora' },
        };
        // Dictionary override if available
        if (dictionary?.buyingProcess?.countries) {
            const countryData = dictionary.buyingProcess.countries[id as keyof typeof dictionary.buyingProcess.countries];
            if (countryData?.name) return countryData.name;
        }
        return names[id]?.[lang] || names[id]?.sk || id;
    };

    const getCount = (countryId: string): number => {
        if (properties.length === 0) return 0;
        return properties.filter(p => p.country === countryId).length;
    };

    const countries: CountryData[] = [
        {
            id: "croatia",
            name: getCountryName("croatia"),
            image: "/images/countries/croatia.webp",
            properties: getCount("croatia"),
        },
        {
            id: "bulgaria",
            name: getCountryName("bulgaria"),
            image: "/images/countries/bulgaria.webp",
            properties: getCount("bulgaria"),
        },
        {
            id: "spain",
            name: getCountryName("spain"),
            image: "/images/countries/spain.webp?v=2",
            properties: getCount("spain"),
        },
        {
            id: "greece",
            name: getCountryName("greece"),
            image: "/images/countries/greece.webp",
            properties: getCount("greece"),
        },
    ];

    const propertiesLabel = lang === 'en' ? 'properties' : lang === 'cz' ? 'nemovitostí' : 'nehnuteľností';
    const sectionRef = useScrollReveal<HTMLDivElement>({ stagger: 0.15 });

    function CountryCard({ country }: { country: CountryData }) {
        return (
            <Link
                href={`/${lang}/properties?country=${country.id}`}
                className="group relative block h-[clamp(13rem,35vw,20rem)] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform image-hover-lift"
            >
                {/* Background Image */}
                <Image
                    src={country.image}
                    alt={country.name}
                    fill
                    sizes="(max-width: 640px) 75vw, (max-width: 768px) 45vw, 25vw"
                    quality={60}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Refined Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-[clamp(1rem,3vw,1.75rem)]">
                    <h3 className="font-serif text-[clamp(1.25rem,3vw,1.875rem)] text-white mb-[clamp(0.625rem,1.5vw,1rem)]">
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
        <section className="relative z-0 py-[clamp(1.5rem,4vw,3.5rem)] bg-[var(--color-surface)]">
            <div ref={sectionRef} className="container-custom">
                {/* Mobile: Swipeable Carousel (Native CSS) */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-3 sm:space-x-4 pb-4 -mx-[var(--container-px)] px-[var(--container-px)]">
                    {countries.map((country) => (
                        <div key={country.id} className="w-[75vw] sm:w-[45vw] flex-shrink-0 snap-center">
                            <CountryCard country={country} />
                        </div>
                    ))}
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-4 gap-6">
                    {countries.map((country) => (
                        <div key={country.id} data-reveal>
                            <CountryCard country={country} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
