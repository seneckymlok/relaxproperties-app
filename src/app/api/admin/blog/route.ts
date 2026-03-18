import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllBlogPosts, createBlogPost } from '@/lib/blog-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

/**
 * GET /api/admin/blog — List all blog posts
 */
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const posts = await getAllBlogPosts();
        return NextResponse.json({ posts });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST /api/admin/blog — Create a new blog post
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { save_mode, ...data } = body;
        data.publish_status = data.publish_status || 'draft';
        const post = await createBlogPost(data);
        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
