#!/usr/bin/env ts-node
/**
 * import-properties.ts
 * =====================
 * Parse the WordPress XML export and import all properties into Supabase.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/import-properties.ts [--dry-run]
 *
 * Flags:
 *   --dry-run   Preview all properties without inserting into Supabase
 */

// Load env vars FIRST
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIG
// ============================================

const XML_FILE = path.resolve(__dirname, '../../Properties-Export-2026-March-30-1443.xml');
const DRY_RUN = process.argv.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!DRY_RUN && (!supabaseUrl || !serviceRoleKey)) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ============================================
// TYPES
// ============================================

interface RawPost {
    ID: string;
    Title: string;
    Content: string;
    Date: string;
    Permalink: string;
    ImageURL: string;
    ImageFeatured: string;
    PropertyCategories: string;
    Status: string;
    // Property fields
    property_id: string;
    ownership: string;
    ready_date: string;
    rem_property_type: string;
    rem_property_condition: string;
    rem_property_category: string;
    rem_property_locality: string;
    rem_property_country: string;
    floors_obligate: string;
    floor_number: string;
    property_bedrooms: string;
    property_bathrooms: string;
    rem_property_beach_distance: string;
    rem_property_size: string;
    rem_property_land_size: string;
    rem_property_price: string;
    price_unit_sell: string;
    rem_property_purpose: string;
    rem_building_type: string;
    rem_building_kind: string;
    advantages: string;
    rem_property_pool_size: string;
    rem_property_airport_far: string;
    rem_property_export: string;
    locality_desc: string;
    rem_property_golf_distance: string;
    rem_property_category_house: string;
    rem_property_house_subtype: string;
    object_kind: string;
    building_area: string;
    total_area: string;
}

interface PropertyInsert {
    slug: string;
    property_id_external: string | null;
    title_sk: string;
    title_en: string | null;
    title_cz: string | null;
    description_sk: string | null;
    description_en: string | null;
    description_cz: string | null;
    location_sk: string;
    location_en: string | null;
    location_cz: string | null;
    country: string;
    city: string;
    distance_from_sea: number | null;
    property_type: string;
    status: string | null;
    ownership: string | null;
    disposition: string | null;
    beds: number;
    baths: number;
    area: number;
    land_area: number | null;
    floors: number | null;
    floor_number: number | null;
    parking: number;
    price: number;
    price_on_request: boolean;
    offer_type: string;
    unit: string;
    pool: boolean;
    balcony: boolean;
    garden: boolean;
    sea_view: boolean;
    first_line: boolean;
    new_build: boolean;
    new_project: boolean;
    luxury: boolean;
    golf: boolean;
    mountains: boolean;
    lodzia: boolean;
    terasa: boolean;
    cellar: boolean;
    garage: boolean;
    parking_spot: boolean;
    fireplace: boolean;
    near_airport: boolean;
    billiard_room: boolean;
    near_beach: boolean;
    near_golf: boolean;
    yoga_room: boolean;
    grand_garden: boolean;
    images: { url: string; alt: string; order: number }[];
    hero_image_index: number;
    tags: string[];
    preview_tags: string[];
    featured: boolean;
    publish_status: string;
    export_target: string | null;
    building_type: string | null;
    house_type: string | null;
    video_url: string | null;
    pdf_images: number[];
}

// ============================================
// XML PARSER (simple, no dependencies)
// ============================================

function parseXML(xmlContent: string): RawPost[] {
    const posts: RawPost[] = [];

    // Split by <post> tags
    const postMatches = xmlContent.split(/<post>/g).slice(1); // skip first empty

    for (const postXml of postMatches) {
        const post: Record<string, string> = {};

        // Extract each field
        const fields = [
            'ID', 'Title', 'Content', 'Excerpt', 'Date', 'PostType', 'Permalink',
            'ImageURL', 'ImageFeatured', 'AttachmentURL', 'PropertyTags', 'PropertyCategories',
            'property_id', '_property_id', 'ownership', '_ownership', 'ready_date', '_ready_date',
            'rem_property_type', '_rem_property_type', 'rem_property_condition', '_rem_property_condition',
            'rem_property_category', '_rem_property_category', 'rem_property_locality', '_rem_property_locality',
            'rem_property_country', '_rem_property_country', 'floors_obligate', '_floors_obligate',
            'floor_number', '_floor_number', 'property_bedrooms', '_property_bedrooms',
            'property_bathrooms', '_property_bathrooms', 'rem_property_beach_distance', '_rem_property_beach_distance',
            'rem_property_size', '_rem_property_size', 'rem_property_land_size', '_rem_property_land_size',
            'rem_property_price', '_rem_property_price', 'price_unit_sell', '_price_unit_sell',
            'rem_property_purpose', '_rem_property_purpose', 'rem_building_type', '_rem_building_type',
            'rem_building_kind', '_rem_building_kind', 'advantages', '_advantages',
            'rem_property_pool_size', '_rem_property_pool_size', 'rem_property_airport_far', '_rem_property_airport_far',
            '_rem_property_images', 'rem_property_export', '_rem_property_export',
            'locality_desc', '_locality_desc', 'rem_property_images', '_softreal_exported_id',
            'rem_property_golf_distance', '_rem_property_golf_distance',
            'rem_price', '_rem_price', 'rem_property_category_house', '_rem_property_category_house',
            'rem_property_house_subtype', '_rem_property_house_subtype',
            'object_kind', '_object_kind', 'building_area', '_building_area',
            'total_area', '_total_area', 'Status', 'AuthorID', 'AuthorUsername', 'AuthorEmail',
            'AuthorFirstName', 'AuthorLastName'
        ];

        for (const field of fields) {
            // Match both regular content and CDATA content
            const regex = new RegExp(`<${escapeRegex(field)}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escapeRegex(field)}>`);
            const match = postXml.match(regex);
            if (match) {
                post[field] = match[1].trim();
            } else {
                // Check for self-closing tag
                const selfClosing = new RegExp(`<${escapeRegex(field)}/>`);
                if (selfClosing.test(postXml)) {
                    post[field] = '';
                }
            }
        }

        posts.push(post as unknown as RawPost);
    }

    return posts;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// PHP SERIALIZED ARRAY PARSER
// ============================================

function parsePhpSerializedArray(str: string): string[] {
    if (!str || !str.startsWith('a:')) return [];
    const result: string[] = [];
    // Match s:N:"value"; patterns
    const regex = /s:\d+:"([^"]+)"/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
        result.push(match[1]);
    }
    return result;
}

// ============================================
// HELPERS
// ============================================

function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')     // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
        .trim();
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
        .replace(/\s+/g, '-')            // Spaces to hyphens
        .replace(/-+/g, '-')             // Collapse multiple hyphens
        .replace(/^-|-$/g, '')           // Trim hyphens
        .slice(0, 80);
}

function detectLanguage(permalink: string): 'sk' | 'cz' | 'en' {
    if (!permalink) return 'sk';
    if (permalink.includes('en.relaxproperties.sk')) return 'en';
    if (permalink.includes('relaxproperties.cz')) return 'cz';
    return 'sk'; // relaxproperties.sk
}

function parseIntSafe(val: string | undefined | null): number | null {
    if (!val || val.trim() === '') return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
}

function parseFloatSafe(val: string | undefined | null): number | null {
    if (!val || val.trim() === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

// ============================================
// CITY EXTRACTION
// ============================================

// Known cities/resorts mapped to their canonical English names
const CITY_PATTERNS: [RegExp, string][] = [
    // Bulgaria
    [/Slne[čc]n[eé] pobre[žz]ie|Sunny Beach/i, 'Sunny Beach'],
    [/Sveti Vlas|Sv[äaá]t[ýy] Vlas/i, 'Sveti Vlas'],
    [/Nesebar|Neseb[aá]r/i, 'Nesebar'],
    [/Aheloy/i, 'Aheloy'],
    [/Ravda/i, 'Ravda'],
    [/Burgas|Bourgas/i, 'Burgas'],
    [/Elenite/i, 'Elenite'],
    [/Pomorie/i, 'Pomorie'],
    [/Sozopol/i, 'Sozopol'],
    [/Primorsko/i, 'Primorsko'],
    [/Obzor/i, 'Obzor'],
    [/Byala|Bjala/i, 'Byala'],
    [/Sarafovo/i, 'Sarafovo'],
    [/Lozenets/i, 'Lozenets'],
    [/Nessebar/i, 'Nesebar'],
    // Spain
    [/Santa Pola/i, 'Santa Pola'],
    [/Torrevieja/i, 'Torrevieja'],
    [/Orihuela Costa/i, 'Orihuela Costa'],
    [/Playa Flamenca/i, 'Playa Flamenca'],
    [/Alicante/i, 'Alicante'],
    [/Costa Blanca/i, 'Costa Blanca'],
    [/Costa del Sol/i, 'Costa del Sol'],
    [/Malaga|Málaga/i, 'Málaga'],
    [/Benidorm/i, 'Benidorm'],
    [/Guardamar/i, 'Guardamar del Segura'],
    [/Torrelamata/i, 'Torrevieja'],
    [/La Mata/i, 'Torrevieja'],
    [/Torre de la Horadada/i, 'Torre de la Horadada'],
    [/Villamartin/i, 'Villamartín'],
    [/Rojales/i, 'Rojales'],
    [/San Miguel de Salinas/i, 'San Miguel de Salinas'],
    [/Benijófar/i, 'Benijófar'],
    // Croatia
    [/Rogoznica/i, 'Rogoznica'],
    [/Malinska/i, 'Malinska'],
    [/Krk/i, 'Krk'],
];

function extractCity(title: string, content: string, country: string): string {
    const text = `${title} ${content}`;
    for (const [pattern, city] of CITY_PATTERNS) {
        if (pattern.test(text)) {
            return city;
        }
    }
    // Fallback: use country
    return country || 'Unknown';
}

// ============================================
// CONDITION MAPPING
// ============================================

function mapCondition(condition: string): string | null {
    if (!condition) return null;
    const map: Record<string, string> = {
        'Novostavba': 'new',
        'Po rekonstrukci': 'renovated',
        'Pôvodný stav': 'original',
    };
    return map[condition] || condition;
}

// ============================================
// DISPOSITION MAPPING
// ============================================

function mapDisposition(category: string, houseCategory: string): string | null {
    if (houseCategory) {
        // House categories: 3kk, 4kk, etc.
        return houseCategory;
    }
    if (!category) return null;
    const map: Record<string, string> = {
        'Štúdiový apartmán': 'studio',
        'Dvojizbový apartmán': '2+kk',
        'Trojizbový apartmán': '3+kk',
        'Štvorizbový apartmán': '4+kk',
    };
    return map[category] || category;
}

// ============================================
// EXPORT TARGET PARSING
// ============================================

function parseExportTarget(exportField: string): string | null {
    if (!exportField) return null;
    const items = parsePhpSerializedArray(exportField);
    if (items.some(i => i.toLowerCase().includes('softreal') || i.toLowerCase().includes('realsoft'))) {
        return 'softreal';
    }
    return null;
}

// ============================================
// SEA VIEW DETECTION
// ============================================

function detectSeaView(title: string, content: string): boolean {
    const text = `${title} ${content}`.toLowerCase();
    return (
        text.includes('výhľad na more') ||
        text.includes('výhľadom na more') ||
        text.includes('výhled na moře') ||
        text.includes('výhledem na moře') ||
        text.includes('sea view') ||
        text.includes('view of the sea') ||
        text.includes('panoramatick') ||
        text.includes('panoramic')
    );
}

// ============================================
// LOCATION DESCRIPTION EXTRACTION
// ============================================

function extractLocationSk(title: string): string {
    // Try to extract the location part from the SK title
    // Titles usually contain the complex name and location
    return title || '';
}

// ============================================
// BUILD PREVIEW TAGS
// ============================================

function buildPreviewTags(advantages: string[], beachDist: number | null, seaView: boolean, pool: boolean): string[] {
    const tags: string[] = [];
    if (seaView) tags.push('sea_view');
    if (pool || advantages.includes('pool')) tags.push('pool');
    if (advantages.includes('balcony')) tags.push('balcony');
    if (advantages.includes('terrace')) tags.push('terrace');
    if (advantages.includes('parking')) tags.push('parking');
    if (beachDist !== null && beachDist <= 100) tags.push('first_line');
    if (advantages.includes('near_airport')) tags.push('near_airport');
    if (advantages.includes('beach')) tags.push('near_beach');
    return tags.slice(0, 6); // Max 6 preview tags
}

// ============================================
// MAIN IMPORT LOGIC
// ============================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Relax Properties — XML Import Script                   ║');
    console.log(`║  Mode: ${DRY_RUN ? '🔍 DRY RUN (no database writes)' : '🚀 LIVE IMPORT'}                    ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log();

    // 1. Read and parse XML
    console.log(`📄 Reading XML file: ${XML_FILE}`);
    const xmlContent = fs.readFileSync(XML_FILE, 'utf-8');
    const allPosts = parseXML(xmlContent);
    console.log(`   Found ${allPosts.length} total posts`);

    // 2. Filter out posts with no property_id
    const validPosts = allPosts.filter(p => p.property_id && p.property_id.trim());
    const skippedPosts = allPosts.length - validPosts.length;
    console.log(`   ✅ Valid posts (with property_id): ${validPosts.length}`);
    console.log(`   ⏭️  Skipped (no property_id): ${skippedPosts}`);

    // 3. Group by property_id
    const groups = new Map<string, { sk?: RawPost; cz?: RawPost; en?: RawPost }>();
    for (const post of validPosts) {
        const pid = post.property_id.trim();
        const lang = detectLanguage(post.Permalink);

        if (!groups.has(pid)) {
            groups.set(pid, {});
        }
        groups.get(pid)![lang] = post;
    }
    console.log(`   📦 Unique properties: ${groups.size}`);
    console.log();

    // 4. Build property records
    const properties: PropertyInsert[] = [];
    const errors: { pid: string; error: string }[] = [];
    const usedSlugs = new Set<string>();

    for (const [pid, langVersions] of groups) {
        try {
            // Pick the "primary" version for structured data (prefer SK, then CZ, then EN)
            const primary = langVersions.sk || langVersions.cz || langVersions.en;
            if (!primary) {
                errors.push({ pid, error: 'No language version found' });
                continue;
            }

            // Extract advantages from PHP serialized array
            const advantagesRaw = primary.advantages || '';
            const advantages = parsePhpSerializedArray(advantagesRaw);

            // Parse numeric fields
            const beachDistance = parseIntSafe(primary.rem_property_beach_distance);
            const area = parseFloatSafe(primary.rem_property_size) || 0;
            const landArea = parseFloatSafe(primary.rem_property_land_size);
            const price = parseIntSafe(primary.rem_property_price) || 0;
            const beds = parseIntSafe(primary.property_bedrooms) || 0;
            const baths = parseIntSafe(primary.property_bathrooms) || 0;
            const floors = parseIntSafe(primary.floors_obligate);
            const floorNumber = parseIntSafe(primary.floor_number);
            const country = primary.rem_property_country || 'Bulgaria';

            // Titles
            const titleSk = langVersions.sk?.Title || langVersions.cz?.Title || langVersions.en?.Title || pid;
            const titleEn = langVersions.en?.Title || null;
            const titleCz = langVersions.cz?.Title || null;

            // Descriptions — strip HTML
            const descSk = langVersions.sk ? stripHtml(langVersions.sk.Content) : (langVersions.cz ? stripHtml(langVersions.cz.Content) : null);
            const descEn = langVersions.en ? stripHtml(langVersions.en.Content) : null;
            const descCz = langVersions.cz ? stripHtml(langVersions.cz.Content) : null;

            // City
            const city = extractCity(
                titleSk + ' ' + (titleEn || ''),
                (descSk || '') + ' ' + (descEn || ''),
                country
            );

            // Sea view detection
            const seaView = detectSeaView(
                `${titleSk} ${titleEn || ''} ${titleCz || ''}`,
                `${descSk || ''} ${descEn || ''} ${descCz || ''}`
            );

            // Property type
            const propType = primary.rem_property_type === 'House / Villa' ? 'house' : 'apartment';

            // Condition
            const condition = mapCondition(primary.rem_property_condition);

            // Disposition
            const disposition = mapDisposition(
                primary.rem_property_category,
                primary.rem_property_category_house
            );

            // Images
            const imageUrls = (primary.ImageURL || '').split('|').filter(u => u.trim());
            // If SK has no images, try CZ or EN
            let finalImageUrls = imageUrls;
            if (finalImageUrls.length === 0 && langVersions.cz?.ImageURL) {
                finalImageUrls = langVersions.cz.ImageURL.split('|').filter(u => u.trim());
            }
            if (finalImageUrls.length === 0 && langVersions.en?.ImageURL) {
                finalImageUrls = langVersions.en.ImageURL.split('|').filter(u => u.trim());
            }
            const images = finalImageUrls.map((url, i) => ({
                url: url.trim(),
                alt: titleEn || titleSk || '',
                order: i,
            }));

            // Slug — ensure uniqueness
            let slug = generateSlug(titleSk);
            if (!slug) slug = generateSlug(titleEn || pid);
            if (usedSlugs.has(slug)) {
                let counter = 2;
                while (usedSlugs.has(`${slug}-${counter}`)) counter++;
                slug = `${slug}-${counter}`;
            }
            usedSlugs.add(slug);

            // Export target
            const exportTarget = parseExportTarget(primary.rem_property_export);

            // Status mapping
            const publishStatus = primary.Status === 'publish' ? 'published' : 'published'; // User said ALL published

            // First line
            const firstLine = beachDistance !== null && beachDistance <= 100;

            // Build property
            const property: PropertyInsert = {
                slug,
                property_id_external: pid,
                title_sk: titleSk,
                title_en: titleEn,
                title_cz: titleCz,
                description_sk: descSk,
                description_en: descEn,
                description_cz: descCz,
                location_sk: titleSk,
                location_en: titleEn,
                location_cz: titleCz,
                country,
                city,
                distance_from_sea: beachDistance,
                property_type: propType,
                status: condition,
                ownership: primary.ownership || null,
                disposition,
                beds,
                baths,
                area: Math.round(area),
                land_area: landArea ? Math.round(landArea) : null,
                floors,
                floor_number: floorNumber,
                parking: advantages.includes('parking') ? 1 : 0,
                price,
                price_on_request: price === 0,
                offer_type: 'sell',
                unit: primary.price_unit_sell || 'property',
                pool: advantages.includes('pool'),
                balcony: advantages.includes('balcony'),
                garden: advantages.includes('epic_garden'),
                sea_view: seaView,
                first_line: firstLine,
                new_build: primary.rem_property_condition === 'Novostavba',
                new_project: false,
                luxury: false,
                golf: false,
                mountains: false,
                lodzia: advantages.includes('loggia'),
                terasa: advantages.includes('terrace'),
                cellar: advantages.includes('cellar'),
                garage: false,
                parking_spot: advantages.includes('parking'),
                fireplace: false,
                near_airport: advantages.includes('near_airport'),
                billiard_room: false,
                near_beach: advantages.includes('beach'),
                near_golf: false,
                yoga_room: false,
                grand_garden: advantages.includes('epic_garden'),
                images,
                hero_image_index: 0,
                tags: [],
                preview_tags: buildPreviewTags(advantages, beachDistance, seaView, advantages.includes('pool')),
                featured: false,
                publish_status: publishStatus,
                export_target: exportTarget,
                building_type: primary.rem_building_type || primary.object_kind || null,
                house_type: primary.rem_property_house_subtype || null,
                video_url: null,
                pdf_images: [],
            };

            properties.push(property);
        } catch (err) {
            errors.push({ pid, error: String(err) });
        }
    }

    // 5. Report
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Properties to import: ${properties.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n   ⚠️  Errors:');
        for (const e of errors) {
            console.log(`      ${e.pid}: ${e.error}`);
        }
    }

    // Country breakdown
    const byCountry = new Map<string, number>();
    for (const p of properties) {
        byCountry.set(p.country, (byCountry.get(p.country) || 0) + 1);
    }
    console.log('\n   🌍 By country:');
    for (const [country, count] of byCountry) {
        console.log(`      ${country}: ${count}`);
    }

    // City breakdown
    const byCity = new Map<string, number>();
    for (const p of properties) {
        byCity.set(p.city, (byCity.get(p.city) || 0) + 1);
    }
    console.log('\n   🏙️  By city:');
    for (const [city, count] of [...byCity.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`      ${city}: ${count}`);
    }

    // Type breakdown
    const byType = new Map<string, number>();
    for (const p of properties) {
        byType.set(p.property_type, (byType.get(p.property_type) || 0) + 1);
    }
    console.log('\n   🏠 By type:');
    for (const [type, count] of byType) {
        console.log(`      ${type}: ${count}`);
    }

    // Language coverage
    let full3 = 0, partial2 = 0, partial1 = 0;
    for (const p of properties) {
        const langCount = [p.title_sk, p.title_en, p.title_cz].filter(Boolean).length;
        if (langCount === 3) full3++;
        else if (langCount === 2) partial2++;
        else partial1++;
    }
    console.log('\n   🌐 Language coverage:');
    console.log(`      3 languages (SK+EN+CZ): ${full3}`);
    console.log(`      2 languages: ${partial2}`);
    console.log(`      1 language: ${partial1}`);

    // Price range
    const prices = properties.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
    if (prices.length > 0) {
        console.log(`\n   💰 Price range: €${prices[0].toLocaleString()} — €${prices[prices.length - 1].toLocaleString()}`);
        console.log(`      Median: €${prices[Math.floor(prices.length / 2)].toLocaleString()}`);
    }

    // Image stats
    const imageCounts = properties.map(p => p.images.length);
    const totalImages = imageCounts.reduce((a, b) => a + b, 0);
    const noImages = imageCounts.filter(c => c === 0).length;
    console.log(`\n   📷 Images: ${totalImages} total, avg ${Math.round(totalImages / properties.length)} per property`);
    if (noImages > 0) console.log(`      ⚠️  ${noImages} properties with 0 images`);

    console.log('\n═══════════════════════════════════════════════════════════');

    // 6. DRY RUN: show each property
    if (DRY_RUN) {
        console.log('\n🔍 DRY RUN — Property details:\n');
        for (let i = 0; i < properties.length; i++) {
            const p = properties[i];
            console.log(`[${i + 1}/${properties.length}] ${p.property_id_external}`);
            console.log(`   📝 ${p.title_sk}`);
            if (p.title_en) console.log(`   🇬🇧 ${p.title_en}`);
            if (p.title_cz) console.log(`   🇨🇿 ${p.title_cz}`);
            console.log(`   🏙️  ${p.city}, ${p.country}`);
            console.log(`   💰 €${p.price.toLocaleString()} | 🛏️ ${p.beds} beds | 🚿 ${p.baths} baths | 📐 ${p.area}m²`);
            console.log(`   🏖️  ${p.distance_from_sea}m from sea | 📷 ${p.images.length} images`);
            console.log(`   🔗 /${p.slug}`);
            const flags = [];
            if (p.pool) flags.push('🏊 pool');
            if (p.balcony) flags.push('🏗️ balcony');
            if (p.sea_view) flags.push('🌊 sea view');
            if (p.first_line) flags.push('⭐ first line');
            if (p.new_build) flags.push('🆕 new build');
            if (p.garden) flags.push('🌳 garden');
            if (p.near_airport) flags.push('✈️ near airport');
            if (p.near_beach) flags.push('🏖️ near beach');
            if (flags.length > 0) console.log(`   🏷️  ${flags.join(' | ')}`);
            console.log();
        }
        console.log('✅ Dry run complete. Run without --dry-run to insert into Supabase.');
        return;
    }

    // 7. INSERT INTO SUPABASE
    console.log('\n🚀 Inserting properties into Supabase...\n');

    let inserted = 0;
    let failed = 0;

    // Insert in batches of 10
    const batchSize = 10;
    for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        const { data, error } = await supabase
            .from('properties')
            .insert(batch)
            .select('id, property_id_external, title_sk');

        if (error) {
            console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} FAILED: ${error.message}`);
            // Try one by one to identify the problematic record
            for (const prop of batch) {
                const { error: singleError } = await supabase
                    .from('properties')
                    .insert(prop)
                    .select('id');

                if (singleError) {
                    console.error(`      ❌ ${prop.property_id_external}: ${singleError.message}`);
                    failed++;
                } else {
                    console.log(`      ✅ ${prop.property_id_external}: ${prop.title_sk.slice(0, 60)}`);
                    inserted++;
                }
            }
        } else {
            inserted += batch.length;
            for (const row of (data || [])) {
                console.log(`   ✅ ${row.property_id_external}: ${row.title_sk?.slice(0, 60)}`);
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🎉 IMPORT COMPLETE`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped (no property_id): ${skippedPosts}`);
    console.log('═══════════════════════════════════════════════════════════');
}

// Run
main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
