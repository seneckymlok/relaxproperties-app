"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    video_url?: string;
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

function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export default function BlogPostPage() {
    const params = useParams();
    const lang = (params?.lang as string) || "sk";
    const slug = params?.slug as string;
    const validLang = (["sk", "en", "cz"].includes(lang) ? lang : "sk") as Language;
    const dictionary = getDictionary(validLang);
    const t = dictionary.blog as any;

    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFoundState, setNotFoundState] = useState(false);

    // Reading progress bar
    const [readProgress, setReadProgress] = useState(0);
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
            setReadProgress(progress);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch post and related posts
    useEffect(() => {
        (async () => {
            try {
                // Fetch the post
                const res = await fetch(`/api/blog/${slug}?lang=${validLang}`);
                if (!res.ok) {
                    setNotFoundState(true);
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setPost(data.post);

                // Fetch all posts for related
                const allRes = await fetch(`/api/blog?lang=${validLang}`);
                if (allRes.ok) {
                    const allData = await allRes.json();
                    const related = (allData.posts || [])
                        .filter((p: BlogPost) => p.category === data.post.category && p.id !== data.post.id)
                        .slice(0, 3);
                    setRelatedPosts(related);
                }
            } catch (err) {
                console.error("Error fetching blog post:", err);
                setNotFoundState(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, validLang]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <svg className="w-8 h-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    if (notFoundState || !post) {
        notFound();
    }

    // Format date
    const localeMap: Record<string, string> = { sk: "sk-SK", en: "en-GB", cz: "cs-CZ" };
    const formattedDate = new Date(post.date).toLocaleDateString(localeMap[validLang] || "sk-SK", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });



    return (
        <>
            {/* Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-[3px] bg-[var(--color-accent)] z-50 transition-all duration-150"
                style={{ width: `${readProgress}%` }}
            />

            {/* =============================================
                Hero — Cinematic full-bleed
                ============================================= */}
            <section className="relative bg-[var(--color-secondary)]" style={{ minHeight: '500px' }}>
                {post.image ? (
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-[var(--color-primary)]" />
                )}
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="container-custom" style={{ paddingBottom: '5rem' }}>
                        {/* Back + Category row */}
                        <div className="flex items-center gap-4 mb-5">
                            <Link
                                href={`/${validLang}/blog`}
                                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                {t.backToBlog}
                            </Link>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 bg-white/15 backdrop-blur-md rounded-full">
                                {translateCategory(post.category, validLang)}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white max-w-3xl mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Author row */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-medium">
                                {post.author.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="text-white/90 text-sm font-medium">{post.author}</span>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span className="text-white/70 text-sm">{formattedDate}</span>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span className="text-white/70 text-sm">{post.readTime} {t.readTime}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =============================================
                Article Content — Premium editorial
                ============================================= */}
            <article className="bg-white py-[clamp(2rem,4vw,4rem)]">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto">
                        {/* Lead excerpt with accent border */}
                        <div className="border-l-2 border-[var(--color-accent)] pl-6 mb-10">
                            <p className="text-lg md:text-xl text-[var(--color-secondary)] leading-relaxed font-serif italic">
                                {post.excerpt}
                            </p>
                        </div>
                        {/* Rich HTML content with scoped editorial styles */}
                        <div
                            className="blog-prose"
                            dangerouslySetInnerHTML={{ __html: post.content || "" }}
                        />

                        {/* Scoped editorial CSS for rich content */}
                        <style jsx global>{`
                            .blog-prose {
                                color: var(--color-foreground);
                                line-height: 1.8;
                                font-size: 1rem;
                            }
                            .blog-prose > *:first-child {
                                margin-top: 0;
                            }
                            .blog-prose h2 {
                                font-family: var(--font-serif), serif;
                                font-size: 1.75rem;
                                color: var(--color-secondary);
                                margin-top: 2.5rem;
                                margin-bottom: 1rem;
                                padding-bottom: 0.5rem;
                                border-bottom: 2px solid var(--color-accent);
                            }
                            .blog-prose h3 {
                                font-family: var(--font-serif), serif;
                                font-size: 1.35rem;
                                color: var(--color-secondary);
                                margin-top: 2rem;
                                margin-bottom: 0.75rem;
                            }
                            .blog-prose p {
                                margin-bottom: 1.25rem;
                            }
                            .blog-prose strong {
                                font-weight: 600;
                                color: var(--color-secondary);
                            }
                            .blog-prose em {
                                font-style: italic;
                            }
                            .blog-prose u {
                                text-decoration-color: var(--color-accent);
                                text-underline-offset: 3px;
                            }
                            .blog-prose ul {
                                list-style: none;
                                padding-left: 0;
                                margin-bottom: 1.5rem;
                            }
                            .blog-prose ul li {
                                position: relative;
                                padding-left: 1.5rem;
                                margin-bottom: 0.5rem;
                            }
                            .blog-prose ul li::before {
                                content: '';
                                position: absolute;
                                left: 0;
                                top: 0.6em;
                                width: 6px;
                                height: 6px;
                                border-radius: 50%;
                                background: var(--color-accent);
                            }
                            .blog-prose ol {
                                list-style: none;
                                padding-left: 0;
                                counter-reset: blog-counter;
                                margin-bottom: 1.5rem;
                            }
                            .blog-prose ol li {
                                counter-increment: blog-counter;
                                position: relative;
                                padding-left: 2.5rem;
                                margin-bottom: 0.75rem;
                                background: var(--color-surface);
                                border: 1px solid var(--color-border);
                                border-radius: 0.75rem;
                                padding: 1rem 1rem 1rem 3rem;
                            }
                            .blog-prose ol li::before {
                                content: counter(blog-counter);
                                position: absolute;
                                left: 0.75rem;
                                top: 50%;
                                transform: translateY(-50%);
                                width: 1.75rem;
                                height: 1.75rem;
                                border-radius: 50%;
                                background: var(--color-primary);
                                color: white;
                                font-size: 0.75rem;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            .blog-prose blockquote {
                                border-left: 3px solid var(--color-accent);
                                padding-left: 1.5rem;
                                margin: 1.5rem 0;
                                font-style: italic;
                                color: var(--color-secondary);
                                font-family: var(--font-serif), serif;
                                font-size: 1.1rem;
                            }
                            .blog-prose blockquote p {
                                margin-bottom: 0;
                            }
                            .blog-prose a {
                                color: var(--color-primary);
                                text-decoration: underline;
                                text-underline-offset: 2px;
                                transition: color 0.2s;
                            }
                            .blog-prose a:hover {
                                color: var(--color-primary-dark);
                            }
                            .blog-prose hr {
                                border: none;
                                height: 1px;
                                background: var(--color-border);
                                margin: 2.5rem 0;
                            }
                        `}</style>

                        {/* Video Embed */}
                        {post.video_url && (() => {
                            const videoId = getYouTubeId(post.video_url!);
                            return videoId ? (
                                <div className="mt-10">
                                    <h2 className="font-serif text-xl text-[var(--color-secondary)] mb-4">Video</h2>
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            title="Video"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            loading="lazy"
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Share & Tags */}
                        <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[var(--color-muted)]">{t.share}</span>
                                    <div className="flex gap-2">
                                        {[
                                            "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z",
                                            "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
                                            "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z",
                                        ].map((path, i) => (
                                            <button key={i} className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d={path} />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <span className="px-4 py-1.5 bg-[var(--color-surface)] rounded-full text-sm text-[var(--color-muted)]">
                                    {translateCategory(post.category, validLang)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* =============================================
                Related Posts — Magazine grid
                ============================================= */}
            {relatedPosts.length > 0 && (
                <section className="py-[clamp(2.5rem,5vw,6rem)] bg-[var(--color-surface)]">
                    <div className="container-custom">
                        <div className="text-center mb-12">
                            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3">
                                {t.featured}
                            </p>
                            <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-secondary)]">
                                {t.relatedArticles}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {relatedPosts.map((relatedPost) => (
                                <Link key={relatedPost.id} href={`/${validLang}/blog/${relatedPost.slug}`} className="group block">
                                    <article className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                        <div className="relative aspect-[16/10] overflow-hidden">
                                            {relatedPost.image ? (
                                                <Image
                                                    src={relatedPost.image}
                                                    alt={relatedPost.title}
                                                    fill
                                                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[var(--color-surface)]" />
                                            )}
                                            <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-sm rounded-full">
                                                {translateCategory(relatedPost.category, validLang)}
                                            </span>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-serif text-base text-[var(--color-secondary)] mb-2 line-clamp-2">
                                                {relatedPost.title}
                                            </h3>
                                            <p className="text-[var(--color-muted)] text-sm line-clamp-2 flex-1">
                                                {relatedPost.excerpt}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-3 pt-3 border-t border-[var(--color-border)]">
                                                <span>{relatedPost.author}</span>
                                                <span className="w-1 h-1 rounded-full bg-[var(--color-muted)]/40" />
                                                <span>{relatedPost.readTime} {t.readTime}</span>
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
                CTA — Premium band
                ============================================= */}
            <section className="py-[clamp(2.5rem,5vw,6rem)] bg-[var(--color-primary)]">
                <div className="container-custom text-center px-4 sm:px-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sand-light)] mb-4">
                        Relax Properties
                    </p>
                    <h2 className="font-serif text-2xl md:text-4xl text-white mb-6">
                        {t.ctaTitle}
                    </h2>
                    <p className="text-white/70 mb-10 max-w-xl mx-auto">
                        {t.ctaText}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <MagneticButton strength={0.15}>
                            <Link
                                href={`/${validLang}/properties`}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] font-medium rounded-full hover:bg-white/90 transition-colors"
                            >
                                {t.ctaButton}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </MagneticButton>
                        <MagneticButton strength={0.15}>
                            <Link
                                href={`/${validLang}/contact`}
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                            >
                                {dictionary.common.contactUs}
                            </Link>
                        </MagneticButton>
                    </div>
                </div>
            </section>
        </>
    );
}
