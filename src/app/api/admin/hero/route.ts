import { NextRequest, NextResponse } from 'next/server';
import {
    getAllHeroImages,
    createHeroImage,
    updateHeroImage,
    deleteHeroImage,
    reorderHeroImages,
} from '@/lib/hero-store';

export async function GET() {
    try {
        const images = await getAllHeroImages();
        return NextResponse.json(images);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Handle reorder action
        if (body.action === 'reorder' && Array.isArray(body.orderedIds)) {
            await reorderHeroImages(body.orderedIds);
            return NextResponse.json({ success: true });
        }

        const image = await createHeroImage(body);
        return NextResponse.json(image, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...input } = body;
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const image = await updateHeroImage(id, input);
        return NextResponse.json(image);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await deleteHeroImage(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
