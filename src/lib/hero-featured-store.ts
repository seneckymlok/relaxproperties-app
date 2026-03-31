/**
 * Hero Featured Store — CRUD for admin-selected homepage hero properties
 * Stores which properties appear in the homepage hero slider and in what order.
 */

import { getAdminClient } from './supabase';
import { unstable_cache } from 'next/cache';

/** Get ordered list of featured property IDs */
export async function getHeroFeaturedPropertyIds(): Promise<string[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('hero_featured_properties')
        .select('property_id')
        .order('display_order');

    if (error) throw new Error(`Failed to fetch hero featured properties: ${error.message}`);
    return (data || []).map((row: { property_id: string }) => row.property_id);
}

/** Cached version — revalidates every 60s */
export const getCachedHeroFeaturedPropertyIds = unstable_cache(
    getHeroFeaturedPropertyIds,
    ['hero-featured-ids'],
    { revalidate: 60 }
);

/** Replace all featured properties atomically (delete all, insert new) */
export async function setHeroFeaturedProperties(propertyIds: string[]): Promise<void> {
    const supabase = getAdminClient();

    // Delete all existing
    const { error: deleteError } = await supabase
        .from('hero_featured_properties')
        .delete()
        .gte('display_order', 0); // matches all rows

    if (deleteError) throw new Error(`Failed to clear hero featured: ${deleteError.message}`);

    // Insert new if any
    if (propertyIds.length > 0) {
        const rows = propertyIds.map((id, index) => ({
            property_id: id,
            display_order: index,
        }));

        const { error: insertError } = await supabase
            .from('hero_featured_properties')
            .insert(rows);

        if (insertError) throw new Error(`Failed to set hero featured: ${insertError.message}`);
    }
}
