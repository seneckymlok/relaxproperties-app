/**
 * POST /api/admin/feeds/[id]/sync
 *
 * Triggers an immediate sync for a single feed source.
 * Returns a streaming JSON response with progress updates so the admin UI
 * can show live progress (add/update/skip/error counts).
 *
 * Response: newline-delimited JSON (NDJSON)
 *   {"type":"progress","stats":{...}}
 *   {"type":"done","stats":{...}}
 *   {"type":"error","message":"..."}
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFeedSourceById, updateFeedStatus } from '@/lib/feed-store';
import { importGrekodomFeed } from '@/lib/importers/grekodom';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export const maxDuration = 300; // 5 min — Vercel Pro allows up to 5 min on hobby+

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const feed = await getFeedSourceById(id);
    if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    if (!feed.enabled) return NextResponse.json({ error: 'Feed is disabled' }, { status: 400 });

    // Mark as running
    await updateFeedStatus(id, 'running');

    // Use a streaming response so the client sees progress in real time
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (obj: unknown) => {
                controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
            };

            try {
                const stats = await importGrekodomFeed(feed, {
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
