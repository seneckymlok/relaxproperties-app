import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { permanentlyDeleteTrashedProperties } from '@/lib/property-store';
import { del } from '@vercel/blob';

/**
 * POST /api/admin/cron/purge-trash
 * 
 * Permanently deletes trashed properties older than 30 days.
 * 
 * Can be triggered:
 *   1. Manually from the admin dashboard (authenticated via session cookie)
 *   2. By an external cron service using CRON_SECRET bearer token
 */
export async function POST(request: NextRequest) {
    // Check admin session cookie first
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('admin_session')?.value === 'authenticated';

    // Fallback: check bearer token for external cron services
    if (!isAdmin) {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const { purged, imageUrls } = await permanentlyDeleteTrashedProperties(30);

        // Clean up blob storage for deleted images
        if (imageUrls.length > 0) {
            try {
                await del(imageUrls);
            } catch (blobError) {
                console.error("Warning: Failed to delete some images from Blob storage:", blobError);
            }
        }

        return NextResponse.json({
            success: true,
            purged,
            imagesDeleted: imageUrls.length,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
