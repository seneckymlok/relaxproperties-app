"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/contexts/FavoritesContext";
import PropertyCard from "@/components/ui/PropertyCard";
import Link from "next/link";
import MagneticButton from "@/components/ui/MagneticButton";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";

interface FavoriteProperty {
    id: string;
    title: string;
    location: string;
    priceFormatted: string;
    beds: number;
    baths: number;
    area: number;
    images: string[];
    featured: boolean;
    previewTags?: string[];
}

function getCountLabel(count: number, lang: string, d: ReturnType<typeof getDictionary>): string {
    const f = d.favorites;
    if (lang === 'sk' || lang === 'cz') {
        const word = count === 1 ? f.countOne : count >= 2 && count <= 4 ? f.countFew : f.countMany;
        return `${count} ${word}`;
    }
    const word = count === 1 ? f.countOne : f.countMany;
    return `${count} ${word}`;
}

export default function FavoritesPage() {
    const { favorites } = useFavorites();
    const pathname = usePathname();
    const lang = (pathname?.split('/')[1] || 'sk') as Language;
    const d = getDictionary(lang);
    const [allProperties, setAllProperties] = useState<FavoriteProperty[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80");

    useEffect(() => {
        fetch('/api/properties')
            .then(res => res.json())
            .then(data => {
                setAllProperties(data.properties || []);
                setLoadingProperties(false);
            })
            .catch(() => {
                setAllProperties([]);
                setLoadingProperties(false);
            });

        fetch('/api/page-heroes?page=favorites')
            .then(res => res.json())
            .then(data => { if (data.image_url) setHeroImage(data.image_url); })
            .catch(() => {});
    }, []);

    const favoriteProperties = allProperties.filter((p) =>
        favorites.some(fav => String(fav) === String(p.id))
    );

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-80 sm:h-96 md:h-[400px] bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url('${heroImage}')` }}
                />
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                        {d.favorites.heroLabel}
                    </p>
                    <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4">
                        {d.favorites.heroTitle}
                    </h1>
                    <p className="text-lg text-white/80">
                        {favoriteProperties.length > 0
                            ? getCountLabel(favoriteProperties.length, lang, d)
                            : d.favorites.empty}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-surface)]">
                <div className="container-custom">
                    {loadingProperties ? (
                        <div className="text-center py-20 sm:py-32">
                            <svg className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : favoriteProperties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {favoriteProperties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    id={property.id}
                                    title={property.title}
                                    location={property.location}
                                    price={property.priceFormatted}
                                    beds={property.beds}
                                    baths={property.baths}
                                    area={property.area}
                                    images={property.images}
                                    previewTags={property.previewTags}
                                    lang={lang}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 sm:py-24 px-4">
                            <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center bg-white rounded-full border border-[var(--color-border)]">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-secondary)] mb-4 leading-tight">
                                {d.favorites.emptyTitle}
                            </h2>
                            <p className="text-[var(--color-muted)] mb-8 max-w-sm sm:max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                                {d.favorites.emptyDescription}
                            </p>
                            <MagneticButton strength={0.15}>
                                <Link
                                    href={`/${lang}/properties`}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-dark)] transition-colors"
                                >
                                    {d.favorites.browseProperties}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </MagneticButton>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
