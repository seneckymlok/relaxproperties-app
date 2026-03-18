import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllProperties, createProperty, permanentlyDeleteTrashedProperties } from '@/lib/property-store';
import { del } from '@vercel/blob';

// Auth check helper
async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

/**
 * Auto-purge trashed properties older than 30 days.
 * Runs in the background on every admin list load — fire-and-forget.
 */
async function autoPurgeTrash() {
    try {
        const { purged, imageUrls } = await permanentlyDeleteTrashedProperties(30);
        if (purged > 0) {
            console.log(`[auto-purge] Removed ${purged} trashed properties`);
            if (imageUrls.length > 0) {
                await del(imageUrls).catch(() => { });
            }
        }
    } catch (err) {
        // Silent fail — this is a background cleanup, not critical
        console.error('[auto-purge] Error:', err);
    }
}

/**
 * GET /api/admin/properties — List all properties
 */
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fire-and-forget: clean up old trash in the background
        autoPurgeTrash();

        const properties = await getAllProperties();
        return NextResponse.json({ properties });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST /api/admin/properties — Create a new property
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Strip save_mode and ensure new properties are drafts
        const { save_mode, ...data } = body;
        data.publish_status = data.publish_status || 'draft';
        const property = await createProperty(data);
        return NextResponse.json({ property }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
