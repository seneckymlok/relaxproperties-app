import { NextResponse } from 'next/server';
import { getPublishedProperties, type PropertyRecord } from '@/lib/property-store';

/**
 * GET /json-loading-properties/
 *
 * Public JSON feed consumed by Slovak advertising portals (nehnutelnosti.sk / United Classifieds).
 * Format matches the portal's expected schema: array of {office, user_data} wrappers
 * with numeric category/transaction/state codes.
 *
 * This URL is registered with the portals and pulled on their schedule.
 * No authentication required — returns published properties only.
 */

// ============================================
// STATIC OFFICE & USER DATA
// ============================================

const OFFICE = {
    source_id: '01',
    name: 'Relax Properties s. r. o.',
    phone: '+421 911 819 152',
    email: 'info@relaxproperties.sk',
    city: 'Stupava',
    zip: '900 31',
    street: 'Na vyhliadke',
    street_number: 5,
    contact_person: 'Mgr. Aleš Dvořák',
};

const USER = {
    source_id: '001',
    last_name: 'Relax Properties',
    phone: '+421 911 819 152',
    email: 'info@relaxproperties.sk',
};

// ============================================
// PORTAL CODE MAPPINGS
// ============================================

/**
 * Category codes (nehnutelnosti.sk property type categories)
 * 9  = Garsónka / štúdio (studio)
 * 12 = 2-izbový byt (2-room = 1 bedroom + living)
 * 13 = 3-izbový byt (3-room = 2 bedrooms + living)
 * 14 = 4+ izbový byt (4+ rooms)
 * 16 = Dom (house/villa)
 * 17 = Pozemok (land)
 * 18 = Komerčná (commercial)
 */
function getCategoryCode(p: PropertyRecord): number {
    // Property type overrides
    if (p.property_type === 'land') return 17;
    if (p.property_type === 'commercial') return 18;
    if (p.property_type === 'house' || p.property_type === 'villa' || p.property_type === 'townhouse') return 16;

    // Apartment-type: map by beds (bedrooms)
    if (p.property_type === 'studio' || p.beds === 0) return 9;
    if (p.beds === 1) return 12;
    if (p.beds === 2) return 13;
    return 14; // 3+ bedrooms
}

/**
 * Real estate state codes (condition)
 * 136 = Novostavba (New build)
 * 138 = Dobrý stav (Good condition)
 * 139 = Po rekonštrukcii (After reconstruction)
 */
function getRealEstateState(p: PropertyRecord): number {
    if (p.new_build || p.new_project) return 136;
    return 138; // Default: good condition
}

/**
 * Country → state_id mapping for nehnutelnosti.sk location schema
 * 11 = Bulharsko (confirmed from old feed data)
 * Other country codes should be verified with the portal.
 */
const COUNTRY_STATE_ID: Record<string, number> = {
    bulgaria: 11,
    spain: 12,
    croatia: 13,
    italy: 14,
    portugal: 15,
    greece: 16,
    montenegro: 17,
    austria: 18,
    france: 19,
    germany: 20,
    czechia: 21,
    slovakia: 22,
};

// ============================================
// TRANSFORMER
// ============================================

function toPortalAdvertisement(p: PropertyRecord) {
    return {
        category: getCategoryCode(p),
        transaction: 127, // Predaj (sale)
        title: p.title_sk,
        description: p.description_sk || '',
        real_estate_state: getRealEstateState(p),
        ownership: 344, // Osobné vlastníctvo
        price: p.price,
        units: 147, // Price per unit type
        price_by_agreement: p.price_on_request,
        currency: 167, // EUR
        usable_area: p.area,
        building_area: 0,
        land_area: p.property_type === 'land' ? p.area : 0,
        source_id: p.property_id_external || p.id,
        street: '',
        location: {
            state_id: COUNTRY_STATE_ID[(p.country ?? '').toLowerCase()] ?? 0,
            county_id: 0,
            district_id: 0,
            region_id: 0,
            street_id: 0,
        },
        images: (p.images || []).map((img) => ({
            url: typeof img === 'string' ? img : img.url,
        })),
    };
}

function toPortalItem(p: PropertyRecord) {
    return {
        office: OFFICE,
        user_data: [
            {
                user: USER,
                advertisements: [toPortalAdvertisement(p)],
            },
        ],
    };
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET() {
    try {
        const allRecords = await getPublishedProperties();
        const records = allRecords.filter(p => p.export_target?.includes('sk'));
        const feed = records.map(toPortalItem);

        return NextResponse.json(feed, {
            headers: {
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('JSON feed error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
