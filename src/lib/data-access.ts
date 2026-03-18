/**
 * Data Access Layer
 *
 * This module provides helpers for public-facing pages to access property data.
 * - Server components: use getPropertiesServer() (calls Supabase directly)
 * - Client components: use useProperties() hook or fetch from /api/properties
 * - Static filter options remain in-memory (not in DB yet)
 */

import { getPublishedProperties, type PropertyRecord } from './property-store';

export type Language = 'sk' | 'en' | 'cz';

// The shape the public site expects (legacy-compatible with mock data)
export interface PublicProperty {
    id: string;
    slug: string;
    propertyIdExternal?: string | null;
    title: string;
    location: string;
    locationDescription?: string;
    country: string;
    price: number;
    priceFormatted: string;
    beds: number;
    baths: number;
    area: number;
    type: string;
    images: string[];
    featured: boolean;
    year?: number | null;
    parking?: number;
    pool?: boolean;
    balcony?: boolean;
    garden?: boolean;
    description?: string;
    seaView?: boolean;
    firstLine?: boolean;
    newBuild?: boolean;
    newProject?: boolean;
    luxury?: boolean;
    golf?: boolean;
    mountains?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    mapZoom?: number | null;
    previewTags?: string[];
    videoUrl?: string | null;
    floors?: number | null;
    floorNumber?: number | null;
    distanceFromSea?: number | null;
    landArea?: number | null;
    lodzia?: boolean;
    terasa?: boolean;
    cellar?: boolean;
    garage?: boolean;
    parkingSpot?: boolean;
    fireplace?: boolean;
    nearAirport?: boolean;
    nearBeach?: boolean;
    nearGolf?: boolean;
    yogaRoom?: boolean;
    billiardRoom?: boolean;
    grandGarden?: boolean;
    offerType?: string;
    disposition?: string | null;
    status?: string | null;
    ownership?: string | null;
    heroImageIndex?: number;
    pdfImages?: number[];
}

// Transform a Supabase row into the public shape
export function toPublicProperty(p: PropertyRecord, lang: Language = 'sk'): PublicProperty {
    const title = lang === 'en' ? (p.title_en || p.title_sk) : lang === 'cz' ? (p.title_cz || p.title_sk) : p.title_sk;
    const location = lang === 'en' ? (p.location_en || p.location_sk) : lang === 'cz' ? (p.location_cz || p.location_sk) : p.location_sk;
    const description = lang === 'en' ? (p.description_en || p.description_sk) : lang === 'cz' ? (p.description_cz || p.description_sk) : (p.description_sk || undefined);
    const locationDescription = lang === 'en' ? (p.location_description_en || p.location_description_sk) : lang === 'cz' ? (p.location_description_cz || p.location_description_sk) : (p.location_description_sk || undefined);

    return {
        id: p.id,
        slug: p.slug,
        propertyIdExternal: p.property_id_external,
        title,
        location,
        locationDescription: locationDescription || undefined,
        country: p.country,
        price: p.price,
        priceFormatted: p.price_on_request ? 'Cena na vyžiadanie' : `€ ${p.price.toLocaleString('en-US')}`,
        beds: p.beds,
        baths: p.baths,
        area: p.area,
        type: p.property_type,
        images: (p.images || []).map((img) => typeof img === 'string' ? img : img.url),
        featured: p.featured,
        year: p.year,
        parking: p.parking,
        pool: p.pool,
        balcony: p.balcony,
        garden: p.garden,
        description: description || undefined,
        seaView: p.sea_view,
        firstLine: p.first_line,
        newBuild: p.new_build,
        newProject: p.new_project,
        luxury: p.luxury,
        golf: p.golf,
        mountains: p.mountains,
        latitude: p.latitude,
        longitude: p.longitude,
        mapZoom: p.map_zoom,
        previewTags: p.preview_tags || [],
        videoUrl: p.video_url,
        floors: p.floors,
        floorNumber: p.floor_number,
        distanceFromSea: p.distance_from_sea,
        landArea: p.land_area,
        lodzia: p.lodzia,
        terasa: p.terasa,
        cellar: p.cellar,
        garage: p.garage,
        parkingSpot: p.parking_spot,
        fireplace: p.fireplace,
        nearAirport: p.near_airport,
        nearBeach: p.near_beach,
        nearGolf: p.near_golf,
        yogaRoom: p.yoga_room,
        billiardRoom: p.billiard_room,
        grandGarden: p.grand_garden,
        offerType: p.offer_type,
        disposition: p.disposition,
        status: p.status,
        ownership: p.ownership,
        heroImageIndex: p.hero_image_index ?? 0,
        pdfImages: p.pdf_images || [],
    };
}

/**
 * SERVER-SIDE: Fetch published properties from Supabase
 * Use this in Server Components and API routes
 */
export async function getPropertiesServer(lang: Language = 'sk'): Promise<PublicProperty[]> {
    try {
        const records = await getPublishedProperties();
        return records.map(r => toPublicProperty(r, lang));
    } catch (error) {
        console.error('Failed to fetch properties from Supabase:', error);
        return [];
    }
}

/**
 * SERVER-SIDE: Fetch a single property by ID
 * Only returns published properties for public pages
 */
export async function getPropertyByIdServer(id: string, lang: Language = 'sk'): Promise<PublicProperty | null> {
    try {
        const { getPropertyById } = await import('./property-store');
        const record = await getPropertyById(id);
        if (!record || record.publish_status !== 'published') return null;
        return toPublicProperty(record, lang);
    } catch (error) {
        console.error('Failed to fetch property:', error);
        return null;
    }
}


// ============================================
// STATIC FILTER OPTIONS (not in DB)
// ============================================

interface FilterOption {
    value: string;
    label: string;
}

const countriesMap: Record<string, Record<Language, string>> = {
    all: { sk: 'Všetky krajiny', en: 'All countries', cz: 'Všechny země' },
    spain: { sk: 'Španielsko', en: 'Spain', cz: 'Španělsko' },
    croatia: { sk: 'Chorvátsko', en: 'Croatia', cz: 'Chorvatsko' },
    italy: { sk: 'Taliansko', en: 'Italy', cz: 'Itálie' },
    portugal: { sk: 'Portugalsko', en: 'Portugal', cz: 'Portugalsko' },
    greece: { sk: 'Grécko', en: 'Greece', cz: 'Řecko' },
    montenegro: { sk: 'Čierna Hora', en: 'Montenegro', cz: 'Černá Hora' },
    bulgaria: { sk: 'Bulharsko', en: 'Bulgaria', cz: 'Bulharsko' },
};

const propertyTypesMap: Record<string, Record<Language, string>> = {
    all: { sk: 'Všetky typy', en: 'All types', cz: 'Všechny typy' },
    villa: { sk: 'Vila', en: 'Villa', cz: 'Vila' },
    apartment: { sk: 'Apartmán', en: 'Apartment', cz: 'Apartmán' },
    house: { sk: 'Dom', en: 'House', cz: 'Dům' },
    land: { sk: 'Pozemok', en: 'Land', cz: 'Pozemek' },
};

const priceRangesMap: Record<string, Record<Language, string>> = {
    all: { sk: 'Akákoľvek cena', en: 'Any price', cz: 'Jakákoliv cena' },
    '0-100000': { sk: 'Do 100 000 €', en: 'Up to €100,000', cz: 'Do 100 000 €' },
    '100000-250000': { sk: '100 000 - 250 000 €', en: '€100,000 - €250,000', cz: '100 000 - 250 000 €' },
    '250000-500000': { sk: '250 000 - 500 000 €', en: '€250,000 - €500,000', cz: '250 000 - 500 000 €' },
    '500000+': { sk: 'Nad 500 000 €', en: 'Over €500,000', cz: 'Nad 500 000 €' },
};

const bedroomOptionsMap: Record<string, Record<Language, string>> = {
    all: { sk: 'Ľubovoľný počet', en: 'Any bedrooms', cz: 'Libovolný počet' },
    '1': { sk: '1 spálňa', en: '1 bedroom', cz: '1 ložnice' },
    '2': { sk: '2 spálne', en: '2 bedrooms', cz: '2 ložnice' },
    '3': { sk: '3 spálne', en: '3 bedrooms', cz: '3 ložnice' },
    '4+': { sk: '4+ spální', en: '4+ bedrooms', cz: '4+ ložnic' },
};

const sortOptionsMap: Record<string, Record<Language, string>> = {
    featured: { sk: 'Odporúčané', en: 'Featured', cz: 'Doporučené' },
    newest: { sk: 'Najnovšie', en: 'Newest', cz: 'Nejnovější' },
    'price-asc': { sk: 'Cena: najnižšia', en: 'Price: low to high', cz: 'Cena: nejnižší' },
    'price-desc': { sk: 'Cena: najvyššia', en: 'Price: high to low', cz: 'Cena: nejvyšší' },
};

function localizeMap(map: Record<string, Record<Language, string>>, lang: Language): FilterOption[] {
    return Object.entries(map).map(([value, labels]) => ({
        value,
        label: labels[lang] || labels.sk,
    }));
}

export function getFilterOptions(lang: Language = 'sk') {
    return {
        countries: localizeMap(countriesMap, lang),
        propertyTypes: localizeMap(propertyTypesMap, lang),
        priceRanges: localizeMap(priceRangesMap, lang),
        bedroomOptions: localizeMap(bedroomOptionsMap, lang),
        sortOptions: localizeMap(sortOptionsMap, lang),
    };
}

// Re-export for backwards compatibility
export const countries = localizeMap(countriesMap, 'sk');
export const propertyTypes = localizeMap(propertyTypesMap, 'sk');
export const priceRanges = localizeMap(priceRangesMap, 'sk');
export const bedroomOptions = localizeMap(bedroomOptionsMap, 'sk');
export const sortOptions = localizeMap(sortOptionsMap, 'sk');
