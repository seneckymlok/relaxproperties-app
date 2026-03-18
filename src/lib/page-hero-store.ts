/**
 * Page Hero Store — CRUD for per-page hero background images
 * Each page (contact, about, blog, properties, buying-process, favorites) can have its own hero image.
 */

import { getAdminClient } from './supabase';

export interface PageHeroRecord {
    id: string;
    page_key: string;
    image_url: string;
    created_at: string;
    updated_at: string;
}

/** Valid page keys that support hero images */
export const PAGE_KEYS = [
    'contact',
    'about',
    'blog',
    'properties',
    'buying-process',
    'favorites',
] as const;

export type PageKey = typeof PAGE_KEYS[number];

export const PAGE_LABELS: Record<PageKey, string> = {
    'contact': 'Kontakt',
    'about': 'O nás',
    'blog': 'Blog',
    'properties': 'Nehnuteľnosti',
    'buying-process': 'Proces kúpy',
    'favorites': 'Obľúbené',
};

/** Get all page hero images */
export async function getAllPageHeroes(): Promise<PageHeroRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('page_hero_images')
        .select('*')
        .order('page_key');

    if (error) throw new Error(`Failed to fetch page heroes: ${error.message}`);
    return (data || []) as PageHeroRecord[];
}

/** Get hero image for a specific page */
export async function getPageHero(pageKey: string): Promise<PageHeroRecord | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('page_hero_images')
        .select('*')
        .eq('page_key', pageKey)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch page hero: ${error.message}`);
    return data as PageHeroRecord | null;
}

/** Upsert (create or update) a page hero image */
export async function upsertPageHero(pageKey: string, imageUrl: string): Promise<PageHeroRecord> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('page_hero_images')
        .upsert(
            { page_key: pageKey, image_url: imageUrl },
            { onConflict: 'page_key' }
        )
        .select()
        .single();

    if (error) throw new Error(`Failed to upsert page hero: ${error.message}`);
    return data as PageHeroRecord;
}

/** Delete a page hero image (reverts to default) */
export async function deletePageHero(pageKey: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
        .from('page_hero_images')
        .delete()
        .eq('page_key', pageKey);

    if (error) throw new Error(`Failed to delete page hero: ${error.message}`);
}
