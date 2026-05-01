/**
 * POST /api/admin/feeds/[id]/sync
 *
 * Triggers an immediate sync for a single feed source.
 * Returns a streaming NDJSON response with live progress updates.
 *
 *   {"type":"progress","stats":{...}}
 *   {"type":"done","stats":{...}}
 *   {"type":"error","message":"..."}
 *
 * The importer to run is resolved from feed.format via the central registry,
 * so this endpoint works for any registered feed format — not just grekodom.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedSourceById, updateFeedStatus } from '@/lib/feed-store';
import { getImporter } from '@/lib/importers/registry';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export const maxDuration = 300; // 5 min

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const feed = await getFeedSourceById(id);
    if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    if (!feed.enabled) return NextResponse.json({ error: 'Feed is disabled' }, { status: 400 });

    // Validate format before starting the stream so we can return a clean 400
    let importer: ReturnType<typeof getImporter>;
    try {
        importer = getImporter(feed.format);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    await updateFeedStatus(id, 'running');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (obj: unknown) => {
                controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
            };

            try {
                const stats = await importer(feed, {
                    onProgress: (s) => send({ type: 'progress', stats: s }),
                });

                await updateFeedStatus(id, 'ok', {
                    added: stats.added,
                    updated: stats.updated,
                    skipped: stats.skipped,
                    errors: stats.errors,
                });

                send({ type: 'done', stats });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                await updateFeedStatus(id, 'error', undefined, message);
                send({ type: 'error', message });
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
