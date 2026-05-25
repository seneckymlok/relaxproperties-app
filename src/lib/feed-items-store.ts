/**
 * Feed Items Store — browse + select parsed listings from a feed
 * before they get materialized into the `properties` table.
 */
import { getAdminClient } from './supabase';

export interface FeedItem {
    id: string;
    feed_source_id: string;
    external_uid: string;
    raw_data: Record<string, unknown>;
    title: string | null;
    estate_type: string | null;
    offer_type: string | null;
    price: number | null;
    currency: string | null;
    region: string | null;
    subregion: string | null;
    town: string | null;
    beds: number | null;
    baths: number | null;
    area: number | null;
    land_area: number | null;
    image_url: string | null;
    image_count: number;
    selected: boolean;
    selected_property_id: string | null;
    selected_at: string | null;
    first_seen_at: string;
    last_seen_at: string;
    removed_from_feed: boolean;
    created_at: string;
    updated_at: string;
}

export interface FeedItemListParams {
    feedSourceId: string;
    search?: string;          // matches external_uid / title (case-insensitive)
    estateTypes?: string[];
    regions?: string[];
    towns?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
    selected?: boolean | null;     // null = both
    includeRemoved?: boolean;      // default false
    page?: number;                 // 1-indexed
    pageSize?: number;             // default 50
    sort?: 'recent' | 'price_asc' | 'price_desc' | 'uid';
}

export interface FeedItemListResult {
    items: FeedItem[];
    total: number;
    page: number;
    pageSize: number;
    facets: {
        estateTypes: { value: string; count: number }[];
        regions: { value: string; count: number }[];
        towns: { value: string; count: number }[];
        totalAll: number;
        totalSelected: number;
        totalUnselected: number;
    };
}

export async function listFeedItems(p: FeedItemListParams): Promise<FeedItemListResult> {
    const supabase = getAdminClient();
    const page = Math.max(1, p.page || 1);
    const pageSize = Math.min(200, Math.max(1, p.pageSize || 50));

    let q = supabase
        .from('feed_items')
        .select('*', { count: 'exact' })
        .eq('feed_source_id', p.feedSourceId);

    if (!p.includeRemoved) q = q.eq('removed_from_feed', false);
    if (p.selected === true) q = q.eq('selected', true);
    else if (p.selected === false) q = q.eq('selected', false);

    if (p.estateTypes?.length) q = q.in('estate_type', p.estateTypes);
    if (p.regions?.length) q = q.in('region', p.regions);
    if (p.towns?.length) q = q.in('town', p.towns);
    if (p.priceMin != null) q = q.gte('price', p.priceMin);
    if (p.priceMax != null) q = q.lte('price', p.priceMax);

    if (p.search && p.search.trim()) {
        const s = p.search.trim().replace(/[%_]/g, '');
        q = q.or(`external_uid.ilike.%${s}%,title.ilike.%${s}%,town.ilike.%${s}%`);
    }

    switch (p.sort) {
        case 'price_asc':  q = q.order('price', { ascending: true, nullsFirst: false }); break;
        case 'price_desc': q = q.order('price', { ascending: false, nullsFirst: false }); break;
        case 'uid':        q = q.order('external_uid', { ascending: true }); break;
        case 'recent':
        default:           q = q.order('last_seen_at', { ascending: false }); break;
    }

    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);

    const { data, error, count } = await q;
    if (error) throw new Error(`Failed to list feed items: ${error.message}`);

    // Facets — separate aggregate queries (cheap because indexed)
    const facets = await loadFacets(p.feedSourceId, p.includeRemoved);

    return {
        items: (data || []) as FeedItem[],
        total: count || 0,
        page,
        pageSize,
        facets,
    };
}

async function loadFacets(feedSourceId: string, includeRemoved?: boolean) {
    const supabase = getAdminClient();

    const facet = async (column: 'estate_type' | 'region' | 'town') => {
        const { data } = await supabase.rpc('feed_items_facet', {
            p_feed_source_id: feedSourceId,
            p_column: column,
            p_include_removed: !!includeRemoved,
        });
        return (data as { value: string; count: number }[] | null) || [];
    };

    const countQuery = (selected?: boolean) => {
        let q = supabase
            .from('feed_items')
            .select('id', { count: 'exact', head: true })
            .eq('feed_source_id', feedSourceId);
        if (!includeRemoved) q = q.eq('removed_from_feed', false);
        if (selected != null) q = q.eq('selected', selected);
        return q;
    };

    const [estateTypes, regions, towns, totalAllRes, totalSelectedRes] = await Promise.all([
        facet('estate_type'),
        facet('region'),
        facet('town'),
        countQuery(),
        countQuery(true),
    ]);

    const totalAll = totalAllRes.count || 0;
    const totalSelected = totalSelectedRes.count || 0;

    return {
        estateTypes,
        regions,
        towns,
        totalAll,
        totalSelected,
        totalUnselected: totalAll - totalSelected,
    };
}

export async function getFeedItemById(id: string): Promise<FeedItem | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('feed_items').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch feed item: ${error.message}`);
    }
    return data as FeedItem;
}

export async function countSelectedForFeed(feedSourceId: string): Promise<number> {
    const supabase = getAdminClient();
    const { count } = await supabase
        .from('feed_items')
        .select('id', { count: 'exact', head: true })
        .eq('feed_source_id', feedSourceId)
        .eq('selected', true);
    return count || 0;
}
