/**
 * Convert all property images to WebP format.
 * Each property has an `images` JSONB column: [{ url, alt, order }]
 * Downloads each image, converts to WebP via sharp, re-uploads, updates DB.
 *
 * Usage: npx tsx scripts/convert-property-images-webp.ts
 */

import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import sharp from 'sharp';
import { put, del } from '@vercel/blob';

interface PropertyImage {
    url: string;
    alt: string;
    order: number;
}

async function main() {
    const { getAdminClient } = await import('../src/lib/supabase');
    const supabase = getAdminClient();

    // Fetch all properties with images
    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title_sk, images');

    if (error) { console.error('DB error:', error.message); process.exit(1); }
    if (!properties?.length) { console.log('No properties found.'); return; }

    // Count images needing conversion
    let totalImages = 0;
    let needConversion = 0;
    for (const prop of properties) {
        const imgs = (prop.images || []) as PropertyImage[];
        totalImages += imgs.length;
        needConversion += imgs.filter(i => i.url && !i.url.endsWith('.webp')).length;
    }

    console.log(`📊 Total properties: ${properties.length}`);
    console.log(`🖼️  Total images: ${totalImages}`);
    console.log(`🔄 Need WebP conversion: ${needConversion}\n`);

    if (needConversion === 0) {
        console.log('✅ All images are already WebP!');
        return;
    }

    let converted = 0, failed = 0, skipped = 0;
    let totalSavedKB = 0;

    for (let pi = 0; pi < properties.length; pi++) {
        const prop = properties[pi];
        const images = (prop.images || []) as PropertyImage[];
        const title = (prop.title_sk || '').substring(0, 45);

        // Check if any images need conversion
        const hasNonWebp = images.some(i => i.url && !i.url.endsWith('.webp'));
        if (!hasNonWebp) continue;

        console.log(`\n[${pi + 1}/${properties.length}] ${title} (${images.length} images)`);

        const updatedImages: PropertyImage[] = [];
        let changed = false;

        for (let ii = 0; ii < images.length; ii++) {
            const img = images[ii];

            if (!img.url || img.url.endsWith('.webp')) {
                updatedImages.push(img);
                continue;
            }

            try {
                // Download
                const res = await fetch(img.url);
                if (!res.ok) {
                    console.log(`  ⚠️ [${ii + 1}] download failed (${res.status})`);
                    updatedImages.push(img); // keep original
                    failed++;
                    continue;
                }

                const inputBuffer = Buffer.from(await res.arrayBuffer());

                // Convert to WebP
                const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();
                const savedKB = (inputBuffer.length - webpBuffer.length) / 1024;
                totalSavedKB += savedKB;

                // Upload new WebP
                const filename = `properties/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
                const blob = await put(filename, webpBuffer, {
                    access: 'public',
                    addRandomSuffix: false,
                });

                updatedImages.push({ url: blob.url, alt: img.alt, order: img.order });
                changed = true;
                converted++;

                // Delete old blob
                try { await del(img.url); } catch { /* ok */ }

                process.stdout.write(`  ✅ [${ii + 1}] ${savedKB > 0 ? '-' : '+'}${Math.abs(savedKB).toFixed(0)} KB  `);
            } catch (err) {
                console.log(`  ❌ [${ii + 1}] ${err}`);
                updatedImages.push(img);
                failed++;
            }
        }

        // Update DB if any images changed
        if (changed) {
            const { error: updateErr } = await supabase
                .from('properties')
                .update({ images: updatedImages })
                .eq('id', prop.id);

            if (updateErr) {
                console.log(`\n  ⚠️ DB update failed: ${updateErr.message}`);
            } else {
                console.log(`\n  💾 DB updated`);
            }
        }
    }

    console.log(`\n${'='.repeat(55)}`);
    console.log(`✅ Converted: ${converted} images`);
    console.log(`❌ Failed:    ${failed}`);
    console.log(`💾 Total saved: ${(totalSavedKB / 1024).toFixed(1)} MB`);
    console.log(`${'='.repeat(55)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
