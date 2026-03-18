import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/blog-store';

/**
 * GET /api/blog/[slug] — Public single blog post by slug
 * Returns a published post with language-appropriate fields.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'sk';

        const p = await getBlogPostBySlug(slug);
        if (!p) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const title = lang === 'en' ? (p.title_en || p.title_sk) : lang === 'cz' ? (p.title_cz || p.title_sk) : p.title_sk;
        const excerpt = lang === 'en' ? (p.excerpt_en || p.excerpt_sk) : lang === 'cz' ? (p.excerpt_cz || p.excerpt_sk) : p.excerpt_sk;
        const content = lang === 'en' ? (p.content_en || p.content_sk) : lang === 'cz' ? (p.content_cz || p.content_sk) : p.content_sk;

        const post = {
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

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Blog post API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
