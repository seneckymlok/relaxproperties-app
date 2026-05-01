/**
 * PATCH  /api/admin/feeds/[id]                         — update feed source
 * DELETE /api/admin/feeds/[id]                         — delete feed only
 * DELETE /api/admin/feeds/[id]?deleteProperties=trash  — delete feed + trash its properties
 * DELETE /api/admin/feeds/[id]?deleteProperties=permanent — delete feed + hard-delete properties
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateFeedSource, deleteFeedSource, deletePropertiesByFeedSource } from '@/lib/feed-store';

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const deleteProperties = request.nextUrl.searchParams.get('deleteProperties'); // 'trash' | 'permanent' | null

    try {
        let deletedProperties = 0;

        // 1. Handle properties first (while feed_source_id FK still exists)
        if (deleteProperties === 'trash' || deleteProperties === 'permanent') {
            deletedProperties = await deletePropertiesByFeedSource(
                id,
                deleteProperties as 'trash' | 'permanent'
            );
        }

        // 2. Delete the feed itself (ON DELETE SET NULL will null out feed_source_id
        //    on any remaining properties that weren't touched above)
        await deleteFeedSource(id);

        return NextResponse.json({ ok: true, deletedProperties });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
