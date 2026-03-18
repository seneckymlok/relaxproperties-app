/**
 * Hero Store — CRUD operations for the hero_images table
 * Uses Supabase admin client (service role) for server-side operations
 */

import { getAdminClient } from './supabase';

export interface HeroImageRecord {
    id: string;
    property_id: string | null;
    image_url: string;
    title_sk: string | null;
    title_en: string | null;
    title_cz: string | null;
    subtitle_sk: string | null;
    subtitle_en: string | null;
    subtitle_cz: string | null;
    cta_link: string | null;
    display_order: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export type HeroImageInput = Omit<HeroImageRecord, 'id' | 'created_at' | 'updated_at'>;

/** Get all hero images (admin view) */
export async function getAllHeroImages(): Promise<HeroImageRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch hero images: ${error.message}`);
    return (data || []) as HeroImageRecord[];
}

/** Get active hero images (public site) */
export async function getActiveHeroImages(): Promise<HeroImageRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch active hero images: ${error.message}`);
    return (data || []) as HeroImageRecord[];
}

/** Create a new hero image */
export async function createHeroImage(input: Partial<HeroImageInput>): Promise<HeroImageRecord> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('hero_images')
        .insert(input)
        .select()
        .single();

    if (error) throw new Error(`Failed to create hero image: ${error.message}`);
    return data as HeroImageRecord;
}

/** Update a hero image */
export async function updateHeroImage(id: string, input: Partial<HeroImageInput>): Promise<HeroImageRecord> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('hero_images')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update hero image: ${error.message}`);
    return data as HeroImageRecord;
}

/** Delete a hero image */
export async function deleteHeroImage(id: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete hero image: ${error.message}`);
}

/** Reorder hero images */
export async function reorderHeroImages(orderedIds: string[]): Promise<void> {
    const supabase = getAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
            .from('hero_images')
            .update({ display_order: i })
            .eq('id', orderedIds[i]);
        if (error) throw new Error(`Failed to reorder hero images: ${error.message}`);
    }
}
