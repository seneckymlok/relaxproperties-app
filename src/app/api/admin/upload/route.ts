import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

// Cache the watermark buffer in memory (loaded once per cold start)
let watermarkBuffer: Buffer | null = null;

async function getWatermarkBuffer(): Promise<Buffer> {
    if (watermarkBuffer) return watermarkBuffer;

    const watermarkPath = path.join(process.cwd(), 'public', 'watermark.png');
    watermarkBuffer = fs.readFileSync(watermarkPath);
    return watermarkBuffer;
}

/**
 * Apply watermark to an image buffer.
 * Watermark is placed in the bottom-right corner, sized to ~20% of image width.
 */
async function applyWatermark(imageBuffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; ext: string }> {
    const wmRaw = await getWatermarkBuffer();
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const imgWidth = metadata.width || 1200;
    const imgHeight = metadata.height || 800;

    // Scale watermark to 10% of image width (half of previous 20%)
    const wmTargetWidth = Math.round(imgWidth * 0.1);
    const wmResized = await sharp(wmRaw)
        .resize({ width: wmTargetWidth, withoutEnlargement: true })
        .ensureAlpha()
        .png()
        .toBuffer();

    // Get resized watermark dimensions
    const wmMeta = await sharp(wmResized).metadata();
    const wmWidth = wmMeta.width || wmTargetWidth;
    const wmHeight = wmMeta.height || Math.round(wmTargetWidth * 0.5);

    // Reduce watermark opacity to 30%
    const wmWithOpacity = await sharp(wmResized)
        .composite([{
            input: Buffer.from(
                `<svg width="${wmWidth}" height="${wmHeight}"><rect x="0" y="0" width="${wmWidth}" height="${wmHeight}" fill="white" opacity="0.3"/></svg>`
            ),
            blend: 'dest-in',
        }])
        .png()
        .toBuffer();

    // Position: bottom-right with margin (2% of image dimensions)
    const marginX = Math.round(imgWidth * 0.02);
    const marginY = Math.round(imgHeight * 0.02);
    const left = imgWidth - wmWidth - marginX;
    const top = imgHeight - wmHeight - marginY;

    // Composite watermark onto image
    const composited = image.composite([{
        input: wmWithOpacity,
        left: Math.max(0, left),
        top: Math.max(0, top),
        blend: 'over',
    }]);

    // Output in the appropriate format
    let outputBuffer: Buffer;
    let ext: string;

    if (mimeType === 'image/png') {
        outputBuffer = await composited.png({ quality: 90 }).toBuffer();
        ext = 'png';
    } else if (mimeType === 'image/webp') {
        outputBuffer = await composited.webp({ quality: 85 }).toBuffer();
        ext = 'webp';
    } else if (mimeType === 'image/avif') {
        // AVIF compositing can be slow, output as WebP
        outputBuffer = await composited.webp({ quality: 85 }).toBuffer();
        ext = 'webp';
    } else {
        // Default: JPEG
        outputBuffer = await composited.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        ext = 'jpg';
    }

    return { buffer: outputBuffer, ext };
}

/**
 * POST /api/admin/upload — Upload image to Vercel Blob (with watermark)
 * Accepts multipart/form-data with a "file" field
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Nepovolený typ súboru. Povolené: JPG, PNG, WebP, AVIF' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Súbor je príliš veľký. Maximum je 10MB' },
                { status: 400 }
            );
        }

        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Check if watermark should be skipped (e.g. hero images are pre-cropped client-side)
        const skipWatermark = formData.get('skip_watermark') === '1';

        let finalBuffer: Buffer;
        let ext: string;

        if (skipWatermark) {
            // Determine extension from mime type
            const extMap: Record<string, string> = {
                'image/png': 'png',
                'image/webp': 'webp',
                'image/avif': 'webp',
                'image/jpeg': 'jpg',
            };
            ext = extMap[file.type] || 'jpg';
            finalBuffer = inputBuffer;
        } else {
            // Apply watermark
            const result = await applyWatermark(inputBuffer, file.type);
            finalBuffer = result.buffer;
            ext = result.ext;
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const folder = skipWatermark ? 'heroes' : 'properties';
        const filename = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Upload image to Vercel Blob
        const blob = await put(filename, finalBuffer, {
            access: 'public',
            addRandomSuffix: false,
        });

        return NextResponse.json({
            url: blob.url,
            filename: blob.pathname,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('Upload error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/upload — Delete image from Vercel Blob
 */
export async function DELETE(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        await del(url);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
