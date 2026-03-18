import { NextRequest, NextResponse } from 'next/server';
import { getPublishedBlogPosts } from '@/lib/blog-store';

/**
 * GET /api/blog — Public blog posts list
 * Returns published posts with language-appropriate fields.
 * Used by public blog listing page.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'sk';

        const records = await getPublishedBlogPosts();

        const posts = records.map(p => {
            const title = lang === 'en' ? (p.title_en || p.title_sk) : lang === 'cz' ? (p.title_cz || p.title_sk) : p.title_sk;
            const excerpt = lang === 'en' ? (p.excerpt_en || p.excerpt_sk) : lang === 'cz' ? (p.excerpt_cz || p.excerpt_sk) : p.excerpt_sk;
            const content = lang === 'en' ? (p.content_en || p.content_sk) : lang === 'cz' ? (p.content_cz || p.content_sk) : p.content_sk;

            return {
                id: p.id,
                slug: p.slug,
                title,
                excerpt,
                content,
                image: p.image,
                category: p.category,
                author: p.author,
                date: p.published_at || p.created_at,
                readTime: p.read_time,
                featured: p.featured,
                video_url: p.video_url,
            };
        });

        // Extract unique categories from posts
        const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

        return NextResponse.json({ posts, categories });
    } catch (error) {
        console.error('Blog API error:', error);
        return NextResponse.json({ posts: [], categories: [] });
    }
}
