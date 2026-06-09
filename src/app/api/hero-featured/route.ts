import { NextResponse } from 'next/server';
import { getHeroFeaturedPropertyIds } from '@/lib/hero-featured-store';

export async function GET() {
    try {
        const ids = await getHeroFeaturedPropertyIds();
        return NextResponse.json({ propertyIds: ids }, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
