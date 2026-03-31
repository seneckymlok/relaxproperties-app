import { NextResponse } from 'next/server';
import { getPublishedProperties } from '@/lib/property-store';
import { toRealsoftXml } from '@/lib/export-formatters';

/**
 * GET /api/export/xml
 *
 * Public XML feed in RealSoft v1 format for Slovak advertising portals
 * (United Classifieds / nehnutelnosti.sk).
 *
 * Slovak portals pull this URL on their own schedule.
 * No authentication required — only published properties are included.
 *
 * Register this URL in the portal partner panel as:
 *   https://relaxproperties.sk/api/export/xml
 */
export async function GET() {
    try {
        const allProperties = await getPublishedProperties();
        const properties = allProperties.filter(p => p.export_target?.includes('sk'));
        const xml = toRealsoftXml(properties);

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline; filename="realsoft-export.xml"',
            },
        });
    } catch (error) {
        console.error('RealSoft XML feed error:', error);
        const fallback = '<?xml version="1.0" encoding="UTF-8"?><realEstateList></realEstateList>';
        return new NextResponse(fallback, {
            status: 500,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
