import { NextResponse } from 'next/server';
import { getPublishedProperties } from '@/lib/property-store';
import type { PropertyRecord } from '@/lib/property-store';

/**
 * GET /api/properties — Public endpoint for fetched published properties
 * Used by client components (NewOffers, PropertiesContent, etc.)
 * No authentication required — only returns published properties
 */

// Transform Supabase PropertyRecord → shape expected by public site
function toPublicProperty(p: PropertyRecord, lang: string = 'sk') {
    const title = lang === 'en' ? (p.title_en || p.title_sk) : lang === 'cz' ? (p.title_cz || p.title_sk) : p.title_sk;
    const location = lang === 'en' ? (p.location_en || p.location_sk) : lang === 'cz' ? (p.location_cz || p.location_sk) : p.location_sk;
    const description = lang === 'en' ? (p.description_en || p.description_sk) : lang === 'cz' ? (p.description_cz || p.description_sk) : p.description_sk;

    return {
        id: p.id,
        slug: p.slug,
        title,
        location,
        country: p.country,
        price: p.price,
        priceFormatted: p.price_on_request ? 'Cena na vyžiadanie' : `€ ${p.price.toLocaleString('en-US')}`,
        beds: p.beds,
        baths: p.baths,
        area: p.area,
        type: p.property_type,
        images: (p.images || []).map((img) => typeof img === 'string' ? img : img.url),
        featured: p.featured,
        year: p.year,
        parking: p.parking,
        pool: p.pool,
        balcony: p.balcony,
        garden: p.garden,
        description: description || undefined,
        seaView: p.sea_view,
        firstLine: p.first_line,
        newBuild: p.new_build,
        newProject: p.new_project,
        luxury: p.luxury,
        golf: p.golf,
        mountains: p.mountains,
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'sk';

        const records = await getPublishedProperties();
        const properties = records.map(r => toPublicProperty(r, lang));

        return NextResponse.json({ properties });
    } catch (error) {
        console.error('Failed to fetch public properties:', error);
        // Return empty array instead of error so the site doesn't break
        return NextResponse.json({ properties: [] });
    }
}
