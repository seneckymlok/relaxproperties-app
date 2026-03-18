"use client";

import Link from "next/link";
import PropertyCard from "@/components/ui/PropertyCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Dictionary } from "@/lib/dictionaries";

import "swiper/css";
import "swiper/css/free-mode";

interface NewOffersProperty {
    id: string;
    title: string;
    location: string;
    price: number;
    priceFormatted: string;
    beds: number;
    baths: number;
    area: number;
    images: string[];
    featured: boolean;
    previewTags?: string[];
}

interface NewOffersProps {
    lang?: string;
    dictionary?: Dictionary;
    properties?: NewOffersProperty[];
}

export default function NewOffers({ lang = 'sk', dictionary, properties = [] }: NewOffersProps) {
    const newOffers = properties.slice(0, 4);
    const sectionSubtitle = lang === 'en' ? 'New Listings' : lang === 'cz' ? 'Nové nabídky' : 'Nové v ponuke';
    const sectionTitle = dictionary?.home?.newOffers || (lang === 'en' ? 'Latest Properties' : lang === 'cz' ? 'Nejnovější nemovitosti' : 'Najnovšie nehnuteľnosti');
    const viewAllLabel = lang === 'en' ? 'View all new listings' : lang === 'cz' ? 'Zobrazit všechny nové nabídky' : 'Zobraziť všetky nové ponuky';

    return (
        <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-white">
            <div className="container-custom px-4 sm:px-6">
                {/* Section Header */}
                <div className="text-center max-w-[42rem] mx-auto mb-10 sm:mb-12 md:mb-16">
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--color-secondary)]">
                        {sectionTitle}
                    </h2>
                </div>

                {/* Mobile: Horizontal Swipeable Carousel */}
                <div className="md:hidden -mx-4 px-4">
                    <Swiper
                        modules={[FreeMode]}
                        slidesPerView={1.15}
                        spaceBetween={12}
                        freeMode
                        breakpoints={{
                            480: { slidesPerView: 1.5, spaceBetween: 16 },
                            640: { slidesPerView: 2.1, spaceBetween: 16 },
                        }}
                        className="new-offers-swiper"
                    >
                        {newOffers.map((property) => (
                            <SwiperSlide key={property.id} className="!h-auto">
                                <PropertyCard
                                    id={property.id}
                                    title={property.title}
                                    location={property.location}
                                    price={property.priceFormatted}
                                    beds={property.beds}
                                    baths={property.baths}
                                    area={property.area}
                                    images={property.images}
                                    featured={property.featured}
                                    previewTags={property.previewTags}
                                    lang={lang}
                                    dictionary={dictionary}
                                    compact
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {newOffers.map((property) => (
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
                            featured={property.featured}
                            previewTags={property.previewTags}
                            lang={lang}
                            dictionary={dictionary}
                            compact
                        />
                    ))}
                </div>

                {/* CTA — refined outline pill */}
                <div className="mt-10 sm:mt-12 md:mt-16 text-center">
                    <Link
                        href={`/${lang}/properties?sort=newest`}
                        className="group inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 border border-[var(--color-border-dark)] hover:border-[var(--color-primary)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] font-medium rounded-full transition-all w-full sm:w-auto active:scale-[0.98] tracking-wide text-sm"
                    >
                        {viewAllLabel}
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
