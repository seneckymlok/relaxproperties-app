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
 * POST /api/admin/migrate-images — Convert all WebP property images to JPG
 *
 * For each property:
 *   1. Download each .webp image from Vercel Blob
 *   2. Convert to JPEG via Sharp
 *   3. Upload the JPEG to Vercel Blob
 *   4. Delete the old WebP blob
 *   5. Update the property's images array in the database
 *
 * Also migrates images inside draft_data if present.
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await getAllProperties();
    const results: { id: string; title: string; migrated: number; errors: string[] }[] = [];
    let totalMigrated = 0;
    let totalErrors = 0;

    for (const p of properties) {
        const images = p.images || [];
        const webpImages = images.filter(img => {
            const url = typeof img === 'string' ? img : img.url;
            return url.endsWith('.webp');
        });

        if (webpImages.length === 0) continue;

        const errors: string[] = [];
        let migrated = 0;
        const updatedImages = [...images];

        for (let i = 0; i < updatedImages.length; i++) {
            const img = updatedImages[i];
            const url = typeof img === 'string' ? img : img.url;
            if (!url.endsWith('.webp')) continue;

            try {
                // Download the WebP image
                const response = await fetch(url);
                if (!response.ok) {
                    errors.push(`Failed to fetch ${url}: ${response.status}`);
                    continue;
                }

                const webpBuffer = Buffer.from(await response.arrayBuffer());

                // Convert to JPEG
                const jpegBuffer = await sharp(webpBuffer)
                    .jpeg({ quality: 85 })
                    .toBuffer();

                // Generate new filename: same path but .jpg extension
                const oldUrl = new URL(url);
                const pathParts = oldUrl.pathname.split('/');
                const oldFilename = pathParts[pathParts.length - 1];
                const newFilename = oldFilename.replace(/\.webp$/, '.jpg');

                // Reconstruct the blob path (e.g. "properties/1234-abc.jpg")
                // Vercel Blob pathnames look like: /properties/1234-abc.webp
                const blobPath = pathParts.slice(-2).join('/').replace(/\.webp$/, '.jpg');

                // Upload JPEG to Vercel Blob
                const blob = await put(blobPath, jpegBuffer, {
                    access: 'public',
                    addRandomSuffix: false,
                });

                // Delete the old WebP blob
                await del(url);

                // Update the image entry
                if (typeof updatedImages[i] === 'string') {
                    updatedImages[i] = blob.url as unknown as typeof updatedImages[0];
                } else {
                    (updatedImages[i] as { url: string; alt: string; order: number }).url = blob.url;
                }

                migrated++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`Error converting ${url}: ${msg}`);
            }
        }

        if (migrated > 0) {
            // Update the property in the database
            const updatePayload: Record<string, unknown> = {
                images: updatedImages,
            };

            // Also update draft_data.images if present
            if (p.draft_data && Array.isArray((p.draft_data as Record<string, unknown>).images)) {
                const draftImages = (p.draft_data as Record<string, unknown>).images as Array<{ url: string; alt: string; order: number } | string>;
                const updatedDraftImages = draftImages.map(img => {
                    const url = typeof img === 'string' ? img : img.url;
                    // Find the matching migrated image by old URL pattern
                    const matchIdx = images.findIndex(origImg => {
                        const origUrl = typeof origImg === 'string' ? origImg : origImg.url;
                        return origUrl === url;
                    });
                    if (matchIdx >= 0 && updatedImages[matchIdx]) {
                        const newUrl = typeof updatedImages[matchIdx] === 'string'
                            ? updatedImages[matchIdx] as unknown as string
                            : (updatedImages[matchIdx] as { url: string }).url;
                        if (typeof img === 'string') return newUrl;
                        return { ...img, url: newUrl };
                    }
                    return img;
                });
                updatePayload.draft_data = { ...p.draft_data, images: updatedDraftImages };
            }

            await updateProperty(p.id, updatePayload as Parameters<typeof updateProperty>[1]);
        }

        totalMigrated += migrated;
        totalErrors += errors.length;
        results.push({
            id: p.id,
            title: p.title_sk || p.id,
            migrated,
            errors,
        });
    }

    return NextResponse.json({
        summary: {
            propertiesProcessed: results.length,
            totalImagesMigrated: totalMigrated,
            totalErrors,
        },
        details: results,
    });
}
