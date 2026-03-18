import { NextRequest, NextResponse } from 'next/server';
import { getAllPageHeroes, upsertPageHero, deletePageHero } from '@/lib/page-hero-store';

export async function GET() {
    try {
        const heroes = await getAllPageHeroes();
        return NextResponse.json(heroes);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { page_key, image_url } = await request.json();
        if (!page_key || !image_url) {
            return NextResponse.json({ error: 'Missing page_key or image_url' }, { status: 400 });
        }
        const hero = await upsertPageHero(page_key, image_url);
        return NextResponse.json(hero);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageKey = searchParams.get('page_key');
        if (!pageKey) {
            return NextResponse.json({ error: 'Missing page_key' }, { status: 400 });
        }
        await deletePageHero(pageKey);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
