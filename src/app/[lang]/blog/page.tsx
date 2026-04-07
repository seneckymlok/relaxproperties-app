"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Language } from "@/lib/data-access";
import MagneticButton from "@/components/ui/MagneticButton";

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    author: string;
    date: string;
    readTime: number;
    featured: boolean;
}

// Category name translations (DB stores Slovak names)
const categoryTranslations: Record<string, Record<string, string>> = {
    'Bulharsko': { en: 'Bulgaria', cz: 'Bulharsko', sk: 'Bulharsko' },
    'Chorvátsko': { en: 'Croatia', cz: 'Chorvatsko', sk: 'Chorvátsko' },
    'Grécko': { en: 'Greece', cz: 'Řecko', sk: 'Grécko' },
    'Španielsko': { en: 'Spain', cz: 'Španělsko', sk: 'Španielsko' },
    'Nehnuteľnosti': { en: 'Real Estate', cz: 'Nemovitosti', sk: 'Nehnuteľnosti' },
    'Investície': { en: 'Investments', cz: 'Investice', sk: 'Investície' },
    'Lifestyle': { en: 'Lifestyle', cz: 'Lifestyle', sk: 'Lifestyle' },
};

function translateCategory(category: string, lang: string): string {
    return categoryTranslations[category]?.[lang] || category;
}

export default function BlogPage() {
    const params = useParams();
    const lang = (params?.lang as string) || "sk";
    const validLang = (["sk", "en", "cz"].includes(lang) ? lang : "sk") as Language;
    const dictionary = getDictionary(validLang);
    const t = dictionary.blog as any;

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80");

    useEffect(() => {
        (async () => {
            try {
                const [blogRes, heroRes] = await Promise.all([
                    fetch(`/api/blog?lang=${validLang}`),
                    fetch('/api/page-heroes?page=blog'),
                ]);
                if (blogRes.ok) {
                    const data = await blogRes.json();
                    setPosts(data.posts || []);
                    setCategories(data.categories || []);
                }
                if (heroRes.ok) {
                    const heroData = await heroRes.json();
                    if (heroData.image_url) setHeroImage(heroData.image_url);
                }
            } catch (err) {
                console.error("Error fetching blog posts:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [validLang]);

    const featuredPosts = posts.filter((post) => post.featured);
    const filteredPosts =
        activeCategory === "all"
            ? posts
            : posts.filter((post) => post.category === activeCategory);

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* =============================================
                SECTION 1: Cinematic Hero
                ============================================= */}
            <section className="relative h-96 md:h-[500px] bg-[var(--color-primary)]">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url('${heroImage}')`,
                    }}
                />
                {/* Removed filter per user request */}
                <div className="relative container-custom h-full flex flex-col justify-center items-center text-center text-white pt-16">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-3">
                        {t.subtitle}
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">
                        {t.title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                        {t.heroText}
                    </p>
                </div>
            </section>

            {/* =============================================
                SECTION 2: Featured Posts
                ============================================= */}
            {featuredPosts.length > 0 && (
                <section className="py-[clamp(2.5rem,5vw,5rem)] bg-white">
                    <div className="container-custom">
                        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                            {t.featured}
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)] mb-10">
                            {t.featuredTitle}
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {featuredPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/${validLang}/blog/${post.slug}`}
                                    className="group block"
                                >
                                    <article className="relative h-full rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="relative aspect-[16/10]">
                                            {post.image ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[var(--color-surface)]" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                                <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                                                    {translateCategory(post.category, validLang)}
                                                </span>
                                                <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-white mb-3">
                                                    {post.title}
                                                </h3>
                                                <p className="text-white/70 text-sm md:text-base line-clamp-2 mb-4">
                                                    {post.excerpt}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-white/50">
                                                    <span>{post.author}</span>
                                                    <span>•</span>
                                                    <span>{post.readTime} {t.readTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* =============================================
                SECTION 3: All Posts + Category Filter
                ============================================= */}
            <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-background)]">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                                {t.allArticles}
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-secondary)]">
                                {t.latestPosts}
                            </h2>
                        </div>

                        {/* Functional Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveCategory("all")}
                                className={`px-4 py-2 text-sm rounded-full border transition-colors cursor-pointer ${activeCategory === "all"
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-teal)] hover:text-[var(--color-teal)]"
                                    }`}
                            >
                                {t.allCategories}
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-4 py-2 text-sm rounded-full border transition-colors cursor-pointer ${activeCategory === category
                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                        : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-teal)] hover:text-[var(--color-teal)]"
                                        }`}
                                >
                                    {translateCategory(category, validLang)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <svg className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-[var(--color-muted)]">{t.noPosts || "Žiadne články"}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPosts.map((post) => (
                                <Link key={post.id} href={`/${validLang}/blog/${post.slug}`} className="group block">
                                    <article className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                        <div className="relative aspect-[16/10] overflow-hidden">
                                            {post.image ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
                                                    <svg className="w-10 h-10 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-sm rounded-full">
                                                {translateCategory(post.category, validLang)}
                                            </span>
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="font-serif text-xl text-[var(--color-secondary)] mb-3">
                                                {post.title}
                                            </h3>
                                            <p className="text-[var(--color-muted)] text-sm line-clamp-2 mb-4 flex-1">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center justify-between text-sm text-[var(--color-muted)] pt-4 border-t border-[var(--color-border)]">
                                                <span>{post.author}</span>
                                                <span>{post.readTime} {t.readTime}</span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* =============================================
                SECTION 4: Bottom CTA
                ============================================= */}
            <section className="py-[clamp(2.5rem,5vw,5rem)] bg-[var(--color-surface)]">
                <div className="container-custom text-center px-4 sm:px-6">
                    <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-secondary)] mb-4">
                        {t.ctaTitle}
                    </h2>
                    <p className="text-[var(--color-muted)] mb-8 max-w-xl mx-auto">
                        {t.ctaText}
                    </p>
                    <MagneticButton strength={0.15}>
                        <Link
                            href={`/${validLang}/properties`}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            {t.ctaButton}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </MagneticButton>
                </div>
            </section>
        </div>
    );
}
