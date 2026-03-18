/**
 * Softreal Export — Push Module
 *
 * Handles pushing property data to the Czech Softreal CRM system.
 * Uses their publicImportApi endpoint to send XML data in real-time
 * whenever a property is published, updated, or deleted.
 *
 * Request format: application/x-www-form-urlencoded with field name "data"
 * XML schema: <foreign> root with <property> children
 *
 * This is a fire-and-forget operation — errors are logged but do NOT
 * block the main save operation.
 */

import type { PropertyRecord } from './property-store';
import { toSoftrealSingleXml, toSoftrealDeleteXml } from './export-formatters';

const SOFTREAL_API_URL = process.env.SOFTREAL_API_URL;

/**
 * Push a published property to Softreal.
 * Only sends if the property has CZ translations and export_target is 'softreal'.
 */
export async function pushToSoftreal(property: PropertyRecord): Promise<boolean> {
    if (!SOFTREAL_API_URL) {
        console.warn('[Softreal] SOFTREAL_API_URL not configured — skipping export');
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
        console.log(`[Softreal] XML payload:\n${xml}`);

        // Softreal expects: application/x-www-form-urlencoded with field "data"
        const response = await fetch(SOFTREAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: xml }),
        });

        const responseText = await response.text();

        const hasError = responseText.includes('<code>400</code>') ||
            responseText.includes('<code>500</code>') ||
            responseText.includes('<code>501</code>');

        if (response.ok && !hasError) {
            console.log(`[Softreal] ✅ Property ${property.id} pushed successfully. Response: ${responseText}`);
            return true;
        } else {
            console.error(`[Softreal] ❌ Push failed for property ${property.id}. Status: ${response.status}. Response: ${responseText}`);
            return false;
        }
    } catch (error) {
        console.error(`[Softreal] ❌ Network error pushing property ${property.id}:`, error);
        return false;
    }
}

/**
 * Send a deletion signal to Softreal when a property is removed.
 */
export async function removeFromSoftreal(propertyId: string, externalId?: string | null): Promise<boolean> {
    if (!SOFTREAL_API_URL) {
        console.warn('[Softreal] SOFTREAL_API_URL not configured — skipping removal');
        return false;
    }

    try {
        const id = externalId || propertyId;
        const xml = toSoftrealDeleteXml(id);

        console.log(`[Softreal] Sending removal for property ${propertyId} (externalId: ${id})...`);

        // Softreal expects: application/x-www-form-urlencoded with field "data"
        const response = await fetch(SOFTREAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: xml }),
        });

        const responseText = await response.text();

        if (response.ok) {
            console.log(`[Softreal] ✅ Removal sent for ${propertyId}. Response: ${responseText}`);
            return true;
        } else {
            console.error(`[Softreal] ❌ Removal failed for ${propertyId}. Status: ${response.status}. Response: ${responseText}`);
            return false;
        }
    } catch (error) {
        console.error(`[Softreal] ❌ Network error sending removal for ${propertyId}:`, error);
        return false;
    }
}
