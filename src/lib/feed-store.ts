/**
 * Feed Store — CRUD for feed_sources table
 */
import { getAdminClient } from './supabase';

export interface FeedFilterConfig {
    estate_types?: string[];   // e.g. ["Flat","Villa","Maisonette","Detached house"]
    price_min?: number | null;
    price_max?: number | null;
    regions?: string[];         // Grekodom Region values
    offer_types?: string[];     // ["For Sale","For Rent"]
}

export interface FeedSource {
    id: string;
    name: string;
    url: string;
    format: string;             // 'grekodom_xml'
    enabled: boolean;
    filter_config: FeedFilterConfig;
    schedule_cron: string | null;
    last_synced_at: string | null;
    last_status: string | null; // 'ok' | 'error' | 'running'
    last_error: string | null;
    last_stats: { added: number; updated: number; skipped: number; errors: number } | null;
    created_at: string;
    updated_at: string;
}

export async function getAllFeedSources(): Promise<FeedSource[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('feed_sources')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw new Error(`Failed to fetch feed sources: ${error.message}`);
    return (data || []) as FeedSource[];
}

export async function getFeedSourceById(id: string): Promise<FeedSource | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('feed_sources')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch feed source: ${error.message}`);
    }
    return data as FeedSource;
}

export async function createFeedSource(input: {
    name: string;
    url: string;
    format?: string;
    filter_config?: FeedFilterConfig;
    schedule_cron?: string | null;
    enabled?: boolean;
}): Promise<FeedSource> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('feed_sources')
        .insert({
            name: input.name,
            url: input.url,
            format: input.format || 'grekodom_xml',
            filter_config: input.filter_config || {},
            schedule_cron: input.schedule_cron || null,
            enabled: input.enabled ?? true,
        })
        .select()
        .single();
    if (error) throw new Error(`Failed to create feed source: ${error.message}`);
    return data as FeedSource;
}

export async function updateFeedSource(id: string, input: Partial<{
    name: string;
    url: string;
    format: string;
    filter_config: FeedFilterConfig;
    schedule_cron: string | null;
    enabled: boolean;
}>): Promise<FeedSource> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('feed_sources')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(`Failed to update feed source: ${error.message}`);
    return data as FeedSource;
}

export async function deleteFeedSource(id: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase.from('feed_sources').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete feed source: ${error.message}`);
}

/**
 * Delete all properties imported from a given feed.
 *
 * mode 'trash'     — sets publish_status = 'trashed' (recoverable for 30 days)
 * mode 'permanent' — hard-deletes from the DB immediately
 *
 * Returns the count of affected properties.
 */
export async function deletePropertiesByFeedSource(
    feedId: string,
    mode: 'trash' | 'permanent'
): Promise<number> {
    const supabase = getAdminClient();

    if (mode === 'trash') {
        const { data, error } = await supabase
            .from('properties')
            .update({ publish_status: 'trashed', updated_at: new Date().toISOString() })
            .eq('feed_source_id', feedId)
            .neq('publish_status', 'trashed') // skip already-trashed
            .select('id');
        if (error) throw new Error(`Failed to trash properties: ${error.message}`);
        return (data || []).length;
    } else {
        const { data, error } = await supabase
            .from('properties')
            .delete()
            .eq('feed_source_id', feedId)
            .select('id');
        if (error) throw new Error(`Failed to delete properties: ${error.message}`);
        return (data || []).length;
    }
}

export async function updateFeedStatus(
    id: string,
    status: 'ok' | 'error' | 'running',
    stats?: { added: number; updated: number; skipped: number; errors: number },
    errorMsg?: string
): Promise<void> {
    const supabase = getAdminClient();
    await supabase
        .from('feed_sources')
        .update({
            last_status: status,
            last_synced_at: status !== 'running' ? new Date().toISOString() : undefined,
            last_stats: stats || null,
            last_error: errorMsg || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);
}
