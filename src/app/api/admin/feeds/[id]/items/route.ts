/**
 * GET /api/admin/feeds/[id]/items
 *
 * List parsed feed listings (feed_items) for a single feed source with
 * search, filters, pagination, and aggregate facets.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedSourceById } from '@/lib/feed-store';
import { listFeedItems } from '@/lib/feed-items-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

function parseList(value: string | null): string[] | undefined {
    if (!value) return undefined;
    return value.split(',').map(s => s.trim()).filter(Boolean);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const feed = await getFeedSourceById(id);
    if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });

    const sp = request.nextUrl.searchParams;
    const selectedRaw = sp.get('selected');
    const selected: boolean | null =
        selectedRaw === 'true' ? true : selectedRaw === 'false' ? false : null;

    try {
        const result = await listFeedItems({
            feedSourceId: id,
            search: sp.get('q') || undefined,
            estateTypes: parseList(sp.get('estate_types')),
            regions: parseList(sp.get('regions')),
            towns: parseList(sp.get('towns')),
            priceMin: sp.get('price_min') ? Number(sp.get('price_min')) : null,
            priceMax: sp.get('price_max') ? Number(sp.get('price_max')) : null,
            selected,
            includeRemoved: sp.get('include_removed') === 'true',
            page: sp.get('page') ? Number(sp.get('page')) : 1,
            pageSize: sp.get('page_size') ? Number(sp.get('page_size')) : 50,
            sort: (sp.get('sort') as 'recent' | 'price_asc' | 'price_desc' | 'uid') || 'recent',
        });
        return NextResponse.json({ ...result, feed });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
