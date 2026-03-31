"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/contexts/FavoritesContext";
import PropertyCard from "@/components/ui/PropertyCard";
import Link from "next/link";

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

export default function FavoritesPage() {
    const { favorites } = useFavorites();
    const pathname = usePathname();
    const lang = (pathname?.split('/')[1] || 'sk') as 'sk' | 'en' | 'cz';
    const [allProperties, setAllProperties] = useState<FavoriteProperty[]>([]);
    const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80");

    // Fetch properties and hero image on mount
    useEffect(() => {
        fetch('/api/properties')
            .then(res => res.json())
            .then(data => setAllProperties(data.properties || []))
            .catch(() => setAllProperties([]));

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
            <section className="relative h-64 md:h-80 bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                    }}
                />
                {/* Removed filter per user request */}
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                        Moje obľúbené
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-4">
                        Obľúbené nehnuteľnosti
                    </h1>
                    <p className="text-lg text-white/80">
                        {favoriteProperties.length > 0
                            ? `${favoriteProperties.length} ${favoriteProperties.length === 1 ? 'nehnuteľnosť' : favoriteProperties.length < 5 ? 'nehnuteľnosti' : 'nehnuteľností'} v zozname`
                            : 'Zatiaľ nemáte žiadne obľúbené nehnuteľnosti'}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-surface)]">
                <div className="container-custom">
                    {favoriteProperties.length > 0 ? (
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
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-white rounded-full border border-[var(--color-border)]">
                                <svg className="w-12 h-12 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <h2 className="font-serif text-2xl text-[var(--color-secondary)] mb-4">
                                Zatiaľ nemáte žiadne obľúbené
                            </h2>
                            <p className="text-[var(--color-muted)] mb-8 max-w-md mx-auto">
                                Kliknite na ikonu srdca pri nehnuteľnostiach, ktoré sa vám páčia, a uložte si ich sem pre rýchly prístup.
                            </p>
                            <Link
                                href="/properties"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                            >
                                Prehliadať nehnuteľnosti
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
