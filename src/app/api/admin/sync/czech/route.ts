import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPublishedProperties } from '@/lib/property-store';
import { toSoftrealXmlBatch, parseSoftrealResponse } from '@/lib/export-formatters';

/**
 * POST /api/admin/sync/czech
 *
 * Bulk-syncs all published properties marked for Softreal export.
 * Protected by admin_session cookie OR a CRON_SECRET header for automated Vercel cron jobs.
 *
 * Filters:
 *   - Only properties with export_target including 'softreal'
 *   - Only properties that have a CZ translation (title_cz)
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

interface SyncResult {
    externalId: string;
    propertyId: string;
    title: string;
    success: boolean;
    httpStatus: number;
    softrealId: number | null;
    resultCode: number | null;
    resultMessage: string | null;
    errorCode: number | null;
    errorMessage: string | null;
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
        const allProperties = await getPublishedProperties();

        // Filter: only properties marked for Softreal export AND with CZ translation
        const softrealProperties = allProperties.filter(p =>
            p.export_target?.includes('softreal') && p.title_cz
        );

        const skippedCount = allProperties.length - softrealProperties.length;

        if (softrealProperties.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No properties to sync — none are marked for Softreal export with CZ translations.',
                totalPublished: allProperties.length,
                skipped: skippedCount,
                exported: 0,
                succeeded: 0,
                failed: 0,
                results: [],
                syncedAt: new Date().toISOString(),
            });
        }

        const xmlBatch = toSoftrealXmlBatch(softrealProperties);
        const softrealUrl = `${SOFTREAL_BASE_URL}/${exportKey}`;

        // Softreal accepts one <foreign> per request — send each property individually
        const results: SyncResult[] = [];

        for (let i = 0; i < xmlBatch.length; i++) {
            const xml = xmlBatch[i];
            const property = softrealProperties[i];
            const externalId = property.property_id_external || property.id;

            try {
                const response = await fetch(softrealUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ data: xml }),
                });

                const responseText = await response.text();
                const parsed = parseSoftrealResponse(responseText);

                results.push({
                    externalId,
                    propertyId: property.id,
                    title: property.title_cz || property.title_sk,
                    success: parsed.success,
                    httpStatus: response.status,
                    softrealId: parsed.softrealId,
                    resultCode: parsed.resultCode,
                    resultMessage: parsed.resultMessage,
                    errorCode: parsed.errorCode,
                    errorMessage: parsed.errorMessage,
                });

                if (!parsed.success) {
                    console.error(
                        `[Softreal Sync] Failed for "${property.title_cz}" (${externalId}).` +
                        ` Result: ${parsed.resultCode} — ${parsed.resultMessage}.` +
                        (parsed.errorMessage
                            ? ` Error: ${parsed.errorMessage}${parsed.errorCode ? ` (${parsed.errorCode})` : ''}.`
                            : '')
                    );
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Network error';
                console.error(`[Softreal Sync] Network error for "${property.title_cz}" (${externalId}): ${msg}`);
                results.push({
                    externalId,
                    propertyId: property.id,
                    title: property.title_cz || property.title_sk,
                    success: false,
                    httpStatus: 0,
                    softrealId: null,
                    resultCode: null,
                    resultMessage: null,
                    errorCode: null,
                    errorMessage: msg,
                });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: failed === 0,
            totalPublished: allProperties.length,
            skipped: skippedCount,
            exported: softrealProperties.length,
            succeeded,
            failed,
            results,
            syncedAt: new Date().toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Softreal Sync] Fatal error:', error);
        return NextResponse.json(
            { success: false, error: message, syncedAt: new Date().toISOString() },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/sync/czech
 * Returns the current status / configuration info.
 */
export async function GET(request: NextRequest) {
    if (!(await isAuthenticated(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportKey = process.env.SOFTREAL_EXPORT_KEY;

    // Count how many properties would be exported
    let eligibleCount = 0;
    let totalPublished = 0;
    try {
        const allProperties = await getPublishedProperties();
        totalPublished = allProperties.length;
        eligibleCount = allProperties.filter(p =>
            p.export_target?.includes('softreal') && p.title_cz
        ).length;
    } catch {
        // Non-critical — just for info display
    }

    return NextResponse.json({
        configured: !!exportKey,
        softrealEndpoint: exportKey
            ? `${SOFTREAL_BASE_URL}/${exportKey}`
            : null,
        totalPublished,
        eligibleForExport: eligibleCount,
        hint: !exportKey
            ? 'Set SOFTREAL_EXPORT_KEY in your environment variables to enable Czech sync.'
            : null,
    });
}
