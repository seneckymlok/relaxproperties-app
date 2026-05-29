/**
 * POST /api/admin/feeds/[id]/retranslate
 *
 * Re-runs DeepL translation on all selected (already-materialized) properties
 * for this feed. Useful when an earlier import stored English fallback in
 * all three locales because DeepL was misconfigured.
 *
 * Body (optional): { item_ids?: string[] } — restrict to a subset
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedSourceById } from '@/lib/feed-store';
import { getImporter } from '@/lib/importers/registry';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export const maxDuration = 300;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const feed = await getFeedSourceById(id);
    if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });

    let body: { item_ids?: string[] } = {};
    try { body = await request.json(); } catch { /* */ }

    try {
        const importer = getImporter(feed.format);
        if (!importer.retranslate) {
            return NextResponse.json({ error: `Retranslate not supported for format: ${feed.format}` }, { status: 400 });
        }
        const result = await importer.retranslate(feed, { itemIds: body.item_ids });
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
