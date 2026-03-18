import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBlogPostById, updateBlogPost, deleteBlogPost, publishBlogPost } from '@/lib/blog-store';
import { del } from '@vercel/blob';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

/**
 * GET /api/admin/blog/[id] — Get single blog post
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const post = await getBlogPostById(id);

        if (!post) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ post });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/blog/[id] — Update blog post
 *
 * Accepts a `save_mode` field:
 *   - "publish" → sets publish_status to 'published' + published_at
 *   - (default) → direct update to main columns
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { save_mode, ...payload } = body;

        let post;
        if (save_mode === 'publish') {
            post = await publishBlogPost(id, payload);
        } else {
            post = await updateBlogPost(id, payload);
        }

        return NextResponse.json({ post });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/blog/[id] — Delete blog post
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Delete cover image from blob if exists
        const post = await getBlogPostById(id);
        if (post && post.image) {
            try {
                await del([post.image]);
            } catch (blobError) {
                console.error('Warning: Failed to delete blog image from Blob:', blobError);
            }
        }

        await deleteBlogPost(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
