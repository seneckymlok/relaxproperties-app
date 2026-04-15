import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { getAllProperties, updateProperty } from '@/lib/property-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

/**
 * GET /api/admin/migrate-images — Preview: count WebP images that need migration
 */
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await getAllProperties();
    let totalWebp = 0;
    let propertiesWithWebp = 0;

    for (const p of properties) {
        const webpCount = (p.images || []).filter(img => {
            const url = typeof img === 'string' ? img : img.url;
            return url.endsWith('.webp');
        }).length;
        if (webpCount > 0) {
            propertiesWithWebp++;
            totalWebp += webpCount;
        }
    }

    return NextResponse.json({
        totalProperties: properties.length,
        propertiesWithWebp,
        totalWebpImages: totalWebp,
    });
}

/**
 * POST /api/admin/migrate-images?limit=N
 *
 * Processes up to `limit` WebP images per call (default 5) to avoid
 * serverless timeout. Call repeatedly until remaining === 0.
 *
 * For each image:
 *   1. Download WebP from Vercel Blob
 *   2. Convert to JPEG via Sharp
 *   3. Upload JPEG to Vercel Blob
 *   4. Delete old WebP blob
 *   5. Update property images in the database
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20);

    const properties = await getAllProperties();

    // Collect all properties that still have WebP images
    const pending = properties.filter(p =>
        (p.images || []).some(img => {
            const url = typeof img === 'string' ? img : img.url;
            return url.endsWith('.webp');
        })
    );

    const migrated: { propertyId: string; title: string; count: number }[] = [];
    const errors: string[] = [];
    let imagesDone = 0;

    for (const p of pending) {
        if (imagesDone >= limit) break;

        const images = [...(p.images || [])];
        let propertyMigrated = 0;

        for (let i = 0; i < images.length; i++) {
            if (imagesDone >= limit) break;

            const img = images[i];
            const url = typeof img === 'string' ? img : img.url;
            if (!url.endsWith('.webp')) continue;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    errors.push(`Fetch failed ${url}: ${response.status}`);
                    continue;
                }

                const webpBuffer = Buffer.from(await response.arrayBuffer());
                const jpegBuffer = await sharp(webpBuffer).jpeg({ quality: 85 }).toBuffer();

                const pathParts = new URL(url).pathname.split('/');
                const blobPath = pathParts.slice(-2).join('/').replace(/\.webp$/, '.jpg');

                const blob = await put(blobPath, jpegBuffer, {
                    access: 'public',
                    addRandomSuffix: false,
                });

                await del(url);

                if (typeof images[i] === 'string') {
                    images[i] = blob.url as unknown as typeof images[0];
                } else {
                    (images[i] as { url: string }).url = blob.url;
                }

                propertyMigrated++;
                imagesDone++;
            } catch (err) {
                errors.push(`Error on ${url}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        if (propertyMigrated > 0) {
            const updatePayload: Record<string, unknown> = { images };

            // Mirror changes into draft_data.images if present
            if (p.draft_data && Array.isArray((p.draft_data as Record<string, unknown>).images)) {
                const draftImgs = (p.draft_data as Record<string, unknown>).images as Array<{ url: string } | string>;
                const updatedDraft = draftImgs.map(di => {
                    const dUrl = typeof di === 'string' ? di : di.url;
                    const idx = (p.images || []).findIndex(orig => {
                        const oUrl = typeof orig === 'string' ? orig : orig.url;
                        return oUrl === dUrl;
                    });
                    if (idx >= 0) {
                        const newUrl = typeof images[idx] === 'string'
                            ? images[idx] as unknown as string
                            : (images[idx] as { url: string }).url;
                        return typeof di === 'string' ? newUrl : { ...di, url: newUrl };
                    }
                    return di;
                });
                updatePayload.draft_data = { ...p.draft_data, images: updatedDraft };
            }

            await updateProperty(p.id, updatePayload as Parameters<typeof updateProperty>[1]);
            migrated.push({ propertyId: p.id, title: p.title_sk || p.id, count: propertyMigrated });
        }
    }

    // Count remaining after this batch
    const remainingProperties = await getAllProperties();
    const remaining = remainingProperties.reduce((sum, p) =>
        sum + (p.images || []).filter(img => {
            const url = typeof img === 'string' ? img : img.url;
            return url.endsWith('.webp');
        }).length, 0
    );

    return NextResponse.json({
        migrated: imagesDone,
        remaining,
        done: remaining === 0,
        details: migrated,
        errors,
    });
}
