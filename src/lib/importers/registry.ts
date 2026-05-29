/**
 * Feed Importer Registry
 *
 * Two-phase importer contract:
 *   - analyze(feed)                 → fetches + parses + filters + upserts feed_items
 *   - materialize(feed, itemIds)    → translates + creates/updates `properties`
 *   - deselect(feed, itemIds, mode) → removes properties for given feed_items
 *
 * Adding a new format:
 *   1. Implement analyze + materialize (+ optional deselect) in src/lib/importers/<name>.ts
 *   2. Register the trio below in IMPORTERS
 *   3. Add label + filter capabilities
 */

import type { FeedSource } from '@/lib/feed-store';
import type { ImportStats, MaterializeStats } from '@/lib/importers/grekodom';
import {
    analyzeGrekodomFeed,
    materializeGrekodomItems,
    deselectGrekodomItems,
    retranslateGrekodomItems,
} from '@/lib/importers/grekodom';
import {
    analyzeKyeroFeed,
    materializeKyeroItems,
    deselectKyeroItems,
    retranslateKyeroItems,
} from '@/lib/importers/kyero';

export type { ImportStats, MaterializeStats };

export interface AnalyzeOptions {
    onProgress?: (stats: ImportStats) => void;
}

export interface MaterializeOptions {
    onProgress?: (stats: MaterializeStats) => void;
    deeplApiKey?: string;
}

export interface FeedImporter {
    analyze: (feed: FeedSource, options?: AnalyzeOptions) => Promise<ImportStats>;
    materialize: (feed: FeedSource, itemIds: string[], options?: MaterializeOptions) => Promise<MaterializeStats>;
    deselect: (feed: FeedSource, itemIds: string[], mode?: 'trash' | 'permanent') => Promise<{ removed: number; errors: number }>;
    retranslate?: (feed: FeedSource, options?: { itemIds?: string[]; onProgress?: (done: number, total: number) => void }) => Promise<{ updated: number; skipped: number; errors: number; total: number }>;
}

export const IMPORTERS: Record<string, FeedImporter> = {
    grekodom_xml: {
        analyze: analyzeGrekodomFeed,
        materialize: materializeGrekodomItems,
        deselect: deselectGrekodomItems,
        retranslate: retranslateGrekodomItems,
    },
    kyero_xml: {
        analyze: analyzeKyeroFeed,
        materialize: materializeKyeroItems,
        deselect: deselectKyeroItems,
        retranslate: retranslateKyeroItems,
    },
};

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

export const FORMAT_LABELS: Record<string, string> = {
    grekodom_xml: 'Grekodom XML',
    kyero_xml: 'Kyero v3 (Estatebud)',
};

export interface FormatFilterCapabilities {
    estateTypes: string[] | null;
    priceRange: boolean;
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
    kyero_xml: {
        // Kyero/Estatebud values observed in the feed
        estateTypes: [
            'Apartment', 'Apartment Building', 'Detached House',
            'Semi-Detached House', 'Townhouse', 'Villa', 'Bungalow',
            'Penthouse', 'Studio', 'Maisonette', 'Duplex',
            'Land', 'Plot', 'Commercial', 'Office', 'Hotel',
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
