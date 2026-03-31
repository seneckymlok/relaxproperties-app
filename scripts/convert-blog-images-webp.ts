/**
 * Convert all blog post featured images to WebP format.
 * Downloads from Vercel Blob, converts via sharp, re-uploads, updates DB.
 *
 * Usage: npx tsx scripts/convert-blog-images-webp.ts
 */

import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import sharp from 'sharp';
import { put, del } from '@vercel/blob';

async function main() {
    const { getAdminClient } = await import('../src/lib/supabase');
    const supabase = getAdminClient();

    // Fetch all blog posts with images
    const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, image, title_sk')
        .neq('image', '')
        .not('image', 'is', null);

    if (error) { console.error('DB error:', error.message); process.exit(1); }

    const toConvert = (posts || []).filter(p =>
        p.image && !p.image.endsWith('.webp')
    );

    console.log(`📊 Total blog posts with images: ${posts?.length || 0}`);
    console.log(`🔄 Need webp conversion: ${toConvert.length}\n`);

    let converted = 0, failed = 0;

    for (const post of toConvert) {
        const title = (post.title_sk || '').substring(0, 50);
        process.stdout.write(`[${converted + failed + 1}/${toConvert.length}] ${title}... `);

        try {
            // 1. Download current image
            const res = await fetch(post.image);
            if (!res.ok) { console.log(`⚠️ download failed (${res.status})`); failed++; continue; }
            const inputBuffer = Buffer.from(await res.arrayBuffer());

            // 2. Convert to WebP
            const webpBuffer = await sharp(inputBuffer)
                .webp({ quality: 82 })
                .toBuffer();

            const savedKB = ((inputBuffer.length - webpBuffer.length) / 1024).toFixed(0);

            // 3. Upload new webp to Vercel Blob
            const filename = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
            const blob = await put(filename, webpBuffer, {
                access: 'public',
                addRandomSuffix: false,
            });

            // 4. Update DB record
            const { error: updateErr } = await supabase
                .from('blog_posts')
                .update({ image: blob.url })
                .eq('id', post.id);

            if (updateErr) { console.log(`⚠️ DB update failed: ${updateErr.message}`); failed++; continue; }

            // 5. Delete old blob
            try { await del(post.image); } catch { /* old blob may not be deletable */ }

            console.log(`✅ saved ${savedKB} KB`);
            converted++;
        } catch (err) {
            console.log(`❌ ${err}`);
            failed++;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Converted: ${converted}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`${'='.repeat(50)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
