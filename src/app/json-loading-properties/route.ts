import { NextResponse } from 'next/server';
import { getPublishedProperties, type PropertyRecord } from '@/lib/property-store';
import { htmlToPlainText } from '@/lib/export-formatters';

/**
 * GET /json-loading-properties/
 *
 * Public JSON feed consumed by Slovak advertising portals (nehnutelnosti.sk / United Classifieds).
 *
 * Format: RealSoft v1 "Import" schema — array of OfficeData objects:
 *   [{ office, user_data: [{ user, advertisements: [Advertisement, …] }] }]
 *
 * Schema source: https://plt.unitedclassifieds.sk/import/docs/v1/realsoft/
 * Validation:    POST https://plt.unitedclassifieds.sk/import/api/v1/realsoft/validation
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
// PORTAL CODE MAPPINGS (official RealSoft v1 enums)
// ============================================

/**
 * Advertisement categories (Advertisement.category):
 *   9  = Garsónka (Studio Apartment)
 *   11 = 1-izbový byt        12 = 2-izbový byt
 *   13 = 3-izbový byt        14 = 4-izbový byt
 *   15 = 5 a viac izbový byt
 *   20 = Rodinný dom (Family House)
 *   30 = Pozemok pre rodinný dom
 *   58 = Komerčný objekt
 */
const CATEGORY = {
    GARSONKA: 9,
    BYT_1: 11,
    BYT_2: 12,
    BYT_3: 13,
    BYT_4: 14,
    BYT_5_PLUS: 15,
    RODINNY_DOM: 20,
    POZEMOK_RD: 30,
    KOMERCNY_OBJEKT: 58,
} as const;

/**
 * Room count from disposition slug.
 * Czech/Slovak convention: '3kk' / '3+kk' / '3_room' = 3 obytné miestnosti.
 * 'studio' = garsónka (single open-plan room).
 */
function roomsFromDisposition(disposition: string | null): number | null {
    if (!disposition) return null;
    if (disposition === 'studio') return 1;
    const m = disposition.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : null;
}

function getCategoryCode(p: PropertyRecord): number {
    const t = (p.property_type || '').toLowerCase();

    if (t === 'land' || t === 'plot') return CATEGORY.POZEMOK_RD;
    if (t === 'commercial') return CATEGORY.KOMERCNY_OBJEKT;
    if (t === 'family_house_villa' || t === 'house' || t === 'villa' || t === 'townhouse') {
        return CATEGORY.RODINNY_DOM;
    }

    // Apartment-like: studio_apartment_flat | apartment | studio | penthouse
    if (t === 'studio' || p.disposition === 'studio') return CATEGORY.GARSONKA;

    // Prefer disposition; fall back to bedrooms (izby = spálne + obývačka)
    const rooms = roomsFromDisposition(p.disposition) ?? (p.beds > 0 ? p.beds + 1 : 0);
    if (rooms <= 0) return CATEGORY.GARSONKA;
    if (rooms === 1) return CATEGORY.BYT_1;
    if (rooms === 2) return CATEGORY.BYT_2;
    if (rooms === 3) return CATEGORY.BYT_3;
    if (rooms === 4) return CATEGORY.BYT_4;
    return CATEGORY.BYT_5_PLUS;
}

/**
 * Real estate state (Advertisement.real_estate_state):
 *   136 = Novostavba, 137 = Čiastočná rekonštrukcia, 138 = Kompletná rekonštrukcia,
 *   139 = Pôvodný stav, 140 = Vo výstavbe, 141 = Developerský projekt
 */
const STATUS_TO_STATE: Record<string, number> = {
    novostavba: 136,
    new: 136,
    po_vystavbe: 140,
    vo_faze_projektovania: 141,
    renovated: 138,
    po_rekonstrukcii: 138,
    povodny_stav: 139,
};

function getRealEstateState(p: PropertyRecord): number {
    const mapped = STATUS_TO_STATE[p.status ?? ''];
    if (mapped) return mapped;
    return p.new_build || p.new_project ? 136 : 139;
}

/** Ownership (340 = družstevné, 344 = osobné, 345 = štátne, 346 = iné) */
const OWNERSHIP_MAP: Record<string, number> = {
    osobne: 344,
    druzstevne: 340,
    statna_vseobecna: 345,
    podielove: 346,
};

/** building_type slugs → portal building_type codes */
const BUILDING_TYPE_MAP: Record<string, number> = {
    drevena: 411,
    kamenna: 413,
    montovana: 415,
    panelova: 416,
    skeletova: 417,
    tehlova: 418,
    zmiesana: 419,
};

/** house_type slugs → portal type_of_house codes (975 = klasický, 976 = vila, 978 = drevodom) */
const TYPE_OF_HOUSE_MAP: Record<string, number> = {
    family: 975,
    villa: 976,
    wood: 978,
};

/**
 * Country → state_id for the portal Location schema.
 * IDs come from the portal's official state reference table
 * (https://admin.realsoft.sk/api/counter/state — auth required).
 */
const COUNTRY_STATE_ID: Record<string, number> = {
    slovakia: 1,
    czechia: 2,
    austria: 5,
    germany: 6,
    spain: 7,
    italy: 8,
    croatia: 9,
    bulgaria: 11,
    france: 17,
    portugal: 24,
    greece: 32,
    montenegro: 47,
};

// ============================================
// TRANSFORMER
// ============================================

function toPortalAdvertisement(p: PropertyRecord) {
    const category = getCategoryCode(p);
    const isHouse = category === CATEGORY.RODINNY_DOM;
    const isLand = category === CATEGORY.POZEMOK_RD;
    const isFlat = category >= CATEGORY.GARSONKA && category <= 18;
    const isRent = p.offer_type === 'rent';
    const rooms = roomsFromDisposition(p.disposition) ?? (p.beds > 0 ? p.beds + 1 : null);

    const ad: Record<string, unknown> = {
        source_id: p.property_id_external || p.id,
        category,
        transaction: isRent ? 123 : 127, // 123 = Prenájom, 127 = Predaj
        title: p.title_sk || '',
        description: htmlToPlainText(p.description_sk) || p.title_sk || '',
        price: p.price ?? 0,
        units: isRent ? 149 : 147, // 149 = €/mesiac, 147 = € (za nehnuteľnosť)
        price_by_agreement: !!p.price_on_request,
        currency: 167, // EUR
        usable_area: isLand ? 0 : (p.area ?? 0),
        building_area: 0, // zastavaná plocha — not tracked in our data
        land_area: isLand ? (p.area ?? p.land_area ?? 0) : (isHouse ? (p.land_area ?? 0) : 0),
        real_estate_state: getRealEstateState(p),
        ownership: OWNERSHIP_MAP[p.ownership ?? ''] ?? 344, // default: osobné vlastníctvo
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

    if (rooms != null && !isLand) ad.rooms_count = rooms;
    if (isFlat && p.floor_number != null) ad.floor = p.floor_number;
    if (p.floors != null) ad.number_of_overhead_floors = p.floors;
    if (p.latitude != null && p.longitude != null) {
        ad.geo_point = { lat: String(p.latitude), lon: String(p.longitude) };
    }
    if (p.year != null && p.year >= 1900 && p.year <= 2030) ad.year_of_construction = p.year;
    if (p.reserved) ad.availability = 242; // Rezervované

    const buildingType = BUILDING_TYPE_MAP[p.building_type ?? ''];
    if (buildingType) ad.building_type = [buildingType];

    const typeOfHouse = TYPE_OF_HOUSE_MAP[p.house_type ?? ''];
    if (isHouse && typeOfHouse) ad.type_of_house = typeOfHouse;

    if (p.video_url) ad.video_url = [p.video_url];

    // Feature booleans → portal extra counts (we track presence, not counts → 1)
    const extra: Record<string, number> = {};
    if (p.balcony) extra.number_of_balconies = 1;
    if (p.lodzia) extra.number_of_loggies = 1;
    if (p.terasa) extra.terraces_count = 1;
    if (p.cellar) extra.cellar_count = 1;
    if (p.garage) extra.garage_count = 1;
    if (p.parking > 0) extra.outdoor_parking_space_count = p.parking;
    else if (p.parking_spot) extra.outdoor_parking_space_count = 1;
    if (Object.keys(extra).length > 0) ad.extra = extra;

    return ad;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET() {
    try {
        const allRecords = await getPublishedProperties();
        const records = allRecords.filter(p => p.export_target?.includes('sk'));

        // Single OfficeData wrapper: one office, one user, all advertisements
        const feed = [
            {
                office: OFFICE,
                user_data: [
                    {
                        user: USER,
                        advertisements: records.map(toPortalAdvertisement),
                    },
                ],
            },
        ];

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
