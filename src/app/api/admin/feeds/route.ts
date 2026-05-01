/**
 * GET  /api/admin/feeds  — list all feed sources
 * POST /api/admin/feeds  — create a new feed source
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllFeedSources, createFeedSource } from '@/lib/feed-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
    if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const feeds = await getAllFeedSources();
        return NextResponse.json({ feeds });
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
