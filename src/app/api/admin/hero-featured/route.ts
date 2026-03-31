import { NextRequest, NextResponse } from 'next/server';
import { getHeroFeaturedPropertyIds, setHeroFeaturedProperties } from '@/lib/hero-featured-store';

export async function GET() {
    try {
        const ids = await getHeroFeaturedPropertyIds();
        return NextResponse.json({ propertyIds: ids });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { propertyIds } = await request.json();
        if (!Array.isArray(propertyIds)) {
            return NextResponse.json({ error: 'propertyIds must be an array' }, { status: 400 });
        }
        await setHeroFeaturedProperties(propertyIds);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
