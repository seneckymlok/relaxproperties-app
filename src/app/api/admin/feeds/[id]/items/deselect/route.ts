/**
 * POST /api/admin/feeds/[id]/items/deselect
 *
 * Body: { item_ids: string[], mode?: "trash" | "permanent" }
 *
 * Removes the materialized properties for the given feed_items and clears
 * their selected flag.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedSourceById } from '@/lib/feed-store';
import { getImporter } from '@/lib/importers/registry';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const feed = await getFeedSourceById(id);
    if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });

    let body: { item_ids?: string[]; mode?: 'trash' | 'permanent' } = {};
    try { body = await request.json(); } catch { /* */ }
    const itemIds = (body.item_ids || []).filter(Boolean);
    const mode = body.mode === 'permanent' ? 'permanent' : 'trash';
    if (itemIds.length === 0) return NextResponse.json({ error: 'item_ids required' }, { status: 400 });

    try {
        const importer = getImporter(feed.format);
        const result = await importer.deselect(feed, itemIds, mode);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
