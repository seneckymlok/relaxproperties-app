/**
 * Grekodom XML Feed Importer
 *
 * Two-phase model:
 *   1. analyze   — fetches XML, parses, applies filters, upserts into feed_items.
 *                  No DeepL, no properties writes. Cheap to re-run.
 *   2. materialize — takes a set of feed_items (selected by the admin) and
 *                    creates/updates real rows in `properties`, translating via
 *                    DeepL. Selected items already published get their
 *                    price/images/specs refreshed, manually_edited rows are skipped.
 *
 * Feed: <feed><Realties><Realty>...</Realty>...</Realties></feed>
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

/**
 * Translate EN source text → target language via DeepL.
 * Throws on non-OK responses (no silent English fallback — see prior bug
 * where form-encoded auth_key was being rejected and translations were
 * silently lost).
 */
async function translateBatch(texts: string[], targetLang: 'SK' | 'CS', apiKey: string): Promise<string[]> {
    if (!texts.length) return [];
    const nonEmpty = texts.map((t, i) => ({ t, i })).filter(({ t }) => t && t.trim());
    if (!nonEmpty.length) return texts.map(() => '');

    // Free-tier keys end with ":fx"
    const url = apiKey.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: nonEmpty.map(({ t }) => t),
            source_lang: 'EN',
            target_lang: targetLang,
            preserve_formatting: true,
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`DeepL ${targetLang} failed: ${resp.status} ${errText.slice(0, 200)}`);
    }

    const json = await resp.json() as { translations: { text: string }[] };
    const results = [...texts];
    nonEmpty.forEach(({ i }, idx) => {
        results[i] = json.translations[idx]?.text ?? texts[i];
    });
    return results;
}

// ============================================
// XML PARSER
// ============================================

export interface GrekodomRealty {
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

function parseGrekodomXml(xmlText: string): GrekodomRealty[] {
    const results: GrekodomRealty[] = [];
    const blocks = xmlText.split('<Realty>');
    blocks.shift();

    for (const block of blocks) {
        const end = block.indexOf('</Realty>');
        const content = end >= 0 ? block.slice(0, end) : block;

        const r: Partial<GrekodomRealty> & { images: string[] } = { images: [] };

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
// STATS
// ============================================

export interface ImportStats {
    total: number;
    filtered: number;
    added: number;        // new feed_items rows
    updated: number;      // refreshed feed_items rows
    skipped: number;
    errors: number;
}

export interface MaterializeStats {
    total: number;
    added: number;        // new properties rows
    updated: number;      // refreshed properties rows
    skipped: number;      // manually_edited or already linked
    errors: number;
}

// ============================================
// PHASE 1 — ANALYZE
// ============================================

/**
 * Fetch + parse + filter the feed and upsert into feed_items.
 * Does NOT touch properties and does NOT call DeepL.
 */
export async function analyzeGrekodomFeed(
    feed: FeedSource,
    options: { onProgress?: (stats: ImportStats) => void } = {}
): Promise<ImportStats> {
    const supabase = getAdminClient();
    const stats: ImportStats = { total: 0, filtered: 0, added: 0, updated: 0, skipped: 0, errors: 0 };

    console.log(`[grekodom] Analyze: fetching ${feed.url}`);
    const response = await fetch(feed.url, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
    const xmlText = await response.text();
    console.log(`[grekodom] Feed fetched, ${(xmlText.length / 1024 / 1024).toFixed(1)} MB`);

    const realties = parseGrekodomXml(xmlText);
    stats.total = realties.length;
    console.log(`[grekodom] Parsed ${stats.total} realties`);

    const filtered = realties.filter(r => applyFilters(r, feed.filter_config));
    stats.filtered = filtered.length;

    // ---- Mark which existing feed_items exist (to know add vs update,
    //      and to flag removed_from_feed for items that disappeared)
    const seenUids = new Set(filtered.map(r => r.UniqueId));

    const BATCH = 100;
    const now = new Date().toISOString();

    for (let i = 0; i < filtered.length; i += BATCH) {
        const batch = filtered.slice(i, i + BATCH);
        const uids = batch.map(r => r.UniqueId);

        const { data: existing } = await supabase
            .from('feed_items')
            .select('external_uid')
            .eq('feed_source_id', feed.id)
            .in('external_uid', uids);
        const existingSet = new Set((existing || []).map(e => e.external_uid as string));

        const rows = batch.map(r => {
            const price = parseFloat(r.PriceInitial) || 0;
            const beds = parseInt(r.TotalBedrooms || r.Bedrooms || '0') || 0;
            const baths = parseInt(r.TotalBathrooms || r.Bathrooms || '0') || 0;
            const area = parseFloat(r.LivingArea) || 0;
            const land = parseFloat(r.LotSize) || 0;
            return {
                feed_source_id: feed.id,
                external_uid: r.UniqueId,
                raw_data: r,
                title: r.TitleEn || null,
                estate_type: r.EstateType || null,
                offer_type: r.OfferType || null,
                price: r.PriceByRequest?.toLowerCase() === 'yes' ? 0 : price,
                currency: r.Currency || null,
                region: r.Region || null,
                subregion: r.Subregion || null,
                town: r.Town || null,
                beds,
                baths,
                area,
                land_area: land || null,
                image_url: r.images[0] || null,
                image_count: r.images.length,
                last_seen_at: now,
                removed_from_feed: false,
                updated_at: now,
            };
        });

        // Upsert by (feed_source_id, external_uid).
        // selected/selected_property_id/first_seen_at are preserved by Postgres
        // because we don't include them in the conflict update list.
        const { error } = await supabase
            .from('feed_items')
            .upsert(rows, { onConflict: 'feed_source_id,external_uid' });

        if (error) {
            stats.errors += rows.length;
            console.error('[grekodom] feed_items upsert error:', error.message);
        } else {
            for (const r of batch) {
                if (existingSet.has(r.UniqueId)) stats.updated++;
                else stats.added++;
            }
        }

        options.onProgress?.(stats);
    }

    // ---- Refresh already-selected properties (price/images/specs only — no DeepL) ----
    try {
        await refreshSelectedProperties(feed.id);
    } catch (err) {
        console.warn('[grekodom] refreshSelectedProperties failed:', err);
    }

    // ---- Mark items previously seen but missing from this fetch ----
    if (seenUids.size > 0) {
        const { data: stale } = await supabase
            .from('feed_items')
            .select('id, external_uid')
            .eq('feed_source_id', feed.id)
            .eq('removed_from_feed', false);
        const staleIds = (stale || [])
            .filter(s => !seenUids.has(s.external_uid as string))
            .map(s => s.id as string);
        if (staleIds.length > 0) {
            await supabase
                .from('feed_items')
                .update({ removed_from_feed: true, updated_at: now })
                .in('id', staleIds);
        }
    }

    return stats;
}

/**
 * For all feed_items in this feed that are already selected (and whose linked
 * property is not manually_edited), refresh non-translated fields on the
 * properties row: price, images, area, beds, baths, status, lat/long.
 * Does NOT call DeepL.
 */
async function refreshSelectedProperties(feedSourceId: string): Promise<void> {
    const supabase = getAdminClient();

    const { data: selectedItems } = await supabase
        .from('feed_items')
        .select('id, external_uid, raw_data, selected_property_id')
        .eq('feed_source_id', feedSourceId)
        .eq('selected', true)
        .not('selected_property_id', 'is', null);

    if (!selectedItems || selectedItems.length === 0) return;

    const propIds = selectedItems.map(i => i.selected_property_id as string);
    const { data: props } = await supabase
        .from('properties')
        .select('id, manually_edited')
        .in('id', propIds);
    const editable = new Set(
        (props || []).filter(p => !p.manually_edited).map(p => p.id as string)
    );

    const now = new Date().toISOString();
    for (const item of selectedItems) {
        const propId = item.selected_property_id as string;
        if (!editable.has(propId)) continue;

        const r = item.raw_data as GrekodomRealty;
        const price = parseFloat(r.PriceInitial || '0') || 0;
        const priceOnRequest = r.PriceByRequest?.toLowerCase() === 'yes';
        const isNew = r.IsNewBuilding === 'yes';
        const isUnderConstruction = r.IsUnderConstruction === 'yes';

        const images = (r.images || []).map((url, idx) => ({
            url, alt: r.TitleEn || `Property ${r.UniqueId}`, order: idx,
        }));

        await supabase.from('properties')
            .update({
                price: priceOnRequest ? 0 : price,
                price_on_request: priceOnRequest,
                images,
                area: parseFloat(r.LivingArea || '0') || 0,
                beds: parseInt(r.TotalBedrooms || r.Bedrooms || '0') || 0,
                baths: parseInt(r.TotalBathrooms || r.Bathrooms || '0') || 0,
                status: isUnderConstruction ? 'under_construction' : isNew ? 'new_build' : 'original',
                latitude: parseFloat(r.LatitudeNearBy) || null,
                longitude: parseFloat(r.LongitudeNearBy) || null,
                updated_at: now,
            })
            .eq('id', propId);
    }
}

// ============================================
// PHASE 2 — MATERIALIZE selected items into properties
// ============================================

interface FeedItemRow {
    id: string;
    feed_source_id: string;
    external_uid: string;
    raw_data: GrekodomRealty;
    selected_property_id: string | null;
}

/**
 * Materialize selected feed_items into the properties table.
 * Translates titles + descriptions via DeepL.
 */
export async function materializeGrekodomItems(
    feed: FeedSource,
    itemIds: string[],
    options: { deeplApiKey?: string; onProgress?: (stats: MaterializeStats) => void } = {}
): Promise<MaterializeStats> {
    const supabase = getAdminClient();
    const stats: MaterializeStats = { total: itemIds.length, added: 0, updated: 0, skipped: 0, errors: 0 };

    if (itemIds.length === 0) return stats;

    const deeplKey = options.deeplApiKey || process.env.DEEPL_API_KEY || '';
    if (!deeplKey) {
        throw new Error(
            'DEEPL_API_KEY not configured. Grekodom listings need translation; ' +
            'set DEEPL_API_KEY in the environment before adding properties.'
        );
    }

    const BATCH = 20;

    for (let i = 0; i < itemIds.length; i += BATCH) {
        const ids = itemIds.slice(i, i + BATCH);

        const { data: items, error: fetchErr } = await supabase
            .from('feed_items')
            .select('id, feed_source_id, external_uid, raw_data, selected_property_id')
            .in('id', ids);
        if (fetchErr || !items) {
            stats.errors += ids.length;
            continue;
        }

        const batch = items as FeedItemRow[];

        // Find any properties already linked to these UIDs (in case the property
        // exists but the feed_item lost its link, eg legacy data).
        const uids = batch.map(b => b.external_uid);
        const { data: existingProps } = await supabase
            .from('properties')
            .select('id, external_feed_uid, manually_edited, slug')
            .eq('feed_source_id', feed.id)
            .in('external_feed_uid', uids);
        const propByUid = new Map((existingProps || []).map(p => [p.external_feed_uid as string, p]));

        const titles = batch.map(b => b.raw_data.TitleEn || '');
        const descs = batch.map(b => b.raw_data.DescriptionEn || '');
        const allTexts = [...titles, ...descs];

        let titlesSk = titles, titlesCs = titles, descsSk = descs, descsCs = descs;
        if (allTexts.some(t => t.trim())) {
            // Let DeepL errors bubble up — silently storing English in
            // all three locales was the previous bug.
            const sk = await translateBatch(allTexts, 'SK', deeplKey);
            titlesSk = sk.slice(0, batch.length); descsSk = sk.slice(batch.length);
            const cs = await translateBatch(allTexts, 'CS', deeplKey);
            titlesCs = cs.slice(0, batch.length); descsCs = cs.slice(batch.length);
        }

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const r = item.raw_data;
            try {
                const ex = propByUid.get(r.UniqueId);
                if (ex?.manually_edited) {
                    stats.skipped++;
                    await supabase.from('feed_items')
                        .update({
                            selected: true,
                            selected_at: new Date().toISOString(),
                            selected_property_id: ex.id,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', item.id);
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

                const locationParts = [r.Subregion, r.Region].filter(Boolean);
                const locationEn = locationParts.join(', ') || r.Town || 'Greece';

                const images = r.images.map((url, idx) => ({
                    url, alt: r.TitleEn || `Property ${r.UniqueId}`, order: idx,
                }));

                const baseSlug = generateSlug(titlesSk[j] || r.TitleEn || `property-${r.UniqueId}`);
                const slug = ex?.slug || `${baseSlug}-${r.UniqueId}`;

                const record = {
                    source: 'grekodom',
                    feed_source_id: feed.id,
                    external_feed_uid: r.UniqueId,
                    manually_edited: false,
                    slug,
                    title_sk: titlesSk[j] || r.TitleEn,
                    title_en: r.TitleEn || null,
                    title_cz: titlesCs[j] || r.TitleEn || null,
                    description_sk: descsSk[j] || r.DescriptionEn || null,
                    description_en: r.DescriptionEn || null,
                    description_cz: descsCs[j] || r.DescriptionEn || null,
                    location_sk: locationParts[0] || r.Town || 'Grécko',
                    location_en: locationEn,
                    location_cz: locationEn,
                    country: 'greece',
                    city: r.Town || r.Subregion || r.Region || '',
                    latitude: parseFloat(r.LatitudeNearBy) || null,
                    longitude: parseFloat(r.LongitudeNearBy) || null,
                    distance_from_sea: parseInt(r.DistanceFromSea) || null,
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
                    price: priceOnRequest ? 0 : price,
                    price_on_request: priceOnRequest,
                    unit: 'per_property',
                    status: isUnderConstruction ? 'under_construction' : isNew ? 'new_build' : 'original',
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
                    images,
                    hero_image_index: 0,
                    video_url: null,
                    pdf_images: [],
                    publish_status: 'draft',
                    featured: false,
                    reserved: false,
                    // The XML <UniqueId> is what Grekodom displays as "Object Code"
                    // on grekodom.com — use it as the public reference number.
                    property_id_external: r.UniqueId,
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

                let propertyId: string | null = null;

                if (ex) {
                    const { error } = await supabase
                        .from('properties')
                        .update({
                            price: record.price,
                            price_on_request: record.price_on_request,
                            images: record.images,
                            updated_at: record.updated_at,
                            area: record.area,
                            beds: record.beds,
                            baths: record.baths,
                            status: record.status,
                            latitude: record.latitude,
                            longitude: record.longitude,
                            property_id_external: record.property_id_external,
                        })
                        .eq('id', ex.id);
                    if (error) { stats.errors++; console.error(`[grekodom] Update error ${r.UniqueId}:`, error.message); }
                    else { stats.updated++; propertyId = ex.id; }
                } else {
                    const { data: inserted, error } = await supabase
                        .from('properties')
                        .insert(record)
                        .select('id')
                        .single();
                    if (error) { stats.errors++; console.error(`[grekodom] Insert error ${r.UniqueId}:`, error.message); }
                    else { stats.added++; propertyId = inserted!.id as string; }
                }

                if (propertyId) {
                    await supabase.from('feed_items')
                        .update({
                            selected: true,
                            selected_at: new Date().toISOString(),
                            selected_property_id: propertyId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', item.id);
                }
            } catch (err) {
                stats.errors++;
                console.error(`[grekodom] materialize error ${r.UniqueId}:`, err);
            }
        }

        options.onProgress?.(stats);
        if (i + BATCH < itemIds.length) await new Promise(r => setTimeout(r, 200));
    }

    return stats;
}

/**
 * Re-run DeepL on already-materialized properties for this feed (or only
 * a subset if itemIds is provided). Useful when the original materialize
 * stored English fallback in all three locales (eg. broken DeepL key).
 *
 * Skips `manually_edited` properties.
 */
export async function retranslateGrekodomItems(
    feed: FeedSource,
    options: { itemIds?: string[]; deeplApiKey?: string; onProgress?: (n: number, total: number) => void } = {}
): Promise<{ updated: number; skipped: number; errors: number; total: number }> {
    const supabase = getAdminClient();
    const deeplKey = options.deeplApiKey || process.env.DEEPL_API_KEY || '';
    if (!deeplKey) throw new Error('DEEPL_API_KEY not configured.');

    let q = supabase
        .from('feed_items')
        .select('id, raw_data, selected_property_id')
        .eq('feed_source_id', feed.id)
        .eq('selected', true)
        .not('selected_property_id', 'is', null);
    if (options.itemIds && options.itemIds.length > 0) q = q.in('id', options.itemIds);
    const { data: items } = await q;
    if (!items || items.length === 0) return { updated: 0, skipped: 0, errors: 0, total: 0 };

    // Filter out manually_edited properties
    const propIds = items.map(i => i.selected_property_id as string);
    const { data: props } = await supabase
        .from('properties')
        .select('id, manually_edited')
        .in('id', propIds);
    const editable = new Set(
        (props || []).filter(p => !p.manually_edited).map(p => p.id as string)
    );

    const BATCH = 20;
    const stats = { updated: 0, skipped: 0, errors: 0, total: items.length };

    for (let i = 0; i < items.length; i += BATCH) {
        const batch = items.slice(i, i + BATCH);
        const titles = batch.map(b => (b.raw_data as GrekodomRealty).TitleEn || '');
        const descs = batch.map(b => (b.raw_data as GrekodomRealty).DescriptionEn || '');
        const all = [...titles, ...descs];

        const sk = await translateBatch(all, 'SK', deeplKey);
        const cs = await translateBatch(all, 'CS', deeplKey);
        const titlesSk = sk.slice(0, batch.length), descsSk = sk.slice(batch.length);
        const titlesCs = cs.slice(0, batch.length), descsCs = cs.slice(batch.length);

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const propId = item.selected_property_id as string;
            if (!editable.has(propId)) { stats.skipped++; continue; }
            const r = item.raw_data as GrekodomRealty;
            const { error } = await supabase.from('properties')
                .update({
                    title_sk: titlesSk[j] || r.TitleEn,
                    title_en: r.TitleEn || null,
                    title_cz: titlesCs[j] || r.TitleEn || null,
                    description_sk: descsSk[j] || r.DescriptionEn || null,
                    description_en: r.DescriptionEn || null,
                    description_cz: descsCs[j] || r.DescriptionEn || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', propId);
            if (error) { stats.errors++; console.error('[grekodom] retranslate update error:', error.message); }
            else stats.updated++;
        }
        options.onProgress?.(stats.updated + stats.skipped + stats.errors, items.length);
    }

    return stats;
}

/**
 * Reverse of materialize — remove a previously-selected feed_item's property.
 * Default: trash the property (recoverable). Optionally hard delete.
 */
export async function deselectGrekodomItems(
    feed: FeedSource,
    itemIds: string[],
    mode: 'trash' | 'permanent' = 'trash'
): Promise<{ removed: number; errors: number }> {
    const supabase = getAdminClient();
    let removed = 0, errors = 0;
    if (itemIds.length === 0) return { removed, errors };

    const { data: items } = await supabase
        .from('feed_items')
        .select('id, selected_property_id')
        .in('id', itemIds)
        .eq('feed_source_id', feed.id);

    for (const it of items || []) {
        const propId = it.selected_property_id as string | null;
        try {
            if (propId) {
                if (mode === 'trash') {
                    await supabase.from('properties')
                        .update({ publish_status: 'trashed', updated_at: new Date().toISOString() })
                        .eq('id', propId);
                } else {
                    await supabase.from('properties').delete().eq('id', propId);
                }
            }
            await supabase.from('feed_items')
                .update({
                    selected: false,
                    selected_at: null,
                    selected_property_id: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', it.id);
            removed++;
        } catch (err) {
            errors++;
            console.error('[grekodom] deselect error:', err);
        }
    }

    return { removed, errors };
}
