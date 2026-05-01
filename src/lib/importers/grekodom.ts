/**
 * Grekodom XML Feed Importer
 *
 * Streams and parses the grekodom.xml feed, applies per-feed filters,
 * translates EN→SK/CZ via DeepL, then upserts into the properties table.
 *
 * Feed structure: <feed><Realties><Realty>...</Realty>...</Realties></feed>
 * Size: ~54 MB / ~9,800 listings
 */

import { getAdminClient } from '@/lib/supabase';
import type { FeedSource, FeedFilterConfig } from '@/lib/feed-store';
import { generateSlug } from '@/lib/property-store';

// ============================================
// TYPE MAPPING TABLES
// ============================================

const ESTATE_TYPE_MAP: Record<string, string> = {
    'Flat': 'apartment',
    'Maisonette': 'townhouse',
    'Duplex': 'townhouse',
    'Detached house': 'house',
    'Villa': 'villa',
    'Land': 'land',
    'Commercial property': 'commercial',
    'Hotel': 'commercial',
    'Business': 'commercial',
    'Building': 'house',
    'Complex': 'house',
};

const OFFER_TYPE_MAP: Record<string, string> = {
    'For Sale': 'sale',
    'For Rent': 'rent',
};

/** Derives disposition from bedroom count */
function bedsToDisposition(beds: number, estateType: string): string {
    if (estateType === 'Land' || estateType === 'Commercial property' ||
        estateType === 'Hotel' || estateType === 'Business') return '';
    if (beds === 0) return 'studio';
    if (beds === 1) return '1kk';
    if (beds === 2) return '2kk';
    if (beds === 3) return '3kk';
    if (beds === 4) return '4kk';
    return '5kk';
}

// ============================================
// DEEPL TRANSLATION HELPER
// ============================================

async function translateBatch(texts: string[], targetLang: 'SK' | 'CS', apiKey: string): Promise<string[]> {
    if (!texts.length) return [];
    const nonEmpty = texts.map((t, i) => ({ t, i })).filter(({ t }) => t && t.trim());
    if (!nonEmpty.length) return texts.map(() => '');

    const freeUrl = 'https://api-free.deepl.com/v2/translate';
    const proUrl = 'https://api.deepl.com/v2/translate';
    const url = apiKey.endsWith(':fx') ? freeUrl : proUrl;

    // DeepL uses "CS" for Czech, "SK" for Slovak, source is English
    const params = new URLSearchParams();
    params.append('auth_key', apiKey);
    params.append('source_lang', 'EN');
    params.append('target_lang', targetLang);
    nonEmpty.forEach(({ t }) => params.append('text', t));

    const resp = await fetch(url, { method: 'POST', body: params });
    if (!resp.ok) {
        console.warn(`[grekodom] DeepL translate failed: ${resp.status}`);
        return texts; // fall back to English
    }
    const json = await resp.json() as { translations: { text: string }[] };
    const results = [...texts]; // copy
    nonEmpty.forEach(({ i }, idx) => {
        results[i] = json.translations[idx]?.text ?? texts[i];
    });
    return results;
}

// ============================================
// XML PARSER
// ============================================

interface GrekodomRealty {
    UniqueId: string;
    OfferType: string;
    EstateType: string;
    PriceByRequest: string;
    PriceInitial: string;
    Currency: string;
    TitleEn: string;
    DescriptionEn: string;
    YearBuild: string;
    LivingArea: string;
    LotSize: string;
    Floor: string;
    TotalFloors: string;
    TotalBedrooms: string;
    Bedrooms: string;
    TotalBathrooms: string;
    Bathrooms: string;
    TotalLivingRooms: string;
    TotalStorageRooms: string;
    DistanceFromSea: string;
    LatitudeNearBy: string;
    LongitudeNearBy: string;
    Region: string;
    Subregion: string;
    Town: string;
    CountryName: string;
    PostalCode: string;
    Pool: string;
    Garage: string;
    ParkingPlace: string;
    Fireplace: string;
    Aircondition: string;
    Lift: string;
    Furnished: string;
    Wifi: string;
    WithSeaView: string;
    WithMountainView: string;
    WithForrestView: string;
    WithCityView: string;
    IsNewBuilding: string;
    IsUnderConstruction: string;
    Luxury: string;
    GreatForInvestment: string;
    EnergyClass: string;
    YearRenovation: string;
    PriceWithDiscount: string;
    images: string[];
}

/** Parse the grekodom XML text into an array of Realty objects */
function parseGrekodomXml(xmlText: string): GrekodomRealty[] {
    const results: GrekodomRealty[] = [];

    // Split on <Realty> boundaries (memory-safe for large files)
    const blocks = xmlText.split('<Realty>');
    blocks.shift(); // drop everything before first <Realty>

    for (const block of blocks) {
        const end = block.indexOf('</Realty>');
        const content = end >= 0 ? block.slice(0, end) : block;

        const r: Partial<GrekodomRealty> & { images: string[] } = { images: [] };

        /** Extract first occurrence of a simple text tag */
        const tag = (name: string): string => {
            const m = content.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
            return m ? m[1].trim() : '';
        };
        const boolTag = (name: string): boolean => {
            const v = tag(name).toLowerCase();
            return v === 'yes' || v === 'true' || v === '1';
        };

        r.UniqueId = tag('UniqueId');
        if (!r.UniqueId) continue;

        r.OfferType = tag('OfferType');
        r.EstateType = tag('EstateType');
        r.PriceByRequest = tag('PriceByRequest');
        r.PriceInitial = tag('PriceInitial');
        r.Currency = tag('Currency');
        r.TitleEn = tag('TitleEn');
        r.DescriptionEn = tag('DescriptionEn');
        r.YearBuild = tag('YearBuild');
        r.LivingArea = tag('LivingArea');
        r.LotSize = tag('LotSize');
        r.Floor = tag('Floor');
        r.TotalFloors = tag('TotalFloors');
        r.TotalBedrooms = tag('TotalBedrooms');
        r.Bedrooms = tag('Bedrooms');
        r.TotalBathrooms = tag('TotalBathrooms');
        r.Bathrooms = tag('Bathrooms');
        r.TotalLivingRooms = tag('TotalLivingRooms');
        r.TotalStorageRooms = tag('TotalStorageRooms');
        r.DistanceFromSea = tag('DistanceFromSea');
        r.LatitudeNearBy = tag('LatitudeNearBy');
        r.LongitudeNearBy = tag('LongitudeNearBy');
        r.Region = tag('Region');
        r.Subregion = tag('Subregion');
        r.Town = tag('Town');
        r.CountryName = tag('CountryName');
        r.PostalCode = tag('PostalCode');
        r.Pool = boolTag('Pool') ? 'yes' : 'no';
        r.Garage = boolTag('Garage') ? 'yes' : 'no';
        r.ParkingPlace = boolTag('ParkingPlace') ? 'yes' : 'no';
        r.Fireplace = boolTag('Fireplace') ? 'yes' : 'no';
        r.Aircondition = boolTag('Aircondition') ? 'yes' : 'no';
        r.Lift = boolTag('Lift') ? 'yes' : 'no';
        r.Furnished = boolTag('Furnished') ? 'yes' : 'no';
        r.Wifi = boolTag('Wifi') ? 'yes' : 'no';
        r.WithSeaView = boolTag('WithSeaView') ? 'yes' : 'no';
        r.WithMountainView = boolTag('WithMountainView') ? 'yes' : 'no';
        r.WithForrestView = tag('WithForrestView');
        r.WithCityView = tag('WithCityView');
        r.IsNewBuilding = boolTag('IsNewBuilding') ? 'yes' : 'no';
        r.IsUnderConstruction = boolTag('IsUnderConstruction') ? 'yes' : 'no';
        r.Luxury = boolTag('Luxury') ? 'yes' : 'no';
        r.GreatForInvestment = boolTag('GreatForInvestment') ? 'yes' : 'no';
        r.EnergyClass = tag('EnergyClass');
        r.YearRenovation = tag('YearRenovation');
        r.PriceWithDiscount = tag('PriceWithDiscount');

        // Extract image URLs from <Pictures><Image>url</Image>...</Pictures>
        const picMatch = content.match(/<Pictures>([\s\S]*?)<\/Pictures>/);
        if (picMatch) {
            const imgMatches = [...picMatch[1].matchAll(/<Image>([\s\S]*?)<\/Image>/g)];
            r.images = imgMatches.map(m => m[1].trim()).filter(Boolean);
        }

        results.push(r as GrekodomRealty);
    }

    return results;
}

// ============================================
// FILTER APPLICATION
// ============================================

function applyFilters(realty: GrekodomRealty, config: FeedFilterConfig): boolean {
    if (config.estate_types && config.estate_types.length > 0) {
        if (!config.estate_types.includes(realty.EstateType)) return false;
    }
    if (config.offer_types && config.offer_types.length > 0) {
        if (!config.offer_types.includes(realty.OfferType)) return false;
    }
    if (config.regions && config.regions.length > 0) {
        if (!config.regions.includes(realty.Region)) return false;
    }
    const price = parseFloat(realty.PriceInitial) || 0;
    if (config.price_min && price > 0 && price < config.price_min) return false;
    if (config.price_max && price > config.price_max) return false;
    return true;
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

export interface ImportStats {
    total: number;
    filtered: number;
    added: number;
    updated: number;
    skipped: number;
    errors: number;
}

export async function importGrekodomFeed(
    feed: FeedSource,
    options: {
        deeplApiKey?: string;
        onProgress?: (stats: ImportStats) => void;
    } = {}
): Promise<ImportStats> {
    const supabase = getAdminClient();
    const stats: ImportStats = { total: 0, filtered: 0, added: 0, updated: 0, skipped: 0, errors: 0 };

    // ---- 1. Fetch the XML feed ----
    console.log(`[grekodom] Fetching feed: ${feed.url}`);
    const response = await fetch(feed.url, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(120_000), // 2 min timeout
    });
    if (!response.ok) throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);

    const xmlText = await response.text();
    console.log(`[grekodom] Feed fetched, ${(xmlText.length / 1024 / 1024).toFixed(1)} MB`);

    // ---- 2. Parse ----
    const realties = parseGrekodomXml(xmlText);
    stats.total = realties.length;
    console.log(`[grekodom] Parsed ${stats.total} realties`);

    // ---- 3. Apply filters ----
    const filtered = realties.filter(r => applyFilters(r, feed.filter_config));
    stats.filtered = filtered.length;
    console.log(`[grekodom] After filters: ${stats.filtered}`);

    // ---- 4. Process in batches ----
    const BATCH = 20;
    const deeplKey = options.deeplApiKey || process.env.DEEPL_API_KEY || '';

    for (let i = 0; i < filtered.length; i += BATCH) {
        const batch = filtered.slice(i, i + BATCH);

        // Check which already exist (to know add vs update, and skip manually_edited)
        const uids = batch.map(r => r.UniqueId);
        const { data: existing } = await supabase
            .from('properties')
            .select('id, external_feed_uid, manually_edited, slug')
            .eq('feed_source_id', feed.id)
            .in('external_feed_uid', uids);

        const existingMap = new Map(
            (existing || []).map(e => [e.external_feed_uid, e])
        );

        // Translate titles and descriptions for whole batch at once
        const titles = batch.map(r => r.TitleEn || '');
        const descs = batch.map(r => r.DescriptionEn || '');
        const allTexts = [...titles, ...descs];

        let titlesSk = titles;
        let titlesCs = titles;
        let descsSk = descs;
        let descsCs = descs;

        if (deeplKey && allTexts.some(t => t.trim())) {
            try {
                const skTranslations = await translateBatch(allTexts, 'SK', deeplKey);
                titlesSk = skTranslations.slice(0, batch.length);
                descsSk = skTranslations.slice(batch.length);

                const csTranslations = await translateBatch(allTexts, 'CS', deeplKey);
                titlesCs = csTranslations.slice(0, batch.length);
                descsCs = csTranslations.slice(batch.length);
            } catch (err) {
                console.warn(`[grekodom] Translation error in batch ${i}-${i + BATCH}:`, err);
                // Continue with English fallback
            }
        }

        // Upsert each property
        for (let j = 0; j < batch.length; j++) {
            const r = batch[j];
            try {
                const ex = existingMap.get(r.UniqueId);

                // Skip if manually edited
                if (ex?.manually_edited) {
                    stats.skipped++;
                    continue;
                }

                const beds = parseInt(r.TotalBedrooms || r.Bedrooms || '0') || 0;
                const baths = parseInt(r.TotalBathrooms || r.Bathrooms || '0') || 0;
                const area = parseFloat(r.LivingArea || '0') || 0;
                const price = parseFloat(r.PriceInitial || '0') || 0;
                const priceOnRequest = r.PriceByRequest?.toLowerCase() === 'yes';
                const propertyType = ESTATE_TYPE_MAP[r.EstateType] || 'apartment';
                const offerType = OFFER_TYPE_MAP[r.OfferType] || 'sale';
                const disposition = bedsToDisposition(beds, r.EstateType);
                const isNew = r.IsNewBuilding === 'yes';
                const isUnderConstruction = r.IsUnderConstruction === 'yes';

                // Build location string
                const locationParts = [r.Subregion, r.Region].filter(Boolean);
                const locationEn = locationParts.join(', ') || r.Town || 'Greece';

                // Build images array (hotlinked)
                const images = r.images.map((url, idx) => ({
                    url,
                    alt: r.TitleEn || `Property ${r.UniqueId}`,
                    order: idx,
                }));

                // Slug from title
                const baseSlug = generateSlug(
                    titlesSk[j] || r.TitleEn || `property-${r.UniqueId}`
                );
                const slug = ex?.slug || `${baseSlug}-${r.UniqueId}`;

                const record = {
                    // Source tracking
                    source: 'grekodom',
                    feed_source_id: feed.id,
                    external_feed_uid: r.UniqueId,
                    manually_edited: false,

                    // Slug
                    slug,

                    // Titles
                    title_sk: titlesSk[j] || r.TitleEn,
                    title_en: r.TitleEn || null,
                    title_cz: titlesCs[j] || r.TitleEn || null,

                    // Descriptions
                    description_sk: descsSk[j] || r.DescriptionEn || null,
                    description_en: r.DescriptionEn || null,
                    description_cz: descsCs[j] || r.DescriptionEn || null,

                    // Location
                    location_sk: locationParts[0] || r.Town || 'Grécko',
                    location_en: locationEn,
                    location_cz: locationEn,
                    country: 'greece',
                    city: r.Town || r.Subregion || r.Region || '',
                    latitude: parseFloat(r.LatitudeNearBy) || null,
                    longitude: parseFloat(r.LongitudeNearBy) || null,
                    distance_from_sea: parseInt(r.DistanceFromSea) || null,

                    // Specs
                    property_type: propertyType,
                    offer_type: offerType,
                    disposition: disposition || null,
                    beds,
                    baths,
                    area,
                    land_area: parseFloat(r.LotSize) || null,
                    floors: parseInt(r.TotalFloors) || null,
                    floor_number: parseInt(r.Floor) || null,
                    year: parseInt(r.YearBuild) || null,
                    parking: r.ParkingPlace === 'yes' ? 1 : 0,

                    // Price
                    price: priceOnRequest ? 0 : price,
                    price_on_request: priceOnRequest,
                    unit: 'per_property',

                    // Status
                    status: isUnderConstruction ? 'under_construction' : isNew ? 'new_build' : 'original',

                    // Boolean features
                    pool: r.Pool === 'yes',
                    balcony: false,
                    garden: false,
                    sea_view: r.WithSeaView === 'yes',
                    first_line: false,
                    new_build: isNew,
                    new_project: false,
                    luxury: r.Luxury === 'yes',
                    golf: false,
                    mountains: r.WithMountainView === 'yes',
                    garage: r.Garage === 'yes',
                    fireplace: r.Fireplace === 'yes',
                    near_beach: (parseInt(r.DistanceFromSea) || 9999) <= 500,

                    // Media
                    images,
                    hero_image_index: 0,
                    video_url: null,
                    pdf_images: [],

                    // Publish — imported props start as draft (hidden)
                    publish_status: 'draft',
                    featured: false,
                    reserved: false,

                    // Defaults for required fields
                    property_id_external: null,
                    ownership: null,
                    house_type: null,
                    building_type: null,
                    location_type: null,
                    location_description_sk: null,
                    location_description_en: null,
                    location_description_cz: null,
                    map_zoom: null,
                    available_from: null,
                    export_target: null,
                    tags: [],
                    preview_tags: [],
                    draft_data: null,
                    lodzia: false,
                    terasa: false,
                    cellar: false,
                    parking_spot: r.ParkingPlace === 'yes',
                    near_airport: false,
                    billiard_room: false,
                    near_golf: false,
                    yoga_room: false,
                    grand_garden: false,

                    updated_at: new Date().toISOString(),
                };

                if (ex) {
                    // Update existing — only update price, images, updated_at and non-translated fields
                    // (manually_edited = false entries get full update)
                    const { error } = await supabase
                        .from('properties')
                        .update({
                            price: record.price,
                            price_on_request: record.price_on_request,
                            images: record.images,
                            updated_at: record.updated_at,
                            // Update specs that may change
                            area: record.area,
                            beds: record.beds,
                            baths: record.baths,
                            status: record.status,
                            latitude: record.latitude,
                            longitude: record.longitude,
                        })
                        .eq('id', ex.id);

                    if (error) { stats.errors++; console.error(`[grekodom] Update error ${r.UniqueId}:`, error.message); }
                    else stats.updated++;
                } else {
                    // Insert new
                    const { error } = await supabase.from('properties').insert(record);
                    if (error) { stats.errors++; console.error(`[grekodom] Insert error ${r.UniqueId}:`, error.message); }
                    else stats.added++;
                }
            } catch (err) {
                stats.errors++;
                console.error(`[grekodom] Error processing ${r.UniqueId}:`, err);
            }
        }

        options.onProgress?.(stats);
        console.log(`[grekodom] Batch ${i}-${i + batch.length}: +${stats.added} upd:${stats.updated} skip:${stats.skipped} err:${stats.errors}`);

        // Small delay between batches to avoid overloading Supabase
        if (i + BATCH < filtered.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    return stats;
}
