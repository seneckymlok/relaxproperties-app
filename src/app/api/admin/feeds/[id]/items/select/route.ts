/**
 * POST /api/admin/feeds/[id]/items/select
 *
 * Body: { item_ids: string[] }
 *
 * Materializes the listed feed_items into the `properties` table. Streams
 * NDJSON progress events:
 *   {"type":"progress","stats":{...}}
 *   {"type":"done","stats":{...}}
 *   {"type":"error","message":"..."}
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
    const itemIds = (body.item_ids || []).filter(Boolean);
    if (itemIds.length === 0) {
        return NextResponse.json({ error: 'item_ids required' }, { status: 400 });
    }

    let importer: ReturnType<typeof getImporter>;
    try { importer = getImporter(feed.format); }
    catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
            try {
                const stats = await importer.materialize(feed, itemIds, {
                    onProgress: s => send({ type: 'progress', stats: s }),
                });
                send({ type: 'done', stats });
            } catch (err) {
                send({ type: 'error', message: err instanceof Error ? err.message : String(err) });
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        },
    });
}
