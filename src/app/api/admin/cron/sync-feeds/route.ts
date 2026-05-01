/**
 * POST /api/admin/cron/sync-feeds
 *
 * Runs scheduled feed syncs. Called by an external cron service (e.g. Vercel Cron,
 * GitHub Actions, cron-job.org) every hour. Checks each enabled feed that has a
 * schedule_cron expression set and determines if it is due to run based on
 * last_synced_at.
 *
 * Auth: Bearer token via CRON_SECRET env var, OR admin session cookie.
 *
 * Body (optional): { feed_id: string } — sync a specific feed regardless of schedule.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllFeedSources, getFeedSourceById, updateFeedStatus } from '@/lib/feed-store';
import { IMPORTERS } from '@/lib/importers/registry';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
    // Check admin session cookie
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value === 'authenticated') return true;

    // Fallback: bearer token for cron services
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = request.headers.get('authorization');
        if (auth === `Bearer ${cronSecret}`) return true;
    }

    return false;
}

// Check if a cron expression is due relative to lastRun.
// Supports a simplified subset:
//   Exact hour: "0 3 * * *"  → daily at 03:00
//   Every N h:  "0 */6 * * *" → every 6 hours (note: slash inside // comment is fine)
//   Hourly:     "0 * * * *"
// Returns true if the cron was due at least once since lastRun (61-min grace window).
// For complex expressions consider cron-parser package in the future.
function isCronDue(cronExpr: string, lastRunISO: string | null): boolean {
    if (!cronExpr) return false;

    const now = new Date();
    const lastRun = lastRunISO ? new Date(lastRunISO) : null;

    // If never run, it's always due
    if (!lastRun) return true;

    const msSinceRun = now.getTime() - lastRun.getTime();
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return false; // not a standard cron

    const [, hourPart] = parts; // minute, hour, dom, month, dow

    // "*/N" — every N hours
    const everyMatch = hourPart.match(/^\*\/(\d+)$/);
    if (everyMatch) {
        const interval = parseInt(everyMatch[1]) * 60 * 60 * 1000;
        return msSinceRun >= interval - 61_000; // 61s grace
    }

    // "*" — every hour
    if (hourPart === '*') {
        return msSinceRun >= 60 * 60 * 1000 - 61_000;
    }

    // Specific hour: "0 3 * * *" — once per day at that hour
    const specificHour = parseInt(hourPart);
    if (!isNaN(specificHour)) {
        // Due if >23h since last run (daily cadence)
        return msSinceRun >= 23 * 60 * 60 * 1000;
    }

    return false;
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { feed_id?: string } = {};
    try { body = await request.json(); } catch { /* no body */ }

    const results: Array<{ id: string; name: string; status: 'ok' | 'skipped' | 'error'; stats?: object; error?: string }> = [];

    if (body.feed_id) {
        // Explicit single feed
        const feed = await getFeedSourceById(body.feed_id);
        if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });

        const importer = IMPORTERS[feed.format];
        if (!importer) {
            return NextResponse.json({ error: `No importer for format: ${feed.format}` }, { status: 400 });
        }

        await updateFeedStatus(feed.id, 'running');
        try {
            const stats = await importer(feed);
            await updateFeedStatus(feed.id, 'ok', stats);
            results.push({ id: feed.id, name: feed.name, status: 'ok', stats });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            await updateFeedStatus(feed.id, 'error', undefined, msg);
            results.push({ id: feed.id, name: feed.name, status: 'error', error: msg });
        }
    } else {
        // Scheduled run: check all enabled feeds
        const feeds = await getAllFeedSources();
        const due = feeds.filter(f => f.enabled && f.schedule_cron && isCronDue(f.schedule_cron, f.last_synced_at));

        console.log(`[sync-feeds] ${feeds.length} total feeds, ${due.length} due`);

        for (const feed of due) {
            const importer = IMPORTERS[feed.format];
            if (!importer) {
                results.push({ id: feed.id, name: feed.name, status: 'error', error: `Unknown format: ${feed.format}` });
                continue;
            }

            await updateFeedStatus(feed.id, 'running');
            try {
                const stats = await importer(feed);
                await updateFeedStatus(feed.id, 'ok', stats);
                results.push({ id: feed.id, name: feed.name, status: 'ok', stats });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                await updateFeedStatus(feed.id, 'error', undefined, msg);
                results.push({ id: feed.id, name: feed.name, status: 'error', error: msg });
            }
        }

        // Report feeds that were skipped (not due)
        feeds
            .filter(f => f.enabled && f.schedule_cron && !due.find(d => d.id === f.id))
            .forEach(f => results.push({ id: f.id, name: f.name, status: 'skipped' }));
    }

    const hasError = results.some(r => r.status === 'error');
    return NextResponse.json({ ok: !hasError, results }, { status: hasError ? 207 : 200 });
}
