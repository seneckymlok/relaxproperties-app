import type { MetadataRoute } from 'next';
import { getPropertiesServer, getBlogPostsServer } from '@/lib/data-access';

export const revalidate = 3600; // re-generate at most once per hour

const BASE = {
    sk: 'https://relaxproperties.sk',
    en: 'https://relaxproperties.eu',
    cz: 'https://relaxproperties.cz',
};

// hreflang helpers — BCP 47 codes (cs = Czech, not cz)
function alternates(path: string) {
    return {
        languages: {
            'x-default': `${BASE.sk}/sk${path}`,
            sk:          `${BASE.sk}/sk${path}`,
            en:          `${BASE.en}/en${path}`,
            cs:          `${BASE.cz}/cz${path}`,
        },
    };
}

const STATIC_PAGES: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
    { path: '',                  priority: 1.0, changeFrequency: 'daily'   },
    { path: '/properties',       priority: 0.9, changeFrequency: 'daily'   },
    { path: '/about',            priority: 0.7, changeFrequency: 'monthly' },
    { path: '/blog',             priority: 0.7, changeFrequency: 'weekly'  },
    { path: '/buying-process',   priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact',          priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy-policy',   priority: 0.2, changeFrequency: 'yearly'  },
    { path: '/cookie-policy',    priority: 0.2, changeFrequency: 'yearly'  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    // ── Static pages ──────────────────────────────────────────────────────────
    for (const page of STATIC_PAGES) {
        entries.push({
            url:             `${BASE.sk}/sk${page.path}`,
            lastModified:    new Date(),
            changeFrequency: page.changeFrequency,
            priority:        page.priority,
            alternates:      alternates(page.path),
        });
    }

    // ── Property detail pages ─────────────────────────────────────────────────
    try {
        const properties = await getPropertiesServer('sk');
        for (const property of properties) {
            const path = `/properties/${property.id}`;
            entries.push({
                url:             `${BASE.sk}/sk${path}`,
                lastModified:    new Date(),
                changeFrequency: 'weekly',
                priority:        0.8,
                alternates:      alternates(path),
            });
        }
    } catch {
        // silently skip — sitemap still valid without property pages
    }

    // ── Blog posts ────────────────────────────────────────────────────────────
    try {
        const posts = await getBlogPostsServer('sk');
        for (const post of posts) {
            const path = `/blog/${post.slug}`;
            entries.push({
                url:             `${BASE.sk}/sk${path}`,
                lastModified:    post.date ? new Date(post.date) : new Date(),
                changeFrequency: 'monthly',
                priority:        0.6,
                alternates:      alternates(path),
            });
        }
    } catch {
        // silently skip
    }

    return entries;
}
