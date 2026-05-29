/**
 * Kyero v3 XML Feed Importer
 *
 * Schema (per `<property>` block):
 *   <id>, <ref>, <date>, <price>, <currency>, <price_freq>
 *   <new_build>, <type>, <country>, <province>, <town>, <location_detail>
 *   <pool>, <location><latitude/><longitude/></location>
 *   <beds>, <baths>, <surface_area><built/><plot/></surface_area>
 *   <energy_rating>, <consumption>, <emissions>
 *   <desc><en>...</en>[<sk>...]</desc>
 *   <features><feature>...</feature></features>
 *   <tags><tag>...</tag></tags>
 *   <images><image id="N"><url>...</url></image></images>
 *   <video_url>
 *
 * The estatebud.com feed used by Relax Properties is all-Cyprus, English-only.
 * Same two-phase model as the Grekodom importer.
 */

import { getAdminClient } from '@/lib/supabase';
import type { FeedSource, FeedFilterConfig } from '@/lib/feed-store';
import { generateSlug } from '@/lib/property-store';
import { translateBatch as deeplTranslate, getDeeplKey, assertDeeplKey } from '@/lib/importers/_deepl';
import type { ImportStats, MaterializeStats } from '@/lib/importers/grekodom';

// ============================================
// TYPE MAPPING
// ============================================

const TYPE_MAP: Record<string, string> = {
    'Apartment': 'apartment',
    'Apartment Building': 'commercial',
    'Detached House': 'house',
    'Semi-Detached House': 'townhouse',
    'Townhouse': 'townhouse',
    'Villa': 'villa',
    'Bungalow': 'house',
    'Penthouse': 'apartment',
    'Studio': 'apartment',
    'Maisonette': 'townhouse',
    'Duplex': 'townhouse',
    'Land': 'land',
    'Plot': 'land',
    'Commercial': 'commercial',
    'Office': 'commercial',
    'Hotel': 'commercial',
};

const PRICE_FREQ_MAP: Record<string, string> = {
    'sale': 'sale',
    'rent': 'rent',
    'monthly': 'rent',
    'weekly': 'rent',
};

const COUNTRY_MAP: Record<string, string> = {
    'cyprus': 'cyprus',
    'greece': 'greece',
    'spain': 'spain',
    'croatia': 'croatia',
    'bulgaria': 'bulgaria',
    'italy': 'italy',
    'slovakia': 'slovakia',
};

function bedsToDisposition(beds: number, propertyType: string): string {
    if (propertyType === 'land' || propertyType === 'commercial') return '';
    if (beds === 0) return 'studio';
    if (beds === 1) return '1kk';
    if (beds === 2) return '2kk';
    if (beds === 3) return '3kk';
    if (beds === 4) return '4kk';
    return '5kk';
}

// ============================================
// XML PARSER — Kyero v3 schema
// ============================================

export interface KyeroProperty {
    id: string;
    ref: string;
    date: string;
    price: string;
    currency: string;
    price_freq: string;       // sale | rent | monthly | weekly
    new_build: string;        // "0" | "1"
    type: string;
    country: string;
    province: string;
    town: string;
    location_detail: string;
    pool: string;             // "0" | "1"
    latitude: string;
    longitude: string;
    beds: string;
    baths: string;
    built: string;            // covered/built m²
    plot: string;             // plot m²
    energy_rating: string;
    description_en: string;
    description_sk: string;   // sometimes provided directly
    features: string[];
    tags: string[];
    images: string[];
    video_url: string;
}

/** Extracts the first occurrence of `<name>...</name>` from a block. */
function tag(content: string, name: string): string {
    const m = content.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
    return m ? m[1].trim() : '';
}

function parseKyeroXml(xmlText: string): KyeroProperty[] {
    const results: KyeroProperty[] = [];
    const blocks = xmlText.split('<property>');
    blocks.shift();

    for (const block of blocks) {
        const end = block.indexOf('</property>');
        const content = end >= 0 ? block.slice(0, end) : block;

        const p: Partial<KyeroProperty> = {
            features: [],
            tags: [],
            images: [],
        };

        p.id = tag(content, 'id');
        p.ref = tag(content, 'ref') || p.id;
        if (!p.id) continue;

        p.date = tag(content, 'date');
        p.price = tag(content, 'price');
        p.currency = tag(content, 'currency');
        p.price_freq = tag(content, 'price_freq');
        p.new_build = tag(content, 'new_build');
        p.type = tag(content, 'type');
        p.country = tag(content, 'country');
        p.province = tag(content, 'province');
        p.town = tag(content, 'town');
        p.location_detail = tag(content, 'location_detail');
        p.pool = tag(content, 'pool');
        p.beds = tag(content, 'beds');
        p.baths = tag(content, 'baths');
        p.energy_rating = tag(content, 'energy_rating');
        p.video_url = tag(content, 'video_url');

        // <location><latitude/><longitude/></location>
        const locMatch = content.match(/<location>([\s\S]*?)<\/location>/);
        if (locMatch) {
            p.latitude = tag(locMatch[1], 'latitude');
            p.longitude = tag(locMatch[1], 'longitude');
        }
        p.latitude = p.latitude || '';
        p.longitude = p.longitude || '';

        // <surface_area><built/><plot/></surface_area>
        const surfMatch = content.match(/<surface_area>([\s\S]*?)<\/surface_area>/);
        if (surfMatch) {
            p.built = tag(surfMatch[1], 'built');
            p.plot = tag(surfMatch[1], 'plot');
        }
        p.built = p.built || '';
        p.plot = p.plot || '';

        // <desc><en>...</en><sk>...</sk></desc>
        const descMatch = content.match(/<desc>([\s\S]*?)<\/desc>/);
        if (descMatch) {
            p.description_en = tag(descMatch[1], 'en');
            p.description_sk = tag(descMatch[1], 'sk');
        }
        p.description_en = p.description_en || '';
        p.description_sk = p.description_sk || '';

        // <features><feature>...</feature></features>
        const featMatch = content.match(/<features>([\s\S]*?)<\/features>/);
        if (featMatch) {
            p.features = [...featMatch[1].matchAll(/<feature>([\s\S]*?)<\/feature>/g)]
                .map(m => m[1].trim()).filter(Boolean);
        }

        // <tags><tag>...</tag></tags>
        const tagsMatch = content.match(/<tags>([\s\S]*?)<\/tags>/);
        if (tagsMatch) {
            p.tags = [...tagsMatch[1].matchAll(/<tag>([\s\S]*?)<\/tag>/g)]
                .map(m => m[1].trim()).filter(Boolean);
        }

        // <images><image id="N"><url>...</url></image></images>
        const imgsMatch = content.match(/<images>([\s\S]*?)<\/images>/);
        if (imgsMatch) {
            p.images = [...imgsMatch[1].matchAll(/<url>([\s\S]*?)<\/url>/g)]
                .map(m => m[1].trim()).filter(Boolean);
        }

        results.push(p as KyeroProperty);
    }

    return results;
}

// ============================================
// TITLE HELPER — Kyero feeds usually omit a title.
// Build a sensible English fallback from type + location.
// ============================================

function buildTitle(p: KyeroProperty): string {
    const typeLabel = p.type || 'Property';
    const where = [p.location_detail, p.town, p.province].filter(Boolean)[0] || p.country || '';
    return where ? `${typeLabel} in ${where}` : typeLabel;
}

// ============================================
// FILTER APPLICATION
// ============================================

function applyFilters(p: KyeroProperty, config: FeedFilterConfig): boolean {
    if (config.estate_types && config.estate_types.length > 0) {
        if (!config.estate_types.includes(p.type)) return false;
    }
    if (config.offer_types && config.offer_types.length > 0) {
        // Kyero uses lowercase "sale" / "rent"; UI presets use "For Sale" / "For Rent"
        const want = new Set<string>(
            config.offer_types.map(o => o.toLowerCase().includes('rent') ? 'rent' : 'sale')
        );
        if (!want.has(p.price_freq)) return false;
    }
    if (config.regions && config.regions.length > 0) {
        if (!config.regions.includes(p.province)) return false;
    }
    const price = parseFloat(p.price) || 0;
    if (config.price_min && price > 0 && price < config.price_min) return false;
    if (config.price_max && price > config.price_max) return false;
    return true;
}

// ============================================
// PHASE 1 — ANALYZE
// ============================================

export async function analyzeKyeroFeed(
    feed: FeedSource,
    options: { onProgress?: (stats: ImportStats) => void } = {}
): Promise<ImportStats> {
    const supabase = getAdminClient();
    const stats: ImportStats = { total: 0, filtered: 0, added: 0, updated: 0, skipped: 0, errors: 0 };

    console.log(`[kyero] Analyze: fetching ${feed.url}`);
    const response = await fetch(feed.url, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
    const xmlText = await response.text();
    console.log(`[kyero] Feed fetched, ${(xmlText.length / 1024).toFixed(1)} KB`);

    const properties = parseKyeroXml(xmlText);
    stats.total = properties.length;
    console.log(`[kyero] Parsed ${stats.total} properties`);

    const filtered = properties.filter(p => applyFilters(p, feed.filter_config));
    stats.filtered = filtered.length;

    const seenUids = new Set(filtered.map(p => p.ref));
    const BATCH = 100;
    const now = new Date().toISOString();

    for (let i = 0; i < filtered.length; i += BATCH) {
        const batch = filtered.slice(i, i + BATCH);
        const uids = batch.map(p => p.ref);

        const { data: existing } = await supabase
            .from('feed_items')
            .select('external_uid')
            .eq('feed_source_id', feed.id)
            .in('external_uid', uids);
        const existingSet = new Set((existing || []).map(e => e.external_uid as string));

        const rows = batch.map(p => {
            const price = parseFloat(p.price) || 0;
            const beds = parseInt(p.beds || '0') || 0;
            const baths = parseInt(p.baths || '0') || 0;
            const area = parseFloat(p.built) || 0;
            const land = parseFloat(p.plot) || 0;
            return {
                feed_source_id: feed.id,
                external_uid: p.ref,
                raw_data: p,
                title: buildTitle(p),
                estate_type: p.type || null,
                offer_type: p.price_freq === 'rent' ? 'For Rent' : 'For Sale',
                price,
                currency: p.currency || null,
                region: p.province || null,
                subregion: p.location_detail || null,
                town: p.town || null,
                beds,
                baths,
                area,
                land_area: land || null,
                image_url: p.images[0] || null,
                image_count: p.images.length,
                last_seen_at: now,
                removed_from_feed: false,
                updated_at: now,
            };
        });

        const { error } = await supabase
            .from('feed_items')
            .upsert(rows, { onConflict: 'feed_source_id,external_uid' });

        if (error) {
            stats.errors += rows.length;
            console.error('[kyero] feed_items upsert error:', error.message);
        } else {
            for (const p of batch) {
                if (existingSet.has(p.ref)) stats.updated++;
                else stats.added++;
            }
        }

        options.onProgress?.(stats);
    }

    // ---- Refresh already-selected properties (no DeepL) ----
    try {
        await refreshSelectedProperties(feed.id);
    } catch (err) {
        console.warn('[kyero] refreshSelectedProperties failed:', err);
    }

    // ---- Flag items missing from this fetch ----
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

// ============================================
// LIGHTWEIGHT REFRESH for already-selected props
// ============================================

async function refreshSelectedProperties(feedSourceId: string): Promise<void> {
    const supabase = getAdminClient();

    const { data: selectedItems } = await supabase
        .from('feed_items')
        .select('id, raw_data, selected_property_id')
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

        const p = item.raw_data as KyeroProperty;
        const price = parseFloat(p.price) || 0;
        const isNew = p.new_build === '1';

        const images = (p.images || []).map((url, idx) => ({
            url, alt: buildTitle(p), order: idx,
        }));

        await supabase.from('properties')
            .update({
                price,
                price_on_request: false,
                images,
                area: parseFloat(p.built) || 0,
                beds: parseInt(p.beds || '0') || 0,
                baths: parseInt(p.baths || '0') || 0,
                status: isNew ? 'new_build' : 'original',
                latitude: parseFloat(p.latitude) || null,
                longitude: parseFloat(p.longitude) || null,
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
    raw_data: KyeroProperty;
    selected_property_id: string | null;
}

export async function materializeKyeroItems(
    feed: FeedSource,
    itemIds: string[],
    options: { deeplApiKey?: string; onProgress?: (stats: MaterializeStats) => void } = {}
): Promise<MaterializeStats> {
    const supabase = getAdminClient();
    const stats: MaterializeStats = { total: itemIds.length, added: 0, updated: 0, skipped: 0, errors: 0 };

    if (itemIds.length === 0) return stats;

    const deeplKey = getDeeplKey(options.deeplApiKey);
    assertDeeplKey(deeplKey, 'Kyero');

    const BATCH = 20;

    for (let i = 0; i < itemIds.length; i += BATCH) {
        const ids = itemIds.slice(i, i + BATCH);

        const { data: items, error: fetchErr } = await supabase
            .from('feed_items')
            .select('id, feed_source_id, external_uid, raw_data, selected_property_id')
            .in('id', ids);
        if (fetchErr || !items) { stats.errors += ids.length; continue; }

        const batch = items as FeedItemRow[];

        const uids = batch.map(b => b.external_uid);
        const { data: existingProps } = await supabase
            .from('properties')
            .select('id, external_feed_uid, manually_edited, slug')
            .eq('feed_source_id', feed.id)
            .in('external_feed_uid', uids);
        const propByUid = new Map((existingProps || []).map(p => [p.external_feed_uid as string, p]));

        // Kyero feeds don't ship titles — generate from type + location
        const titles = batch.map(b => buildTitle(b.raw_data));
        const descs = batch.map(b => b.raw_data.description_en || '');
        const allTexts = [...titles, ...descs];

        let titlesSk = titles, titlesCs = titles, descsSk = descs, descsCs = descs;
        if (allTexts.some(t => t.trim())) {
            const sk = await deeplTranslate(allTexts, 'EN', 'SK', deeplKey);
            titlesSk = sk.slice(0, batch.length); descsSk = sk.slice(batch.length);
            const cs = await deeplTranslate(allTexts, 'EN', 'CS', deeplKey);
            titlesCs = cs.slice(0, batch.length); descsCs = cs.slice(batch.length);
        }

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const p = item.raw_data;
            try {
                const ex = propByUid.get(item.external_uid);
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

                const price = parseFloat(p.price) || 0;
                const beds = parseInt(p.beds || '0') || 0;
                const baths = parseInt(p.baths || '0') || 0;
                const area = parseFloat(p.built) || 0;
                const propertyType = TYPE_MAP[p.type] || 'apartment';
                const offerType = PRICE_FREQ_MAP[p.price_freq] || 'sale';
                const disposition = bedsToDisposition(beds, propertyType);
                const isNew = p.new_build === '1';
                const country = COUNTRY_MAP[p.country.toLowerCase()] || p.country.toLowerCase();
                const locationParts = [p.location_detail, p.town, p.province].filter(Boolean);
                const locationEn = locationParts.join(', ') || p.country;

                const images = p.images.map((url, idx) => ({
                    url, alt: titles[j] || `Property ${p.ref}`, order: idx,
                }));

                const baseSlug = generateSlug(titlesSk[j] || titles[j] || `property-${p.ref}`);
                const slug = ex?.slug || `${baseSlug}-${p.ref}`;

                const featureSet = new Set(p.features.map(f => f.toLowerCase()));
                const hasFeature = (...keys: string[]) =>
                    keys.some(k => [...featureSet].some(f => f.includes(k)));

                const record = {
                    source: 'kyero',
                    feed_source_id: feed.id,
                    external_feed_uid: p.ref,
                    manually_edited: false,
                    slug,
                    title_sk: titlesSk[j] || titles[j],
                    title_en: titles[j],
                    title_cz: titlesCs[j] || titles[j],
                    description_sk: descsSk[j] || p.description_en || null,
                    description_en: p.description_en || null,
                    description_cz: descsCs[j] || p.description_en || null,
                    location_sk: locationParts[0] || p.country || '',
                    location_en: locationEn,
                    location_cz: locationEn,
                    country,
                    city: p.town || p.location_detail || p.province || '',
                    latitude: parseFloat(p.latitude) || null,
                    longitude: parseFloat(p.longitude) || null,
                    distance_from_sea: null,
                    property_type: propertyType,
                    offer_type: offerType,
                    disposition: disposition || null,
                    beds,
                    baths,
                    area,
                    land_area: parseFloat(p.plot) || null,
                    floors: null,
                    floor_number: null,
                    year: null,
                    parking: hasFeature('parking', 'garage') ? 1 : 0,
                    price,
                    price_on_request: false,
                    unit: 'per_property',
                    status: isNew ? 'new_build' : 'original',
                    pool: p.pool === '1' || hasFeature('pool'),
                    balcony: hasFeature('balcony'),
                    garden: hasFeature('garden'),
                    sea_view: hasFeature('sea view', 'sea front', 'sea-view', 'seafront'),
                    first_line: hasFeature('sea front', 'seafront', 'first line'),
                    new_build: isNew,
                    new_project: false,
                    luxury: hasFeature('luxury'),
                    golf: hasFeature('golf'),
                    mountains: hasFeature('mountain view'),
                    garage: hasFeature('garage'),
                    fireplace: hasFeature('fireplace'),
                    near_beach: hasFeature('sea front', 'seafront', 'near beach', 'beach'),
                    images,
                    hero_image_index: 0,
                    video_url: p.video_url || null,
                    pdf_images: [],
                    publish_status: 'draft',
                    featured: false,
                    reserved: false,
                    property_id_external: p.ref,
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
                    tags: p.tags,
                    preview_tags: [],
                    draft_data: null,
                    lodzia: false,
                    terasa: hasFeature('terrace', 'veranda'),
                    cellar: false,
                    parking_spot: hasFeature('parking', 'garage'),
                    near_airport: false,
                    billiard_room: false,
                    near_golf: hasFeature('golf'),
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
                    if (error) { stats.errors++; console.error(`[kyero] Update error ${p.ref}:`, error.message); }
                    else { stats.updated++; propertyId = ex.id; }
                } else {
                    const { data: inserted, error } = await supabase
                        .from('properties')
                        .insert(record)
                        .select('id')
                        .single();
                    if (error) { stats.errors++; console.error(`[kyero] Insert error ${p.ref}:`, error.message); }
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
                console.error(`[kyero] materialize error ${p.ref}:`, err);
            }
        }

        options.onProgress?.(stats);
        if (i + BATCH < itemIds.length) await new Promise(r => setTimeout(r, 200));
    }

    return stats;
}

// ============================================
// RETRANSLATE
// ============================================

export async function retranslateKyeroItems(
    feed: FeedSource,
    options: { itemIds?: string[]; deeplApiKey?: string; onProgress?: (done: number, total: number) => void } = {}
): Promise<{ updated: number; skipped: number; errors: number; total: number }> {
    const supabase = getAdminClient();
    const deeplKey = getDeeplKey(options.deeplApiKey);
    assertDeeplKey(deeplKey, 'Kyero');

    let q = supabase
        .from('feed_items')
        .select('id, raw_data, selected_property_id')
        .eq('feed_source_id', feed.id)
        .eq('selected', true)
        .not('selected_property_id', 'is', null);
    if (options.itemIds && options.itemIds.length > 0) q = q.in('id', options.itemIds);

    const { data: items } = await q;
    if (!items || items.length === 0) return { updated: 0, skipped: 0, errors: 0, total: 0 };

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
        const titles = batch.map(b => buildTitle(b.raw_data as KyeroProperty));
        const descs = batch.map(b => (b.raw_data as KyeroProperty).description_en || '');
        const all = [...titles, ...descs];

        const sk = await deeplTranslate(all, 'EN', 'SK', deeplKey);
        const cs = await deeplTranslate(all, 'EN', 'CS', deeplKey);
        const titlesSk = sk.slice(0, batch.length), descsSk = sk.slice(batch.length);
        const titlesCs = cs.slice(0, batch.length), descsCs = cs.slice(batch.length);

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const propId = item.selected_property_id as string;
            if (!editable.has(propId)) { stats.skipped++; continue; }
            const p = item.raw_data as KyeroProperty;
            const { error } = await supabase.from('properties')
                .update({
                    title_sk: titlesSk[j] || titles[j],
                    title_en: titles[j],
                    title_cz: titlesCs[j] || titles[j],
                    description_sk: descsSk[j] || p.description_en || null,
                    description_en: p.description_en || null,
                    description_cz: descsCs[j] || p.description_en || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', propId);
            if (error) { stats.errors++; console.error('[kyero] retranslate update error:', error.message); }
            else stats.updated++;
        }
        options.onProgress?.(stats.updated + stats.skipped + stats.errors, items.length);
    }

    return stats;
}

// ============================================
// DESELECT
// ============================================

export async function deselectKyeroItems(
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
            console.error('[kyero] deselect error:', err);
        }
    }

    return { removed, errors };
}
