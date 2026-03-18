import { NextRequest, NextResponse } from 'next/server';
import { getPageHero } from '@/lib/page-hero-store';

export async function GET(request: NextRequest) {
    const pageKey = new URL(request.url).searchParams.get('page');
    if (!pageKey) {
        return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 });
    }

    try {
        const hero = await getPageHero(pageKey);
        return NextResponse.json({ image_url: hero?.image_url || null });
    } catch {
        return NextResponse.json({ image_url: null });
    }
}
