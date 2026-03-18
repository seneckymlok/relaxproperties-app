import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPublishedProperties } from '@/lib/property-store';
import { toSoftrealXml } from '@/lib/export-formatters';

/**
 * POST /api/admin/sync/czech
 *
 * Generates XML from all published properties and POSTs it to the Czech Softreal CRM.
 * Protected by admin_session cookie OR a CRON_SECRET header for automated Vercel cron jobs.
 *
 * Softreal endpoint:
 *   https://s1.system.softreal.cz/relaxproperties/softreal/publicImportApi/importXml/{key}
 *
 * The export key is stored in SOFTREAL_EXPORT_KEY env var.
 */

const SOFTREAL_BASE_URL =
    'https://s1.system.softreal.cz/relaxproperties/softreal/publicImportApi/importXml';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
    // Allow Vercel cron jobs: Authorization: Bearer {CRON_SECRET}
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('authorization');
        if (authHeader === `Bearer ${cronSecret}`) return true;
    }

    // Allow admin panel requests
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportKey = process.env.SOFTREAL_EXPORT_KEY;
    if (!exportKey) {
        return NextResponse.json(
            {
                error: 'SOFTREAL_EXPORT_KEY environment variable is not set.',
                hint: 'Add SOFTREAL_EXPORT_KEY to your .env.local and Vercel environment variables.',
            },
            { status: 503 }
        );
    }

    try {
        const properties = await getPublishedProperties();
        const xml = toSoftrealXml(properties);

        const softrealUrl = `${SOFTREAL_BASE_URL}/${exportKey}`;

        const response = await fetch(softrealUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Accept': 'application/xml',
            },
            body: xml,
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`Softreal sync failed: ${response.status}`, responseText);
            return NextResponse.json(
                {
                    success: false,
                    propertiesCount: properties.length,
                    softrealStatus: response.status,
                    softrealResponse: responseText,
                    syncedAt: new Date().toISOString(),
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            propertiesCount: properties.length,
            softrealStatus: response.status,
            softrealResponse: responseText,
            syncedAt: new Date().toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Czech sync error:', error);
        return NextResponse.json(
            { success: false, error: message, syncedAt: new Date().toISOString() },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/sync/czech
 * Returns the current status / last sync info (no stored state yet — returns config status).
 */
export async function GET(request: NextRequest) {
    if (!(await isAuthenticated(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportKey = process.env.SOFTREAL_EXPORT_KEY;

    return NextResponse.json({
        configured: !!exportKey,
        softrealEndpoint: exportKey
            ? `${SOFTREAL_BASE_URL}/${exportKey}`
            : null,
        hint: !exportKey
            ? 'Set SOFTREAL_EXPORT_KEY in your environment variables to enable Czech sync.'
            : null,
    });
}
