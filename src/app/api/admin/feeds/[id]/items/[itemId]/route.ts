/**
 * GET /api/admin/feeds/[id]/items/[itemId] — full preview of a single feed item
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedItemById } from '@/lib/feed-items-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, itemId } = await params;
    const item = await getFeedItemById(itemId);
    if (!item || item.feed_source_id !== id) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
}
