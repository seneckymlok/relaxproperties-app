import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllProperties, updateProperty } from '@/lib/property-store';
import type { PropertyRecord } from '@/lib/property-store';

async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'authenticated';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, max - 1).trimEnd() + '…';
}

function stripHtml(str: string | null | undefined): string {
    return (str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const TYPE_LABELS: Record<string, { sk: string; en: string; cz: string }> = {
    apartment:             { sk: 'Apartmán',            en: 'Apartment',       cz: 'Apartmán' },
    studio_apartment_flat: { sk: 'Štúdio',              en: 'Studio',          cz: 'Studio' },
    villa:                 { sk: 'Vila',                 en: 'Villa',           cz: 'Vila' },
    family_house_villa:    { sk: 'Rodinný dom',         en: 'Family house',    cz: 'Rodinný dům' },
    house:                 { sk: 'Dom',                  en: 'House',           cz: 'Dům' },
    land:                  { sk: 'Pozemok',              en: 'Land plot',       cz: 'Pozemek' },
    luxury_property:       { sk: 'Luxusná nehnuteľnosť', en: 'Luxury property', cz: 'Luxusní nemovitost' },
    commercial:            { sk: 'Komerčná nehnuteľnosť', en: 'Commercial property', cz: 'Komerční nemovitost' },
};

const COUNTRY_LABELS: Record<string, { sk: string; en: string; cz: string }> = {
    bulgaria:    { sk: 'Bulharsko',   en: 'Bulgaria',    cz: 'Bulharsko' },
    croatia:     { sk: 'Chorvátsko',  en: 'Croatia',     cz: 'Chorvatsko' },
    spain:       { sk: 'Španielsko',  en: 'Spain',       cz: 'Španělsko' },
    greece:      { sk: 'Grécko',      en: 'Greece',      cz: 'Řecko' },
    montenegro:  { sk: 'Čierna Hora', en: 'Montenegro',  cz: 'Černá Hora' },
    italy:       { sk: 'Taliansko',   en: 'Italy',       cz: 'Itálie' },
    slovakia:    { sk: 'Slovensko',   en: 'Slovakia',    cz: 'Slovensko' },
};

function priceStr(p: PropertyRecord, lang: 'sk' | 'en' | 'cz'): string {
    if (p.price_on_request) {
        return lang === 'en' ? 'price on request' : lang === 'cz' ? 'cena na vyžádání' : 'cena na vyžiadanie';
    }
    return `€ ${p.price.toLocaleString('en-US')}`;
}

function topFeatures(p: PropertyRecord, lang: 'sk' | 'en' | 'cz'): string {
    const feat: string[] = [];
    if (p.first_line) feat.push(lang === 'en' ? 'beachfront' : lang === 'cz' ? 'první linie' : 'prvá línia');
    else if (p.sea_view) feat.push(lang === 'en' ? 'sea view' : lang === 'cz' ? 'výhled na moře' : 'výhľad na more');
    if (p.pool) feat.push(lang === 'en' ? 'pool' : 'bazén');
    if (p.luxury) feat.push(lang === 'en' ? 'luxury' : lang === 'cz' ? 'luxusní' : 'luxusné');
    if (p.new_build) feat.push(lang === 'en' ? 'new build' : 'novostavba');
    if (p.garden) feat.push(lang === 'en' ? 'garden' : lang === 'cz' ? 'zahrada' : 'záhrada');
    if (p.terasa) feat.push(lang === 'en' ? 'terrace' : 'terasa');
    return feat.slice(0, 3).join(', ');
}

function generatePropertySEO(p: PropertyRecord) {
    const country = p.country.toLowerCase();
    const countryLbl = COUNTRY_LABELS[country] ?? { sk: p.country, en: p.country, cz: p.country };
    const typeLbl = TYPE_LABELS[p.property_type] ?? { sk: 'Nehnuteľnosť', en: 'Property', cz: 'Nemovitost' };

    const titleBaseSK = p.title_sk;
    const titleBaseEN = p.title_en || p.title_sk;
    const titleBaseCZ = p.title_cz || p.title_sk;

    const meta_title_sk = truncate(`${titleBaseSK} | Relax Properties`, 60);
    const meta_title_en = truncate(`${titleBaseEN} | Relax Properties`, 60);
    const meta_title_cz = truncate(`${titleBaseCZ} | Relax Properties`, 60);

    // Description: type + area + location + features + price + CTA (max 155 chars)
    const buildDesc = (lang: 'sk' | 'en' | 'cz') => {
        const loc = lang === 'en' ? (p.location_en || p.location_sk) : lang === 'cz' ? (p.location_cz || p.location_sk) : p.location_sk;
        const type = typeLbl[lang];
        const country = countryLbl[lang];
        const feat = topFeatures(p, lang);
        const price = priceStr(p, lang);

        let desc = '';
        if (lang === 'sk') {
            desc = `${type}, ${p.area} m² – ${loc}, ${country}. ${p.beds} spálne, ${p.baths} kúpeľne${feat ? `, ${feat}` : ''}. ${price}.`;
            if (desc.length < 130) desc += ' Pozrite si ponuku!';
        } else if (lang === 'en') {
            desc = `${type}, ${p.area} m² – ${loc}, ${country}. ${p.beds} bed, ${p.baths} bath${feat ? `, ${feat}` : ''}. ${price}.`;
            if (desc.length < 130) desc += ' View listing!';
        } else {
            desc = `${type}, ${p.area} m² – ${loc}, ${country}. ${p.beds} ložnice, ${p.baths} koupelny${feat ? `, ${feat}` : ''}. ${price}.`;
            if (desc.length < 130) desc += ' Prohlédněte nabídku!';
        }
        return truncate(desc, 155);
    };

    return {
        meta_title_sk,
        meta_title_en,
        meta_title_cz,
        meta_description_sk: buildDesc('sk'),
        meta_description_en: buildDesc('en'),
        meta_description_cz: buildDesc('cz'),
    };
}

function generateBlogSEO(post: {
    id: string;
    title_sk: string;
    title_en: string | null;
    title_cz: string | null;
    excerpt_sk: string | null;
    excerpt_en: string | null;
    excerpt_cz: string | null;
    meta_title_sk: string | null;
    meta_title_en: string | null;
    meta_title_cz: string | null;
    meta_description_sk: string | null;
    meta_description_en: string | null;
    meta_description_cz: string | null;
}) {
    const buildTitle = (title: string) => truncate(`${title} | Relax Properties`, 60);
    const buildDesc = (excerpt: string | null, fallback: string | null) =>
        truncate(stripHtml(excerpt || fallback || ''), 155);

    return {
        meta_title_sk: buildTitle(post.title_sk),
        meta_title_en: buildTitle(post.title_en || post.title_sk),
        meta_title_cz: buildTitle(post.title_cz || post.title_sk),
        meta_description_sk: buildDesc(post.excerpt_sk, post.excerpt_sk),
        meta_description_en: buildDesc(post.excerpt_en, post.excerpt_sk),
        meta_description_cz: buildDesc(post.excerpt_cz, post.excerpt_sk),
    };
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/generate-seo-bulk
 * Body: { force?: boolean, type?: 'all' | 'properties' | 'blogs' }
 *
 * force=false (default) → only fill records where meta_title_sk is null/empty
 * force=true            → overwrite everything
 */
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as { force?: boolean; type?: string };
    const force = body.force ?? false;
    const type  = body.type ?? 'all';

    const results = {
        properties: { updated: 0, skipped: 0, errors: [] as string[] },
        blogs:      { updated: 0, skipped: 0, errors: [] as string[] },
    };

    // ── Properties ────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'properties') {
        const properties = await getAllProperties();
        const toProcess = properties.filter(p => p.publish_status !== 'trashed');

        for (const p of toProcess) {
            if (!force && p.meta_title_sk) {
                results.properties.skipped++;
                continue;
            }
            try {
                const seo = generatePropertySEO(p);
                await updateProperty(p.id, seo as Parameters<typeof updateProperty>[1]);
                results.properties.updated++;
            } catch (err) {
                results.properties.errors.push(`${p.id}: ${err instanceof Error ? err.message : 'unknown'}`);
            }
        }
    }

    // ── Blog posts ────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'blogs') {
        const { getPublishedBlogPosts, updateBlogPost } = await import('@/lib/blog-store');
        const posts = await getPublishedBlogPosts();

        for (const post of posts) {
            if (!force && post.meta_title_sk) {
                results.blogs.skipped++;
                continue;
            }
            try {
                const seo = generateBlogSEO(post);
                await updateBlogPost(post.id, seo);
                results.blogs.updated++;
            } catch (err) {
                results.blogs.errors.push(`${post.id}: ${err instanceof Error ? err.message : 'unknown'}`);
            }
        }
    }

    return NextResponse.json({
        ok: true,
        results,
        summary: `Updated ${results.properties.updated} properties, ${results.blogs.updated} blog posts. Skipped ${results.properties.skipped + results.blogs.skipped} (already had SEO).`,
    });
}
