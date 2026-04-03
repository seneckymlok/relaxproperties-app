import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { getPropertyById, updateProperty, deleteProperty, saveDraft, publishProperty, trashProperty, restoreProperty } from '@/lib/property-store';
import { del } from '@vercel/blob';
import { pushToSoftreal, removeFromSoftreal } from '@/lib/softreal-export';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

/**
 * GET /api/admin/properties/[id] — Get single property
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const property = await getPropertyById(id);

        if (!property) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ property });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/properties/[id] — Update property
 * 
 * Accepts a `save_mode` field:
 *   - "auto"    → auto-save: for published properties, saves to draft_data only
 *   - "publish" → merges all data into main columns, clears draft, sets published
 *   - "restore" → restores a trashed property back to draft status
 *   - (default) → direct update to main columns (backwards compatible)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { save_mode, ...payload } = body;

        let property;

        if (save_mode === 'restore') {
            // Restore from trash → draft
            await restoreProperty(id);
            property = await getPropertyById(id);
            revalidateTag('properties');
        } else if (save_mode === 'publish') {
            // Publish: merge everything into main columns, clear draft_data
            property = await publishProperty(id, payload);
            revalidateTag('properties');

            // Push to Softreal if export_target is set (fire-and-forget)
            if (property.export_target?.includes('softreal')) {
                pushToSoftreal(property).catch(() => { });
            }
        } else if (save_mode === 'auto') {
            // Auto-save: check if property is already published
            const existing = await getPropertyById(id);
            if (existing && existing.publish_status === 'published') {
                // export_target is operational (controls feed inclusion), not content —
                // always write it directly to the main column, never to draft_data
                if (payload.export_target !== undefined && Object.keys(payload).length === 1) {
                    property = await updateProperty(id, { export_target: payload.export_target });
                } else {
                    // Published → save content edits to draft_data only
                    property = await saveDraft(id, payload);
                }
            } else {
                // Draft/new → save to main columns normally
                property = await updateProperty(id, payload);
            }
        } else {
            // Default: direct update (backwards compatible)
            property = await updateProperty(id, payload);
        }

        return NextResponse.json({ property });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/properties/[id] — Soft-delete (move to trash) or permanently delete
 * 
 * Query param `permanent=true` triggers hard delete with blob cleanup.
 * Default behavior is soft-delete (move to trash).
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const isPermanent = request.nextUrl.searchParams.get('permanent') === 'true';

        // 1. Fetch property
        const property = await getPropertyById(id);
        if (!property) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (isPermanent) {
            // ---- PERMANENT DELETE ----
            // Delete images from Vercel Blob storage
            if (property.images && property.images.length > 0) {
                const urlsToDelete = property.images.map(img => img.url);
                try {
                    await del(urlsToDelete);
                } catch (blobError) {
                    console.error("Warning: Failed to delete some images from Blob storage:", blobError);
                }
            }

            // Remove from Softreal if exported
            if (property.export_target?.includes('softreal')) {
                removeFromSoftreal(property.id, property.property_id_external).catch(() => { });
            }

            // Hard delete from database
            await deleteProperty(id);
            revalidateTag('properties');

            return NextResponse.json({ success: true, mode: 'permanent' });
        } else {
            // ---- SOFT DELETE (move to trash) ----
            // Remove from Softreal if exported
            if (property.export_target?.includes('softreal')) {
                removeFromSoftreal(property.id, property.property_id_external).catch(() => { });
            }

            await trashProperty(id);
            revalidateTag('properties');

            return NextResponse.json({ success: true, mode: 'trashed' });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
