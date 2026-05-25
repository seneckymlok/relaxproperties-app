/**
 * GET  /api/admin/feeds  — list all feed sources
 * POST /api/admin/feeds  — create a new feed source
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllFeedSources, createFeedSource } from '@/lib/feed-store';
import { getAdminClient } from '@/lib/supabase';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const feeds = await getAllFeedSources();

        // Attach feed_items counts (total / selected) per feed
        const supabase = getAdminClient();
        const { data: counts } = await supabase
            .from('feed_items')
            .select('feed_source_id, selected')
            .eq('removed_from_feed', false);

        const countsByFeed = new Map<string, { total: number; selected: number }>();
        for (const c of counts || []) {
            const fid = c.feed_source_id as string;
            const entry = countsByFeed.get(fid) || { total: 0, selected: 0 };
            entry.total++;
            if (c.selected) entry.selected++;
            countsByFeed.set(fid, entry);
        }

        const feedsWithCounts = feeds.map(f => ({
            ...f,
            items_total: countsByFeed.get(f.id)?.total || 0,
            items_selected: countsByFeed.get(f.id)?.selected || 0,
        }));

        return NextResponse.json({ feeds: feedsWithCounts });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const body = await request.json();
        const feed = await createFeedSource({
            name: body.name,
            url: body.url,
            format: body.format || 'grekodom_xml',
            filter_config: body.filter_config || {},
            schedule_cron: body.schedule_cron || null,
            enabled: body.enabled ?? true,
        });
        return NextResponse.json({ feed }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
