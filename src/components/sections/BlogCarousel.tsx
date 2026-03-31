"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import MagneticButton from "@/components/ui/MagneticButton";
import type { Dictionary } from "@/lib/dictionaries";

import "swiper/css";
import "swiper/css/free-mode";

interface BlogArticle {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
    category: string;
    author: string;
    readTime: number;
}

interface BlogCarouselProps {
    lang?: string;
    dictionary?: Dictionary;
}

export default function BlogCarousel({ lang = 'sk', dictionary }: BlogCarouselProps) {
    const [articles, setArticles] = useState<BlogArticle[]>([]);
    const [loading, setLoading] = useState(true);

    const sectionTitle = lang === 'en' ? 'Useful Articles and Tips' : lang === 'cz' ? 'Užitečné články a tipy' : 'Užitočné články a tipy';
    const viewAllLabel = lang === 'en' ? 'View all articles' : lang === 'cz' ? 'Zobrazit všechny články' : 'Zobraziť všetky články';
    const readMoreLabel = lang === 'en' ? 'Read more' : lang === 'cz' ? 'Číst více' : 'Čítať viac';
    const blogHeaderRef = useScrollReveal<HTMLDivElement>({ y: 40 });
    const blogGridRef = useScrollReveal<HTMLDivElement>({ stagger: 0.12, delay: 0.1 });

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const res = await fetch(`/api/blog?lang=${lang}`);
                const data = await res.json();
                // Take up to 3 most recent posts for the homepage carousel
                setArticles((data.posts || []).slice(0, 3));
            } catch {
                setArticles([]);
            } finally {
                setLoading(false);
            }
        }
        fetchBlogs();
    }, [lang]);

    function formatDate(dateStr: string) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'cz' ? 'cs-CZ' : 'sk-SK', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    }

    function BlogCard({ article, mobile = false }: { article: BlogArticle; mobile?: boolean }) {
        return (
            <Link
                href={`/${lang}/blog/${article.slug}`}
                className={`group block bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] ${mobile ? "active:scale-[0.98] transition-transform" : "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300"}`}
            >
                <div className={`relative ${mobile ? "h-[clamp(9rem,25vw,12rem)]" : "h-56"} overflow-hidden`}>
                    {article.image ? (
                        <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="w-full h-full bg-[var(--color-surface)]" />
                    )}
                    {article.category && (
                        <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 bg-[var(--color-accent)]/90 text-white text-[10px] uppercase font-medium tracking-wider rounded-full backdrop-blur-sm">
                            {article.category}
                        </span>
                    )}
                </div>
                <div className={mobile ? "p-4" : "p-6"}>
                    <p className="text-[10px] sm:text-xs text-[var(--color-muted)] mb-2 tracking-wide uppercase">
                        {formatDate(article.date)}
                    </p>
                    <h3 className={`${mobile ? "text-[clamp(0.875rem,2.5vw,1rem)]" : "text-lg"} font-medium text-[var(--color-secondary)] mb-2 sm:mb-3 line-clamp-2`}>
                        {article.title}
                    </h3>
                    <p className={`${mobile ? "text-[clamp(0.75rem,1.5vw,0.875rem)]" : "text-sm"} text-[var(--color-muted)] line-clamp-2 mb-4`}>
                        {article.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-teal)] group-hover:gap-2.5 transition-all">
                        {readMoreLabel}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </Link>
        );
    }

    // Don't render section if no blogs and done loading
    if (!loading && articles.length === 0) return null;

    return (
        <section className="py-[clamp(2.5rem,5vw,5rem)] bg-white">
            <div className="container-custom">
                {/* Header */}
                <div ref={blogHeaderRef} className="text-center max-w-[42rem] mx-auto mb-[clamp(2.5rem,4vw,4rem)]">
                    <h2 data-reveal className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] text-[var(--color-secondary)]">
                        {sectionTitle}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <svg className="w-8 h-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Swipeable Carousel */}
                        <div className="md:hidden -mx-[var(--container-px)] px-[var(--container-px)]">
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
                        <div ref={blogGridRef} className="hidden md:grid grid-cols-3 gap-8 mb-12">
                            {articles.map((article) => (
                                <div key={article.id} data-reveal>
                                    <BlogCard article={article} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* View All CTA */}
                <div className="mt-[clamp(2rem,3.5vw,3rem)] text-center">
                    <MagneticButton strength={0.15}>
                        <Link
                            href={`/${lang}/blog`}
                            className="group inline-flex items-center gap-2.5 text-[var(--color-secondary)] font-medium hover:text-[var(--color-teal)] transition-colors text-sm tracking-wide"
                        >
                            {viewAllLabel}
                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </MagneticButton>
                </div>
            </div>
        </section>
    );
}
