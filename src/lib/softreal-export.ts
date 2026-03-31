/**
 * Softreal Export — Push Module
 *
 * Handles pushing property data to the Czech Softreal CRM system.
 * Uses their publicImportApi endpoint to send XML data in real-time
 * whenever a property is published, updated, or deleted.
 *
 * API URL: https://s1.system.softreal.cz/relaxproperties/softreal/publicImportApi/importXml/{key}
 * Request format: application/x-www-form-urlencoded with field name "data"
 * XML schema: <foreign> root → <head>, <customer>, <attributes>, <images>
 *
 * Response: XML with <result><code>200|201</code><id>...</id></result> on success,
 *           <error><code>...</code><message>...</message></error> on failure.
 *
 * This is a fire-and-forget operation — errors are logged but do NOT
 * block the main save operation.
 */

import type { PropertyRecord } from './property-store';
import { toSoftrealSingleXml, toSoftrealDeleteXml, parseSoftrealResponse } from './export-formatters';

const SOFTREAL_BASE_URL =
    'https://s1.system.softreal.cz/relaxproperties/softreal/publicImportApi/importXml';

function getSoftrealUrl(): string | null {
    const key = process.env.SOFTREAL_EXPORT_KEY;
    if (!key) return null;
    return `${SOFTREAL_BASE_URL}/${key}`;
}

/**
 * Push a published property to Softreal.
 * Only sends if the property has CZ translations and export_target is 'softreal'.
 */
export async function pushToSoftreal(property: PropertyRecord): Promise<boolean> {
    const softrealUrl = getSoftrealUrl();
    if (!softrealUrl) {
        console.warn('[Softreal] SOFTREAL_EXPORT_KEY not configured — skipping export');
        return false;
    }

    if (!property.export_target?.includes('softreal')) {
        console.log(`[Softreal] Property ${property.id} — export_target does not include "softreal", skipping`);
        return false;
    }

    if (!property.title_cz) {
        console.warn(`[Softreal] Property ${property.id} — no CZ translation found, skipping export`);
        return false;
    }

    try {
        const xml = toSoftrealSingleXml(property);

        console.log(`[Softreal] Pushing property ${property.id} (${property.title_cz}) to Softreal...`);

        const response = await fetch(softrealUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: xml }),
        });

        const responseText = await response.text();
        const parsed = parseSoftrealResponse(responseText);

        if (parsed.success) {
            console.log(
                `[Softreal] Property ${property.id} pushed successfully.` +
                ` Softreal ID: ${parsed.softrealId}.` +
                ` Code: ${parsed.resultCode}. Message: ${parsed.resultMessage}`
            );
            return true;
        } else {
            console.error(
                `[Softreal] Push failed for property ${property.id}.` +
                ` Result code: ${parsed.resultCode}, message: ${parsed.resultMessage}.` +
                (parsed.errorMessage
                    ? ` Error: ${parsed.errorMessage}${parsed.errorCode ? ` (${parsed.errorCode})` : ''}.`
                    : '') +
                ` HTTP status: ${response.status}.`
            );
            return false;
        }
    } catch (error) {
        console.error(`[Softreal] Network error pushing property ${property.id}:`, error);
        return false;
    }
}

/**
 * Send a deletion signal to Softreal when a property is removed.
 */
export async function removeFromSoftreal(property: PropertyRecord): Promise<boolean>;
export async function removeFromSoftreal(propertyId: string, externalId?: string | null): Promise<boolean>;
export async function removeFromSoftreal(
    propertyOrId: PropertyRecord | string,
    externalId?: string | null,
): Promise<boolean> {
    const softrealUrl = getSoftrealUrl();
    if (!softrealUrl) {
        console.warn('[Softreal] SOFTREAL_EXPORT_KEY not configured — skipping removal');
        return false;
    }

    try {
        let id: string;
        let xml: string;

        if (typeof propertyOrId === 'string') {
            id = externalId || propertyOrId;
            xml = toSoftrealDeleteXml(id);
        } else {
            // Full property record — use correct reality_type and relation_type
            const p = propertyOrId;
            id = p.property_id_external || p.id;
            const TYPE_TO_RT: Record<string, number> = {
                villa: 6, apartment: 4, house: 6, land: 3,
                commercial: 2, penthouse: 4, townhouse: 6, studio: 4,
            };
            const realityType = TYPE_TO_RT[p.property_type] ?? 4;
            const relationType = p.offer_type === 'rent' ? 2 : 1;
            xml = toSoftrealDeleteXml(id, realityType, relationType);
        }

        console.log(`[Softreal] Sending removal for property ${id}...`);

        const response = await fetch(softrealUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: xml }),
        });

        const responseText = await response.text();
        const parsed = parseSoftrealResponse(responseText);

        if (parsed.success) {
            console.log(`[Softreal] Removal sent for ${id}. Code: ${parsed.resultCode}. Message: ${parsed.resultMessage}`);
            return true;
        } else {
            console.error(
                `[Softreal] Removal failed for ${id}.` +
                ` Result code: ${parsed.resultCode}, message: ${parsed.resultMessage}.` +
                (parsed.errorMessage
                    ? ` Error: ${parsed.errorMessage}${parsed.errorCode ? ` (${parsed.errorCode})` : ''}.`
                    : '') +
                ` HTTP status: ${response.status}.`
            );
            return false;
        }
    } catch (error) {
        console.error(`[Softreal] Network error sending removal:`, error);
        return false;
    }
}
