/**
 * PATCH  /api/admin/feeds/[id]  — update a feed source
 * DELETE /api/admin/feeds/[id]  — delete a feed source
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateFeedSource, deleteFeedSource } from '@/lib/feed-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    try {
        const body = await request.json();
        const feed = await updateFeedSource(id, body);
        return NextResponse.json({ feed });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    try {
        await deleteFeedSource(id);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
