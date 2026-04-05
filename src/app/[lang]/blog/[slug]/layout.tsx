import type { Metadata } from 'next';
import type { Language } from '@/lib/data-access';

const BASE = {
    sk: 'https://relaxproperties.sk',
    en: 'https://relaxproperties.eu',
    cz: 'https://relaxproperties.cz',
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; lang: string }>;
}): Promise<Metadata> {
    const { slug, lang: rawLang } = await params;
    const lang = (['sk', 'en', 'cz'].includes(rawLang) ? rawLang : 'sk') as Language;

    try {
        const { getBlogPostBySlug } = await import('@/lib/blog-store');
        const post = await getBlogPostBySlug(slug);
        if (!post) return { title: 'Blog | Relax Properties' };

        const title =
            (lang === 'en' ? post.meta_title_en || post.title_en || post.title_sk
            : lang === 'cz' ? post.meta_title_cz || post.title_cz || post.title_sk
            : post.meta_title_sk || post.title_sk) || post.title_sk;

        const description = (
            lang === 'en' ? post.meta_description_en || post.excerpt_en || post.excerpt_sk
            : lang === 'cz' ? post.meta_description_cz || post.excerpt_cz || post.excerpt_sk
            : post.meta_description_sk || post.excerpt_sk
        )?.replace(/<[^>]*>/g, '').slice(0, 160) || '';

        const canonical = `${BASE[lang]}/${lang}/blog/${slug}`;

        return {
            title: `${title} | Relax Properties`,
            description,
            alternates: {
                canonical,
                languages: {
                    sk: `${BASE.sk}/sk/blog/${slug}`,
                    en: `${BASE.en}/en/blog/${slug}`,
                    cs: `${BASE.cz}/cz/blog/${slug}`,
                },
            },
            openGraph: {
                title: `${title} | Relax Properties`,
                description,
                type: 'article',
                publishedTime: post.published_at || undefined,
                authors: [post.author],
                images: post.image
                    ? [{ url: post.image, width: 1200, height: 630, alt: title }]
                    : undefined,
            },
        };
    } catch {
        return { title: 'Blog | Relax Properties' };
    }
}

export default async function BlogPostLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string; lang: string }>;
}) {
    const { slug, lang: rawLang } = await params;
    const lang = (['sk', 'en', 'cz'].includes(rawLang) ? rawLang : 'sk') as Language;

    let jsonLd: object | null = null;
    try {
        const { getBlogPostBySlug } = await import('@/lib/blog-store');
        const post = await getBlogPostBySlug(slug);
        if (post) {
            const title =
                (lang === 'en' ? post.title_en || post.title_sk
                : lang === 'cz' ? post.title_cz || post.title_sk
                : post.title_sk) || post.title_sk;
            const description = (
                lang === 'en' ? post.excerpt_en || post.excerpt_sk
                : lang === 'cz' ? post.excerpt_cz || post.excerpt_sk
                : post.excerpt_sk
            )?.replace(/<[^>]*>/g, '').slice(0, 300) || '';

            const canonical = `${BASE[lang]}/${lang}/blog/${slug}`;
            const langCode = lang === 'cz' ? 'cs' : lang;

            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: title,
                description,
                image: post.image || undefined,
                author: { '@type': 'Person', name: post.author },
                publisher: {
                    '@type': 'Organization',
                    name: 'Relax Properties',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://relaxproperties.sk/images/relax-logo.png',
                    },
                },
                datePublished: post.published_at || post.created_at,
                dateModified: post.updated_at || post.published_at || post.created_at,
                url: canonical,
                inLanguage: langCode,
                mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
            };
        }
    } catch {}

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
