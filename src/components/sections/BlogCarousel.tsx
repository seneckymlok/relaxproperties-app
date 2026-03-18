"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Dictionary } from "@/lib/dictionaries";

import "swiper/css";
import "swiper/css/free-mode";

interface BlogCarouselProps {
    lang?: string;
    dictionary?: Dictionary;
}

export default function BlogCarousel({ lang = 'sk', dictionary }: BlogCarouselProps) {
    const articles = lang === 'en' ? [
        {
            id: 1,
            title: "10 Reasons to Invest in Property in Croatia",
            excerpt: "Discover the advantages of investing in properties on the Adriatic coast...",
            date: "December 15, 2024",
            image: "/images/blog/blog1.jpg",
            category: "Investment",
            slug: "10-reasons-invest-croatia",
        },
        {
            id: 2,
            title: "How to Finance Property Purchase Abroad",
            excerpt: "A comprehensive guide to financing options for Slovak buyers...",
            date: "December 10, 2024",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
            category: "Finance",
            slug: "how-to-finance-property-purchase",
        },
        {
            id: 3,
            title: "Bulgaria vs. Spain: Where to Buy a Seaside Apartment?",
            excerpt: "Comparison of two popular destinations for property purchase...",
            date: "December 5, 2024",
            image: "/images/blog/blog2.jpg",
            category: "Comparison",
            slug: "bulgaria-vs-spain",
        },
    ] : lang === 'cz' ? [
        {
            id: 1,
            title: "10 důvodů proč investovat do nemovitosti v Chorvatsku",
            excerpt: "Objevte výhody investování do nemovitostí na jadranském pobřeží...",
            date: "15. prosince 2024",
            image: "/images/blog/blog1.jpg",
            category: "Investice",
            slug: "10-duvodu-investovat-chorvatsko",
        },
        {
            id: 2,
            title: "Jak financovat koupi nemovitosti v zahraničí",
            excerpt: "Komplexní průvodce možnostmi financování pro slovenské kupující...",
            date: "10. prosince 2024",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
            category: "Finance",
            slug: "jak-financovat-koupi-nemovitosti",
        },
        {
            id: 3,
            title: "Bulharsko vs. Španělsko: Kde koupit apartmán u moře?",
            excerpt: "Porovnání dvou populárních destinací pro koupi nemovitosti...",
            date: "5. prosince 2024",
            image: "/images/blog/blog2.jpg",
            category: "Porovnání",
            slug: "bulharsko-vs-spanelsko",
        },
    ] : [
        {
            id: 1,
            title: "10 dôvodov prečo investovať do nehnuteľnosti v Chorvátsku",
            excerpt: "Objavte výhody investovania do nehnuteľností na jadranskom pobreží...",
            date: "15. December 2024",
            image: "/images/blog/blog1.jpg",
            category: "Investície",
            slug: "10-dovodov-investovat-chorvatsko",
        },
        {
            id: 2,
            title: "Ako financovať kúpu nehnuteľnosti v zahraničí",
            excerpt: "Komplexný sprievodca možnosťami financovania pre slovenských kupujúcich...",
            date: "10. December 2024",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
            category: "Financie",
            slug: "ako-financovat-kupu-nehnutelnosti",
        },
        {
            id: 3,
            title: "Bulharsko vs. Španielsko: Kde kúpiť apartmán pri mori?",
            excerpt: "Porovnanie dvoch populárnych destinácií pre kúpu nehnuteľnosti...",
            date: "5. December 2024",
            image: "/images/blog/blog2.jpg",
            category: "Porovnanie",
            slug: "bulharsko-vs-spanielsko",
        },
    ];

    const sectionSubtitle = "Blog";
    const sectionTitle = lang === 'en' ? 'Useful Articles and Tips' : lang === 'cz' ? 'Užitečné články a tipy' : 'Užitočné články a tipy';
    const viewAllLabel = lang === 'en' ? 'View all articles' : lang === 'cz' ? 'Zobrazit všechny články' : 'Zobraziť všetky články';
    const readMoreLabel = lang === 'en' ? 'Read more' : lang === 'cz' ? 'Číst více' : 'Čítať viac';

    function BlogCard({ article, mobile = false }: { article: typeof articles[0]; mobile?: boolean }) {
        return (
            <Link
                href={`/${lang}/blog/${article.slug}`}
                className={`group block bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] ${mobile ? "active:scale-[0.98] transition-transform" : "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300"}`}
            >
                <div className={`relative ${mobile ? "h-40 sm:h-48" : "h-56"} overflow-hidden`}>
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Category badge — refined accent pill */}
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 bg-[var(--color-accent)]/90 text-white text-[10px] uppercase font-medium tracking-wider rounded-full backdrop-blur-sm">
                        {article.category}
                    </span>
                </div>
                <div className={mobile ? "p-4" : "p-6"}>
                    <p className="text-[10px] sm:text-xs text-[var(--color-muted)] mb-2 tracking-wide uppercase">
                        {article.date}
                    </p>
                    <h3 className={`${mobile ? "text-sm sm:text-base" : "text-lg"} font-medium text-[var(--color-secondary)] mb-2 sm:mb-3 line-clamp-2`}>
                        {article.title}
                    </h3>
                    <p className={`${mobile ? "text-xs sm:text-sm" : "text-sm"} text-[var(--color-muted)] line-clamp-2 mb-4`}>
                        {article.excerpt}
                    </p>
                    {/* Read more link */}
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-primary)] group-hover:gap-2.5 transition-all">
                        {readMoreLabel}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-white">
            <div className="container-custom px-4 sm:px-6">
                {/* Header */}
                <div className="text-center max-w-[42rem] mx-auto mb-10 sm:mb-12 md:mb-16">
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--color-secondary)]">
                        {sectionTitle}
                    </h2>
                </div>

                {/* Mobile: Swipeable Carousel */}
                <div className="md:hidden -mx-4 px-4">
                    <Swiper
                        modules={[FreeMode]}
                        slidesPerView={1.15}
                        spaceBetween={12}
                        freeMode
                        breakpoints={{
                            480: { slidesPerView: 1.3, spaceBetween: 16 },
                            640: { slidesPerView: 2, spaceBetween: 16 },
                        }}
                        className="blog-swiper"
                    >
                        {articles.map((article) => (
                            <SwiperSlide key={article.id} className="!h-auto">
                                <BlogCard article={article} mobile />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-3 gap-8 mb-12">
                    {articles.map((article) => (
                        <BlogCard key={article.id} article={article} />
                    ))}
                </div>

                {/* View All CTA */}
                <div className="mt-10 sm:mt-12 text-center">
                    <Link
                        href={`/${lang}/blog`}
                        className="group inline-flex items-center gap-2.5 text-[var(--color-secondary)] font-medium hover:text-[var(--color-primary)] transition-colors text-sm tracking-wide"
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
