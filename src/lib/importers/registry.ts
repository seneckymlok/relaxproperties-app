/**
 * Feed Importer Registry
 *
 * Single source of truth mapping feed `format` values to importer functions.
 * Both the manual-sync endpoint and the cron endpoint import from here,
 * so adding a new feed source type means:
 *   1. Write a new file in src/lib/importers/<name>.ts  (implement FeedImporter)
 *   2. Add one entry to IMPORTERS below
 *   3. Add the format option to the admin UI select in /admin/feeds/page.tsx
 *
 * Nothing else needs to change.
 */

import type { FeedSource } from '@/lib/feed-store';
import type { ImportStats } from '@/lib/importers/grekodom';
import { importGrekodomFeed } from '@/lib/importers/grekodom';

// -----------------------------------------------
// Shared importer type contract
// -----------------------------------------------

export interface ImporterOptions {
    /** Called after every batch with cumulative stats. Use for streaming progress UI. */
    onProgress?: (stats: ImportStats) => void;
}

export type FeedImporter = (
    feed: FeedSource,
    options?: ImporterOptions
) => Promise<ImportStats>;

// -----------------------------------------------
// Registry — add new formats here
// -----------------------------------------------

export const IMPORTERS: Record<string, FeedImporter> = {
    grekodom_xml: importGrekodomFeed,
    // example for a future format:
    // idealista_json: importIdealistaFeed,
};

// -----------------------------------------------
// Lookup helper with clear error
// -----------------------------------------------

export function getImporter(format: string): FeedImporter {
    const importer = IMPORTERS[format];
    if (!importer) {
        throw new Error(
            `No importer registered for format "${format}". ` +
            `Available formats: ${Object.keys(IMPORTERS).join(', ')}`
        );
    }
    return importer;
}

// -----------------------------------------------
// Human-readable format labels for the UI
// -----------------------------------------------

export const FORMAT_LABELS: Record<string, string> = {
    grekodom_xml: 'Grekodom XML',
    // add new labels here alongside new importers
};

// -----------------------------------------------
// Filter UI capability flags per format
// Tells the admin UI which filter sections to show for a given format
// -----------------------------------------------

export interface FormatFilterCapabilities {
    /** Does this feed expose a list of property/estate types to filter by? */
    estateTypes: string[] | null;
    /** Does this feed have a numeric price field to filter on? */
    priceRange: boolean;
    /** Does this feed have a region/area field to filter on? */
    regions: boolean;
}

export const FORMAT_FILTER_CAPABILITIES: Record<string, FormatFilterCapabilities> = {
    grekodom_xml: {
        estateTypes: [
            'Flat', 'Maisonette', 'Duplex', 'Detached house', 'Villa',
            'Land', 'Commercial property', 'Hotel', 'Business', 'Building', 'Complex',
        ],
        priceRange: true,
        regions: true,
    },
};

export function getFilterCapabilities(format: string): FormatFilterCapabilities {
    return FORMAT_FILTER_CAPABILITIES[format] ?? {
        estateTypes: null,
        priceRange: true,
        regions: false,
    };
}
