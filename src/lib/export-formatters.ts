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
    const isoCountry = COUNTRY_TO_ISO[p.country] ?? p.country.toUpperCase().slice(0, 2);
    const countryNameSk = COUNTRY_TO_SK[p.country] ?? p.country;
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
// Schema: <foreign> root → <head>, <address>, <customer>, <attributes>, <images>

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

function propertyToSoftrealXmlItem(p: PropertyRecord): string {
    const countryId = COUNTRY_TO_SOFTREAL_ID[p.country] ?? 0;
    const realityType = TYPE_TO_SOFTREAL_RT[p.property_type] ?? 4;

    // Build attributes as name/value pairs (per Softreal API docs)
    const attrs: [string, string][] = [
        ['title', p.title_cz || p.title_sk],
        ['description', p.description_cz || p.description_sk || ''],
        ['advert_price', p.price_on_request ? '0' : String(p.price || 0)],
        ['foreign_locality_country', String(countryId)],
        ['foreign_locality_city', p.city || ''],
    ];
    if (p.area) attrs.push(['usable_area', String(p.area)]);
    if (p.floors) attrs.push(['floors', String(p.floors)]);
    if (p.year) attrs.push(['year_built', String(p.year)]);

    const attrsXml = attrs
        .filter(([, v]) => v)
        .map(([n, v]) => `    <attribute>\n      <name>${escapeXml(n)}</name>\n      <value>${escapeXml(v)}</value>\n    </attribute>`)
        .join('\n');

    const imgsXml = (p.images || [])
        .map(img => `    <image_url>${escapeXml(typeof img === 'string' ? img : img.url)}</image_url>`)
        .join('\n');

    return `  <head>
    <reality_type>${realityType}</reality_type>
    <relation_type>1</relation_type>
    <external_id>${escapeXml(p.property_id_external || p.id)}</external_id>
  </head>
  <address>
    <gps_lat>${xmlNum(p.latitude)}</gps_lat>
    <gps_lng>${xmlNum(p.longitude)}</gps_lng>
  </address>
  <customer>
    <firstname>Relax</firstname>
    <surname>Properties</surname>
    <email>info@relaxproperties.sk</email>
  </customer>
  <attributes>
${attrsXml}
  </attributes>
  <images addWatermark="0" keepOldImages="0">
${imgsXml}
  </images>`;
}

export function toSoftrealXml(properties: PropertyRecord[]): string {
    if (properties.length === 0) return '';
    const item = propertyToSoftrealXmlItem(properties[0]);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<foreign>\n${item}\n</foreign>`;
}

export function toSoftrealSingleXml(property: PropertyRecord): string {
    const item = propertyToSoftrealXmlItem(property);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<foreign>\n${item}\n</foreign>`;
}

export function toSoftrealDeleteXml(externalId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<foreign>
  <head>
    <reality_type>4</reality_type>
    <relation_type>1</relation_type>
    <external_id>${escapeXml(externalId)}</external_id>
    <status>2</status>
  </head>
</foreign>`;
}
