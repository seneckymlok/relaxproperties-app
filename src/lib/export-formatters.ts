/**
 * Export Formatters
 *
 * Converts PropertyRecord objects to XML formats required by:
 *   - Slovak portals (United Classifieds / nehnutelnosti.sk) using the RealSoft v1 XML schema
 *   - Czech CRM system (softreal.cz) using their importXml schema
 *
 * Field mapping tables are defined at the top of this file so they're easy
 * to adjust once the exact portal specifications are confirmed.
 */

import type { PropertyRecord } from './property-store';

// ============================================
// LOOKUP TABLES
// ============================================

/** Our internal country slugs → ISO 3166-1 alpha-2 codes */
const COUNTRY_TO_ISO: Record<string, string> = {
    spain: 'ES',
    croatia: 'HR',
    italy: 'IT',
    portugal: 'PT',
    greece: 'GR',
    montenegro: 'ME',
    bulgaria: 'BG',
    austria: 'AT',
    france: 'FR',
    germany: 'DE',
    czechia: 'CZ',
    slovakia: 'SK',
};

/** Our internal country slugs → Slovak display names */
const COUNTRY_TO_SK: Record<string, string> = {
    spain: 'Španielsko',
    croatia: 'Chorvátsko',
    italy: 'Taliansko',
    portugal: 'Portugalsko',
    greece: 'Grécko',
    montenegro: 'Čierna Hora',
    bulgaria: 'Bulharsko',
    austria: 'Rakúsko',
    france: 'Francúzsko',
    germany: 'Nemecko',
    czechia: 'Česká republika',
    slovakia: 'Slovensko',
};

/** Our property_type → RealSoft subtype codes (Slovak portals) */
const TYPE_TO_REALSOFT_SUBTYPE: Record<string, string> = {
    villa: 'vila',
    apartment: 'byt',
    house: 'rodinny-dom',
    land: 'pozemok',
    commercial: 'komercia',
    penthouse: 'byt',
    townhouse: 'radovy-dom',
    studio: 'byt',
};

// ============================================
// XML ESCAPE HELPER
// ============================================

function escapeXml(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function xmlBool(val: boolean | null | undefined): string {
    return val ? '1' : '0';
}

function xmlNum(val: number | null | undefined): string {
    return val != null ? String(val) : '';
}

// ============================================
// REALSOFT XML (Slovak portals — United Classifieds)
// ============================================
//
// Format: RealSoft v1 as documented at https://plt.unitedclassifieds.sk/import/docs/v1/realsoft/
// ⚠️  Field names / structure should be verified against the live documentation.
//    The transformer is intentionally easy to adjust field by field.

function propertyToRealsoftXmlItem(p: PropertyRecord): string {
    const countryKey = (p.country ?? '').toLowerCase();
    const isoCountry = COUNTRY_TO_ISO[countryKey] ?? countryKey.toUpperCase().slice(0, 2);
    const countryNameSk = COUNTRY_TO_SK[countryKey] ?? p.country;
    const subtype = TYPE_TO_REALSOFT_SUBTYPE[p.property_type] ?? p.property_type;

    const primaryImage = (p.images || [])[0];
    const primaryImageUrl = primaryImage
        ? (typeof primaryImage === 'string' ? primaryImage : primaryImage.url)
        : '';

    const imagesXml = (p.images || [])
        .map((img, i) => {
            const url = typeof img === 'string' ? img : img.url;
            return `      <image order="${i + 1}">${escapeXml(url)}</image>`;
        })
        .join('\n');

    return `  <realEstate>
    <externalId>${escapeXml(p.property_id_external || p.id)}</externalId>
    <type>zahranicna-nehnutelnost</type>
    <subtype>${escapeXml(subtype)}</subtype>
    <transaction>predaj</transaction>
    <title>${escapeXml(p.title_sk)}</title>
    <description>${escapeXml(p.description_sk || '')}</description>
    <price>${p.price_on_request ? '0' : xmlNum(p.price)}</price>
    <priceOnRequest>${xmlBool(p.price_on_request)}</priceOnRequest>
    <currency>EUR</currency>
    <area>${xmlNum(p.area)}</area>
    <rooms>${xmlNum(p.beds)}</rooms>
    <bathrooms>${xmlNum(p.baths)}</bathrooms>
    <floor>${xmlNum(p.floor_number)}</floor>
    <floors>${xmlNum(p.floors)}</floors>
    <yearBuilt>${xmlNum(p.year)}</yearBuilt>
    <parking>${xmlNum(p.parking)}</parking>
    <country>${escapeXml(isoCountry)}</country>
    <countryName>${escapeXml(countryNameSk)}</countryName>
    <city>${escapeXml(p.city)}</city>
    <location>${escapeXml(p.location_sk)}</location>
    <latitude>${xmlNum(p.latitude)}</latitude>
    <longitude>${xmlNum(p.longitude)}</longitude>
    <distanceFromSea>${xmlNum(p.distance_from_sea)}</distanceFromSea>
    <features>
      <pool>${xmlBool(p.pool)}</pool>
      <balcony>${xmlBool(p.balcony)}</balcony>
      <garden>${xmlBool(p.garden)}</garden>
      <seaView>${xmlBool(p.sea_view)}</seaView>
      <firstLine>${xmlBool(p.first_line)}</firstLine>
      <newBuild>${xmlBool(p.new_build)}</newBuild>
      <luxury>${xmlBool(p.luxury)}</luxury>
      <golf>${xmlBool(p.golf)}</golf>
      <mountains>${xmlBool(p.mountains)}</mountains>
    </features>
    <primaryImage>${escapeXml(primaryImageUrl)}</primaryImage>
    <images>
${imagesXml}
    </images>
    <detailUrl>https://relaxproperties.sk/sk/properties/${escapeXml(p.slug)}</detailUrl>
    <updatedAt>${p.updated_at}</updatedAt>
  </realEstate>`;
}

export function toRealsoftXml(properties: PropertyRecord[]): string {
    const items = properties.map(propertyToRealsoftXmlItem).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<realEstateList>
${items}
</realEstateList>`;
}

// ============================================
// SOFTREAL XML (Czech CRM — softreal.cz)
// ============================================
//
// Official API docs: SQUID.CZ s.r.o. importXml documentation (25.8.2020)
// Endpoint: POST .../publicImportApi/importXml/{key}
// Format: application/x-www-form-urlencoded, field "data"
// Schema: <foreign> root → <head>, <customer>, <attributes>, <images>
//
// Mappings ported from the original WordPress/PHP Relaxproperties_Softreal class.

/** Our country slugs → Softreal foreign_locality_country IDs (from číselníky zahraniční) */
const COUNTRY_TO_SOFTREAL_ID: Record<string, number> = {
    spain: 144, croatia: 113, italy: 129, portugal: 12,
    greece: 209, montenegro: 65, bulgaria: 146, austria: 182,
    france: 204, germany: 73, slovakia: 8,
};

/** Our property_type → Softreal reality_type integer codes */
const TYPE_TO_SOFTREAL_RT: Record<string, number> = {
    villa: 6,        // Domy a vily
    apartment: 4,    // Byty
    house: 6,        // Domy a vily
    land: 3,         // Pozemky
    commercial: 2,   // Komerční objekty
    penthouse: 4,    // Byty
    townhouse: 6,    // Domy a vily
    studio: 4,       // Byty
};

/** offer_type → Softreal relation_type (1=prodej, 2=pronájem) */
function toRelationType(offerType: string): number {
    return offerType === 'rent' ? 2 : 1;
}

/** building_type → Softreal building_type_obligate */
const BUILDING_TYPE_MAP: Record<string, number> = {
    wood: 1, brick: 2, stone: 3, assembled: 4,
    panel: 5, skeletal: 6, mixed: 7,
};

/** status → Softreal building_condition_obligate */
const BUILDING_CONDITION_MAP: Record<string, number> = {
    new_build: 6, original: 1, under_construction: 4,
    project_phase: 5, reconstructed: 9,
};

/** object_kind mapping for houses (řadový, rohový, blokový, samostatný) */
const OBJECT_KIND_MAP: Record<string, number> = {
    terraced: 1, corner: 2, block: 3, individual: 4,
};

/** object_type_obligate (přízemní, patrový) */
const OBJECT_TYPE_MAP: Record<string, number> = {
    ground_floor: 1, storey: 2,
};

/** disposition → flat_kind / house_kind codes */
const DISPOSITION_MAP: Record<string, number> = {
    studio: 1, '1kk': 2, '2kk': 3, '3kk': 4, '4kk': 5, '5kk': 6, '6kk': 7,
    '1_room': 9, '2_room': 10, '3_room': 11, '4_room': 12, '5_room_plus': 13,
    atypic: 16,
};

/** house_type → Softreal house_subtype codes */
const HOUSE_SUBTYPE_MAP: Record<string, number> = {
    family: 37, villa: 39, key: 40, wood: 41, low_energy: 42,
};

/** ownership → Softreal ownership codes */
const OWNERSHIP_MAP: Record<string, number> = {
    personal: 1, coop: 2, national: 3, equity: 4,
};

/** price unit for sell (za nemovitost, za m²) */
const PRICE_UNIT_SELL_MAP: Record<string, number> = {
    property: 1, meter: 3,
};

/** price unit for rent */
const PRICE_UNIT_RENT_MAP: Record<string, number> = {
    month: 2, meter_month: 4, meter_year: 5, year: 6, day: 7,
};

/** Map a value through a lookup, returning null if not found */
function mapValue(value: string | null | undefined, map: Record<string, number>): number | null {
    if (!value) return null;
    return map[value] ?? null;
}

function propertyToSoftrealXmlItem(p: PropertyRecord): string {
    const countryId = COUNTRY_TO_SOFTREAL_ID[(p.country ?? '').toLowerCase()] ?? 0;
    const realityType = TYPE_TO_SOFTREAL_RT[p.property_type] ?? 4;
    const relationType = toRelationType(p.offer_type);
    const price = p.price_on_request ? '0' : String(p.price || 0);
    const isHouse = realityType === 6;
    const isFlat = realityType === 4;

    // --- <head> ---
    const headParts = [
        `    <reality_type>${realityType}</reality_type>`,
        `    <relation_type>${relationType}</relation_type>`,
        `    <external_id>${escapeXml(p.property_id_external || p.id)}</external_id>`,
        `    <last_modified>${escapeXml(p.updated_at)}</last_modified>`,
        `    <status>0</status>`,
    ];
    // Spain properties get user_id 3 (per old PHP code)
    if (countryId === 144) {
        headParts.push(`    <user_id>3</user_id>`);
    }

    // --- <attributes> ---
    const attrs: [string, string | number][] = [
        ['title', p.title_cz || p.title_sk],
        ['description', p.description_cz || p.description_sk || ''],
        ['advert_price', price],
        ['advert_price_currency', 3],                         // EUR
        ['advert_price_owner', price],
        ['foreign_locality_country', countryId],
        ['foreign_locality_city', p.city || ''],
    ];

    // Price unit depends on sale vs rent
    if (relationType === 1) {
        const unitSell = mapValue(p.unit, PRICE_UNIT_SELL_MAP) ?? 1; // default: per property
        attrs.push(['advert_price_unit_sell', unitSell]);
    } else {
        const unitRent = mapValue(p.unit, PRICE_UNIT_RENT_MAP);
        if (unitRent) attrs.push(['advert_price_unit', unitRent]);
    }

    // GPS
    if (p.latitude) attrs.push(['foreign_locality_lat', p.latitude]);
    if (p.longitude) attrs.push(['foreign_locality_lng', p.longitude]);

    // Common area fields
    if (p.area) attrs.push(['usable_area_obligate', p.area]);
    if (p.floors) attrs.push(['floors_obligate', p.floors]);

    // Building condition & type
    const condition = mapValue(p.status, BUILDING_CONDITION_MAP);
    if (condition) attrs.push(['building_condition_obligate', condition]);

    const buildType = mapValue(p.building_type, BUILDING_TYPE_MAP);
    if (buildType) attrs.push(['building_type_obligate', buildType]);

    const objectType = mapValue(p.house_type, OBJECT_TYPE_MAP);
    if (objectType) attrs.push(['object_type_obligate', objectType]);

    // --- Type-specific attributes (houses vs flats) ---
    if (isHouse) {
        if (p.area) attrs.push(['building_area_obligate', p.area]);
        if (p.land_area) attrs.push(['plot_area_obligate', p.land_area]);
        // total_area = usable + land (if both available)
        if (p.area && p.land_area) attrs.push(['total_area', p.area + p.land_area]);

        const houseKind = mapValue(p.disposition, DISPOSITION_MAP);
        if (houseKind) attrs.push(['house_kind', houseKind]);

        const houseSubtype = mapValue(p.house_type, HOUSE_SUBTYPE_MAP);
        if (houseSubtype) attrs.push(['house_subtype', houseSubtype]);

        const objectKind = mapValue(p.house_type, OBJECT_KIND_MAP);
        if (objectKind) attrs.push(['object_kind', objectKind]);
    }

    if (isFlat) {
        const flatKind = mapValue(p.disposition, DISPOSITION_MAP);
        if (flatKind) attrs.push(['flat_kind', flatKind]);

        if (p.land_area) attrs.push(['floor_area_obligate', p.land_area]);
        if (p.floor_number != null) attrs.push(['floor_number_obligate', p.floor_number]);

        const ownership = mapValue(p.ownership, OWNERSHIP_MAP);
        if (ownership) attrs.push(['ownership', ownership]);
    }

    // Boolean feature attributes (1 = yes, -1 = no — per Softreal convention)
    attrs.push(['balcony', p.balcony ? 1 : -1]);
    attrs.push(['loggia', p.lodzia ? 1 : -1]);
    attrs.push(['terrace', p.terasa ? 1 : -1]);
    attrs.push(['cellar', p.cellar ? 1 : -1]);
    attrs.push(['garage', p.garage ? 1 : -1]);
    attrs.push(['parking_lots', p.parking_spot ? 1 : -1]);

    // Available from date
    if (p.available_from) {
        const d = new Date(p.available_from);
        if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            attrs.push(['ready_date', `${dd}. ${mm}. ${yyyy}`]);
        }
    }

    // EN translations
    if (p.title_en) attrs.push(['title_en', p.title_en]);
    if (p.description_en) attrs.push(['description_en', p.description_en]);

    const attrsXml = attrs
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([n, v]) => `    <attribute>\n      <name>${escapeXml(String(n))}</name>\n      <value>${escapeXml(String(v))}</value>\n    </attribute>`)
        .join('\n');

    const imgsXml = (p.images || [])
        .map(img => `    <image_url>${escapeXml(typeof img === 'string' ? img : img.url)}</image_url>`)
        .join('\n');

    return `  <head>
${headParts.join('\n')}
  </head>
  <customer>
    <firstname>Relax</firstname>
    <surname>Properties</surname>
  </customer>
  <attributes>
${attrsXml}
  </attributes>
  <images addWatermark="0" keepOldImages="0">
${imgsXml}
  </images>`;
}

/**
 * Bulk export: Softreal API accepts ONE <foreign> per request,
 * so for bulk sync we return an array of individual XML documents
 * that should each be sent as a separate POST request.
 */
export function toSoftrealXmlBatch(properties: PropertyRecord[]): string[] {
    return properties.map(p => {
        const item = propertyToSoftrealXmlItem(p);
        return `<?xml version="1.0" encoding="UTF-8"?>\n<foreign>\n${item}\n</foreign>`;
    });
}

/** @deprecated Use toSoftrealXmlBatch for bulk sync — this only sends one property */
export function toSoftrealXml(properties: PropertyRecord[]): string {
    if (properties.length === 0) return '';
    const item = propertyToSoftrealXmlItem(properties[0]);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<foreign>\n${item}\n</foreign>`;
}

export function toSoftrealSingleXml(property: PropertyRecord): string {
    const item = propertyToSoftrealXmlItem(property);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<foreign>\n${item}\n</foreign>`;
}

// ============================================
// SOFTREAL RESPONSE PARSER
// ============================================
//
// Softreal responds with XML like:
//   <response>
//     <result>
//       <code>200</code>
//       <id>12345</id>
//       <message>Property imported successfully</message>
//     </result>
//     <error>                          ← optional, only on failure
//       <code>101</code>
//       <message>Missing required field: title</message>
//     </error>
//   </response>
//
// Success: result.code is 200 or 201
// The old PHP code: if(!in_array($result->result->code, [200, 201])) → error

export interface SoftrealResponse {
    /** Whether the import was accepted (result code 200 or 201) */
    success: boolean;
    /** Softreal's internal ID for the imported property (on success) */
    softrealId: number | null;
    /** Result code from <result><code> */
    resultCode: number | null;
    /** Result message from <result><message> */
    resultMessage: string | null;
    /** Error code from <error><code> (if present) */
    errorCode: number | null;
    /** Error message from <error><message> (if present) */
    errorMessage: string | null;
    /** Raw response text for debugging */
    raw: string;
}

/** Extract text content of an XML tag. Returns null if tag not found. */
function extractXmlTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1].trim() : null;
}

/**
 * Parse Softreal's XML import response.
 * Matches the validation logic from the original PHP code:
 *   - Success if <result><code> is 200 or 201
 *   - Extracts <result><id> as the Softreal property ID
 *   - Extracts <error><message> and <error><code> on failure
 */
export function parseSoftrealResponse(responseText: string): SoftrealResponse {
    // Extract the <result>...</result> block
    const resultBlock = responseText.match(/<result>([\s\S]*?)<\/result>/)?.[1] || '';
    const resultCodeStr = extractXmlTag(resultBlock, 'code');
    const resultCode = resultCodeStr ? parseInt(resultCodeStr, 10) : null;
    const resultId = extractXmlTag(resultBlock, 'id');
    const resultMessage = extractXmlTag(resultBlock, 'message');

    // Extract the <error>...</error> block (optional — only present on failure)
    const errorBlock = responseText.match(/<error>([\s\S]*?)<\/error>/)?.[1] || '';
    const errorCodeStr = extractXmlTag(errorBlock, 'code');
    const errorCode = errorCodeStr ? parseInt(errorCodeStr, 10) : null;
    const errorMessage = extractXmlTag(errorBlock, 'message');

    const success = resultCode === 200 || resultCode === 201;

    return {
        success,
        softrealId: success && resultId ? parseInt(resultId, 10) : null,
        resultCode,
        resultMessage: resultMessage || null,
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        raw: responseText,
    };
}

export function toSoftrealDeleteXml(externalId: string, realityType?: number, relationType?: number): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<foreign>
  <head>
    <reality_type>${realityType ?? 4}</reality_type>
    <relation_type>${relationType ?? 1}</relation_type>
    <external_id>${escapeXml(externalId)}</external_id>
    <status>2</status>
  </head>
  <customer>
    <firstname>Relax</firstname>
    <surname>Properties</surname>
  </customer>
</foreign>`;
}
