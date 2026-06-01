/**
 * KC Properties (Bulgaria) XML Feed Importer
 *
 * Schema (per `<Property>` block):
 *   <UniquePropertyID>, <LastUpdateDate>
 *   <Country>, <Region>, <Subregion>, <Town>, <Postcode>, <Address>
 *   <GeoLocation><Latitude/><Longitude/></GeoLocation>
 *   <SalePrice>, <Currency>
 *   <PropertyType/> (always empty), <NumBedrooms>, <NumBathrooms>,
 *   <Pool/> (empty), <NewBuild/> (empty)
 *   <PropertyName><en>...</en><fr/></PropertyName>
 *   <Description><en>...</en><fr/></Description>
 *   <Features><Feature><en>Key: value</en><fr/></Feature>...</Features>
 *   <surface_area><built/><plot/></surface_area>
 *   <Photos><Photo><PhotoURL/><PhotoDesc/></Photo>...</Photos>
 *
 * Because PropertyType/Pool/NewBuild are empty in the feed, the importer
 * infers type from the property name and reads specs (year, floor, view,
 * balconies, furniture) from the Features key/value list.
 *
 * English-only, all-Bulgaria. Same two-phase model as the other importers.
 */

import { getAdminClient } from '@/lib/supabase';
import type { FeedSource, FeedFilterConfig } from '@/lib/feed-store';
import { generateSlug } from '@/lib/property-store';
import { translateBatch as deeplTranslate, getDeeplKey, assertDeeplKey } from '@/lib/importers/_deepl';
import type { ImportStats, MaterializeStats } from '@/lib/importers/grekodom';

// ============================================
// TYPE INFERENCE (PropertyType is empty in the feed)
// ============================================

/** Infer our internal property_type from the English name. */
function inferType(name: string): string {
    const n = name.toLowerCase();
    if (/\b(plot|land)\b/.test(n)) return 'land';
    if (/\b(office|shop|commercial|hotel|restaurant)\b/.test(n)) return 'commercial';
    if (/\bvilla\b/.test(n)) return 'villa';
    if (/\b(house|maisonette)\b/.test(n)) return 'house';
    if (/\b(penthouse|apartment|studio|flat|bed)\b/.test(n)) return 'apartment';
    return 'apartment';
}

/** The estate-type label exposed to the feed-items browse/filter UI. */
function estateLabel(name: string): string {
    const n = name.toLowerCase();
    if (/\bstudio\b/.test(n)) return 'Studio';
    if (/\bpenthouse\b/.test(n)) return 'Penthouse';
    if (/\bmaisonette\b/.test(n)) return 'Maisonette';
    if (/\bvilla\b/.test(n)) return 'Villa';
    if (/\bhouse\b/.test(n)) return 'House';
    if (/\b(plot|land)\b/.test(n)) return 'Land';
    if (/\b(office|shop|commercial|hotel|restaurant)\b/.test(n)) return 'Commercial';
    if (/\bapartment\b/.test(n) || /\bbed\b/.test(n)) return 'Apartment';
    return 'Apartment';
}

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
// XML PARSER
// ============================================

export interface KCProperty {
    id: string;
    name_en: string;
    description_en: string;
    country: string;
    region: string;
    subregion: string;
    town: string;
    postcode: string;
    latitude: string;
    longitude: string;
    price: string;
    currency: string;
    num_bedrooms: string;
    num_bathrooms: string;
    built: string;
    plot: string;
    features: string[];   // raw "Key: value" strings (English)
    images: string[];
}

function tag(content: string, name: string): string {
    const m = content.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
    return m ? m[1].trim() : '';
}

/** First `<en>...</en>` directly inside a parent block. */
function enTag(content: string, parent: string): string {
    const block = content.match(new RegExp(`<${parent}>([\\s\\S]*?)<\\/${parent}>`));
    if (!block) return '';
    return tag(block[1], 'en');
}

function parseKCXml(xmlText: string): KCProperty[] {
    const results: KCProperty[] = [];
    const blocks = xmlText.split('<Property>');
    blocks.shift();

    for (const block of blocks) {
        const end = block.indexOf('</Property>');
        const content = end >= 0 ? block.slice(0, end) : block;

        const p: Partial<KCProperty> = { features: [], images: [] };

        p.id = tag(content, 'UniquePropertyID');
        if (!p.id) continue;

        p.country = tag(content, 'Country');
        p.region = tag(content, 'Region');
        p.subregion = tag(content, 'Subregion');
        p.town = tag(content, 'Town');
        p.postcode = tag(content, 'Postcode');
        p.price = tag(content, 'SalePrice');
        p.currency = tag(content, 'Currency');
        p.num_bedrooms = tag(content, 'NumBedrooms');
        p.num_bathrooms = tag(content, 'NumBathrooms');

        const geo = content.match(/<GeoLocation>([\s\S]*?)<\/GeoLocation>/);
        if (geo) {
            p.latitude = tag(geo[1], 'Latitude');
            p.longitude = tag(geo[1], 'Longitude');
        }
        p.latitude = p.latitude || '';
        p.longitude = p.longitude || '';

        const surf = content.match(/<surface_area>([\s\S]*?)<\/surface_area>/);
        if (surf) {
            p.built = tag(surf[1], 'built');
            p.plot = tag(surf[1], 'plot');
        }
        p.built = p.built || '';
        p.plot = p.plot || '';

        // Name + description: collapse internal whitespace/newlines
        p.name_en = enTag(content, 'PropertyName').replace(/\s+/g, ' ').trim();
        p.description_en = enTag(content, 'Description').trim();

        // Features: each <Feature><en>Key: value</en></Feature>
        const featBlock = content.match(/<Features>([\s\S]*?)<\/Features>/);
        if (featBlock) {
            p.features = [...featBlock[1].matchAll(/<Feature>\s*<en>([\s\S]*?)<\/en>/g)]
                .map(m => m[1].replace(/\s+/g, ' ').trim())
                .filter(Boolean);
        }

        // Photos: <Photo><PhotoURL>...</PhotoURL></Photo>
        const photoBlock = content.match(/<Photos>([\s\S]*?)<\/Photos>/);
        if (photoBlock) {
            p.images = [...photoBlock[1].matchAll(/<PhotoURL>([\s\S]*?)<\/PhotoURL>/g)]
                .map(m => m[1].trim()).filter(Boolean);
        }

        results.push(p as KCProperty);
    }

    return results;
}

// ============================================
// FEATURE / NAME EXTRACTION HELPERS
// ============================================

/** Find a feature value by its key prefix, e.g. featureValue(p, "Year Built"). */
function featureValue(p: KCProperty, key: string): string {
    const lower = key.toLowerCase();
    for (const f of p.features) {
        const idx = f.indexOf(':');
        if (idx < 0) continue;
        if (f.slice(0, idx).trim().toLowerCase() === lower) {
            return f.slice(idx + 1).trim();
        }
    }
    return '';
}

function hasFeatureWord(p: KCProperty, ...words: string[]): boolean {
    const blob = p.features.join(' | ').toLowerCase();
    return words.some(w => blob.includes(w.toLowerCase()));
}

/** Resolve bed count: top-level → name "N BED" → Features "Bedrooms: N" → studio=0 */
function resolveBeds(p: KCProperty): number {
    const top = parseInt(p.num_bedrooms || '');
    if (!isNaN(top)) return top;

    const nameMatch = p.name_en.match(/(\d+)\s*bed\b/i);
    if (nameMatch) return parseInt(nameMatch[1]);

    const feat = featureValue(p, 'Bedrooms');
    const featNum = parseInt(feat);
    if (!isNaN(featNum)) return featNum;

    if (/\bstudio\b/i.test(p.name_en)) return 0;
    return 0;
}

function resolveBaths(p: KCProperty): number {
    const top = parseInt(p.num_bathrooms || '');
    if (!isNaN(top)) return top;
    const feat = parseInt(featureValue(p, 'Bathrooms'));
    return isNaN(feat) ? 0 : feat;
}

function resolveYear(p: KCProperty): number | null {
    const v = featureValue(p, 'Year Built');
    const m = v.match(/\d{4}/);
    return m ? parseInt(m[0]) : null;
}

function resolveFloor(p: KCProperty): number | null {
    const v = featureValue(p, 'Floor').toLowerCase();
    if (v.includes('ground')) return 0;
    const m = v.match(/\d+/);
    return m ? parseInt(m[0]) : null;
}

function buildTitle(p: KCProperty): string {
    if (p.name_en) return p.name_en;
    const where = [p.town, p.region].filter(Boolean)[0] || p.country || '';
    return where ? `${estateLabel('')} in ${where}` : 'Property';
}

// ============================================
// FILTER APPLICATION
// ============================================

function applyFilters(p: KCProperty, config: FeedFilterConfig): boolean {
    if (config.estate_types && config.estate_types.length > 0) {
        if (!config.estate_types.includes(estateLabel(p.name_en))) return false;
    }
    if (config.regions && config.regions.length > 0) {
        if (!config.regions.includes(p.region)) return false;
    }
    const price = parseFloat(p.price) || 0;
    if (config.price_min && price > 0 && price < config.price_min) return false;
    if (config.price_max && price > config.price_max) return false;
    return true;
}

// ============================================
// PHASE 1 — ANALYZE
// ============================================

export async function analyzeKCFeed(
    feed: FeedSource,
    options: { onProgress?: (stats: ImportStats) => void } = {}
): Promise<ImportStats> {
    const supabase = getAdminClient();
    const stats: ImportStats = { total: 0, filtered: 0, added: 0, updated: 0, skipped: 0, errors: 0 };

    console.log(`[kcproperties] Analyze: fetching ${feed.url}`);
    const response = await fetch(feed.url, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
    const xmlText = await response.text();
    console.log(`[kcproperties] Feed fetched, ${(xmlText.length / 1024).toFixed(1)} KB`);

    const properties = parseKCXml(xmlText);
    stats.total = properties.length;
    console.log(`[kcproperties] Parsed ${stats.total} properties`);

    const filtered = properties.filter(p => applyFilters(p, feed.filter_config));
    stats.filtered = filtered.length;

    const seenUids = new Set(filtered.map(p => p.id));
    const BATCH = 100;
    const now = new Date().toISOString();

    for (let i = 0; i < filtered.length; i += BATCH) {
        const batch = filtered.slice(i, i + BATCH);
        const uids = batch.map(p => p.id);

        const { data: existing } = await supabase
            .from('feed_items')
            .select('external_uid')
            .eq('feed_source_id', feed.id)
            .in('external_uid', uids);
        const existingSet = new Set((existing || []).map(e => e.external_uid as string));

        const rows = batch.map(p => {
            const price = parseFloat(p.price) || 0;
            return {
                feed_source_id: feed.id,
                external_uid: p.id,
                raw_data: p,
                title: buildTitle(p),
                estate_type: estateLabel(p.name_en),
                offer_type: 'For Sale',
                price,
                currency: p.currency || 'EUR',
                region: p.region || null,
                subregion: p.subregion || null,
                town: p.town || null,
                beds: resolveBeds(p),
                baths: resolveBaths(p),
                area: parseFloat(p.built) || 0,
                land_area: parseFloat(p.plot) || null,
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
            console.error('[kcproperties] feed_items upsert error:', error.message);
        } else {
            for (const p of batch) {
                if (existingSet.has(p.id)) stats.updated++;
                else stats.added++;
            }
        }

        options.onProgress?.(stats);
    }

    try {
        await refreshSelectedProperties(feed.id);
    } catch (err) {
        console.warn('[kcproperties] refreshSelectedProperties failed:', err);
    }

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

        const p = item.raw_data as KCProperty;
        const price = parseFloat(p.price) || 0;
        const images = (p.images || []).map((url, idx) => ({
            url, alt: buildTitle(p), order: idx,
        }));

        await supabase.from('properties')
            .update({
                price,
                price_on_request: false,
                images,
                area: parseFloat(p.built) || 0,
                beds: resolveBeds(p),
                baths: resolveBaths(p),
                latitude: parseFloat(p.latitude) || null,
                longitude: parseFloat(p.longitude) || null,
                updated_at: now,
            })
            .eq('id', propId);
    }
}

// ============================================
// PHASE 2 — MATERIALIZE
// ============================================

interface FeedItemRow {
    id: string;
    feed_source_id: string;
    external_uid: string;
    raw_data: KCProperty;
    selected_property_id: string | null;
}

export async function materializeKCItems(
    feed: FeedSource,
    itemIds: string[],
    options: { deeplApiKey?: string; onProgress?: (stats: MaterializeStats) => void } = {}
): Promise<MaterializeStats> {
    const supabase = getAdminClient();
    const stats: MaterializeStats = { total: itemIds.length, added: 0, updated: 0, skipped: 0, errors: 0 };
    if (itemIds.length === 0) return stats;

    const deeplKey = getDeeplKey(options.deeplApiKey);
    assertDeeplKey(deeplKey, 'KC Properties');

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
                const beds = resolveBeds(p);
                const baths = resolveBaths(p);
                const area = parseFloat(p.built) || 0;
                const propertyType = inferType(p.name_en);
                const disposition = bedsToDisposition(beds, propertyType);
                const country = (p.country || 'bulgaria').toLowerCase();
                const locationParts = [p.town, p.subregion, p.region].filter(Boolean);
                const locationEn = locationParts.join(', ') || country;

                const furniture = featureValue(p, 'Furniture').toLowerCase();
                const isNew = /brand new|new build/i.test(p.name_en) || /new build/i.test(furniture);
                const seaView = /\bsea\b/i.test(p.name_en) || hasFeatureWord(p, 'sea view', 'sea');
                const poolFeat = /\bpool\b/i.test(p.name_en) || hasFeatureWord(p, 'pool');

                const images = p.images.map((url, idx) => ({
                    url, alt: titles[j] || `Property ${p.id}`, order: idx,
                }));

                const baseSlug = generateSlug(titlesSk[j] || titles[j] || `property-${p.id}`);
                const slug = ex?.slug || `${baseSlug}-${p.id}`;

                const record = {
                    source: 'kcproperties',
                    feed_source_id: feed.id,
                    external_feed_uid: p.id,
                    manually_edited: false,
                    slug,
                    title_sk: titlesSk[j] || titles[j],
                    title_en: titles[j],
                    title_cz: titlesCs[j] || titles[j],
                    description_sk: descsSk[j] || p.description_en || null,
                    description_en: p.description_en || null,
                    description_cz: descsCs[j] || p.description_en || null,
                    location_sk: locationParts[0] || country,
                    location_en: locationEn,
                    location_cz: locationEn,
                    country,
                    city: p.town || p.subregion || p.region || '',
                    latitude: parseFloat(p.latitude) || null,
                    longitude: parseFloat(p.longitude) || null,
                    distance_from_sea: null,
                    property_type: propertyType,
                    offer_type: 'sale',
                    disposition: disposition || null,
                    beds,
                    baths,
                    area,
                    land_area: parseFloat(p.plot) || null,
                    floors: null,
                    floor_number: resolveFloor(p),
                    year: resolveYear(p),
                    parking: hasFeatureWord(p, 'parking', 'garage') ? 1 : 0,
                    price,
                    price_on_request: false,
                    unit: 'per_property',
                    status: isNew ? 'new_build' : 'original',
                    pool: poolFeat,
                    balcony: hasFeatureWord(p, 'balcon'),
                    garden: hasFeatureWord(p, 'garden'),
                    sea_view: seaView,
                    first_line: /sea front|seafront|first line|beachfront/i.test(p.name_en),
                    new_build: isNew,
                    new_project: false,
                    luxury: /\bluxur/i.test(p.name_en),
                    golf: hasFeatureWord(p, 'golf'),
                    mountains: hasFeatureWord(p, 'mountain'),
                    garage: hasFeatureWord(p, 'garage'),
                    fireplace: hasFeatureWord(p, 'fireplace'),
                    near_beach: /\bsea\b|beach/i.test(p.name_en),
                    images,
                    hero_image_index: 0,
                    video_url: null,
                    pdf_images: [],
                    publish_status: 'draft',
                    featured: false,
                    reserved: false,
                    property_id_external: p.id,
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
                    terasa: hasFeatureWord(p, 'terrace', 'veranda'),
                    cellar: false,
                    parking_spot: hasFeatureWord(p, 'parking', 'garage'),
                    near_airport: false,
                    billiard_room: false,
                    near_golf: hasFeatureWord(p, 'golf'),
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
                    if (error) { stats.errors++; console.error(`[kcproperties] Update error ${p.id}:`, error.message); }
                    else { stats.updated++; propertyId = ex.id; }
                } else {
                    const { data: inserted, error } = await supabase
                        .from('properties')
                        .insert(record)
                        .select('id')
                        .single();
                    if (error) { stats.errors++; console.error(`[kcproperties] Insert error ${p.id}:`, error.message); }
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
                console.error(`[kcproperties] materialize error ${p.id}:`, err);
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

export async function retranslateKCItems(
    feed: FeedSource,
    options: { itemIds?: string[]; deeplApiKey?: string; onProgress?: (done: number, total: number) => void } = {}
): Promise<{ updated: number; skipped: number; errors: number; total: number }> {
    const supabase = getAdminClient();
    const deeplKey = getDeeplKey(options.deeplApiKey);
    assertDeeplKey(deeplKey, 'KC Properties');

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
        const titles = batch.map(b => buildTitle(b.raw_data as KCProperty));
        const descs = batch.map(b => (b.raw_data as KCProperty).description_en || '');
        const all = [...titles, ...descs];

        const sk = await deeplTranslate(all, 'EN', 'SK', deeplKey);
        const cs = await deeplTranslate(all, 'EN', 'CS', deeplKey);
        const titlesSk = sk.slice(0, batch.length), descsSk = sk.slice(batch.length);
        const titlesCs = cs.slice(0, batch.length), descsCs = cs.slice(batch.length);

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const propId = item.selected_property_id as string;
            if (!editable.has(propId)) { stats.skipped++; continue; }
            const p = item.raw_data as KCProperty;
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
            if (error) { stats.errors++; console.error('[kcproperties] retranslate error:', error.message); }
            else stats.updated++;
        }
        options.onProgress?.(stats.updated + stats.skipped + stats.errors, items.length);
    }

    return stats;
}

// ============================================
// DESELECT
// ============================================

export async function deselectKCItems(
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
            console.error('[kcproperties] deselect error:', err);
        }
    }

    return { removed, errors };
}
