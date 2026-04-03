/**
 * Property Store — CRUD operations for the properties table
 * Uses Supabase admin client (service role) for server-side operations
 */

import { getAdminClient } from './supabase';
import { unstable_cache } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PropertyImage {
    url: string;
    alt: string;
    order: number;
}

export interface PropertyRecord {
    id: string;
    slug: string;
    property_id_external: string | null;

    // Translatable text
    title_sk: string;
    title_en: string | null;
    title_cz: string | null;
    description_sk: string | null;
    description_en: string | null;
    description_cz: string | null;
    location_sk: string;
    location_en: string | null;
    location_cz: string | null;
    location_description_sk: string | null;
    location_description_en: string | null;
    location_description_cz: string | null;

    // Location
    country: string;
    city: string;
    location_type: string | null;
    distance_from_sea: number | null;
    latitude: number | null;
    longitude: number | null;
    map_zoom: number | null;

    // Specs
    property_type: string;
    status: string | null;
    ownership: string | null;
    disposition: string | null;
    beds: number;
    baths: number;
    area: number;
    floors: number | null;
    floor_number: number | null;
    year: number | null;
    parking: number;
    available_from: string | null;
    house_type: string | null;
    building_type: string | null;

    // Price
    price: number;
    price_on_request: boolean;
    offer_type: string;
    unit: string;

    // Features
    pool: boolean;
    balcony: boolean;
    garden: boolean;
    sea_view: boolean;
    first_line: boolean;
    new_build: boolean;
    new_project: boolean;
    luxury: boolean;
    golf: boolean;
    mountains: boolean;

    // Additional amenities
    lodzia: boolean;
    terasa: boolean;
    cellar: boolean;
    garage: boolean;
    parking_spot: boolean;
    fireplace: boolean;
    near_airport: boolean;
    billiard_room: boolean;
    near_beach: boolean;
    near_golf: boolean;
    yoga_room: boolean;
    grand_garden: boolean;

    // Area info
    land_area: number | null;

    // Media
    images: PropertyImage[];
    hero_image_index: number;
    video_url: string | null;
    pdf_images: number[];

    // SEO
    meta_title_sk: string | null;
    meta_title_en: string | null;
    meta_title_cz: string | null;
    meta_description_sk: string | null;
    meta_description_en: string | null;
    meta_description_cz: string | null;

    // Tags
    tags: string[];

    // Preview tags (which features show on cards)
    preview_tags: string[];

    // Publishing
    featured: boolean;
    publish_status: 'draft' | 'published' | 'trashed';

    // Export
    export_target: string | null; // 'softreal' (Czech CRM), null = no export

    // Draft versioning
    draft_data: Record<string, unknown> | null;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Input type for creating/updating (no id, timestamps)
export type PropertyInput = Omit<PropertyRecord, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// HELPER: Generate slug from title
// ============================================

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
        .replace(/\s+/g, '-')            // Spaces to hyphens
        .replace(/-+/g, '-')             // Collapse multiple hyphens
        .replace(/^-|-$/g, '')           // Trim hyphens
        .slice(0, 80);                   // Max length
}

// ============================================
// HELPER: Format price
// ============================================

export function formatPrice(price: number): string {
    return `€ ${price.toLocaleString('en-US')}`;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all properties (admin view — all statuses)
 */
export async function getAllProperties(): Promise<PropertyRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch properties: ${error.message}`);
    return (data || []) as PropertyRecord[];
}

/**
 * Get published properties only (public site)
 */
export async function getPublishedProperties(): Promise<PropertyRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('publish_status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch published properties: ${error.message}`);
    return (data || []) as PropertyRecord[];
}

/**
 * Cached version of getPublishedProperties — revalidates every 5 min.
 * Tag 'properties' lets admin routes bust the cache instantly on publish/update/delete.
 */
export const getCachedPublishedProperties = unstable_cache(
    getPublishedProperties,
    ['published-properties'],
    { revalidate: 300, tags: ['properties'] }
);

/**
 * Fetch a small set of similar properties (same country, excluding current).
 * Used on property detail pages — avoids loading the entire catalogue.
 */
export async function getSimilarProperties(
    propertyId: string,
    country: string,
    limit: number = 3
): Promise<PropertyRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('publish_status', 'published')
        .ilike('country', country)
        .neq('id', propertyId)
        .limit(limit);

    if (error) throw new Error(`Failed to fetch similar properties: ${error.message}`);
    return (data || []) as PropertyRecord[];
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string): Promise<PropertyRecord | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to fetch property: ${error.message}`);
    }
    return data as PropertyRecord;
}

/**
 * Get a single property by slug (for public pages)
 */
export async function getPropertyBySlug(slug: string): Promise<PropertyRecord | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .eq('publish_status', 'published')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch property: ${error.message}`);
    }
    return data as PropertyRecord;
}

/**
 * Create a new property
 */
export async function createProperty(input: Partial<PropertyInput>): Promise<PropertyRecord> {
    const supabase = getAdminClient();

    // Generate slug if not provided
    if (!input.slug && input.title_sk) {
        input.slug = generateSlug(input.title_sk);

        // Ensure slug is unique
        const { data: existing } = await supabase
            .from('properties')
            .select('slug')
            .like('slug', `${input.slug}%`);

        if (existing && existing.length > 0) {
            input.slug = `${input.slug}-${existing.length + 1}`;
        }
    }

    const { data, error } = await supabase
        .from('properties')
        .insert(input)
        .select()
        .single();

    if (error) throw new Error(`Failed to create property: ${error.message}`);
    return data as PropertyRecord;
}

/**
 * Update an existing property
 */
export async function updateProperty(id: string, input: Partial<PropertyInput>): Promise<PropertyRecord> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('properties')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update property: ${error.message}`);
    return data as PropertyRecord;
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete property: ${error.message}`);
}

/**
 * Toggle featured status
 */
export async function toggleFeatured(id: string, featured: boolean): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('properties')
        .update({ featured })
        .eq('id', id);

    if (error) throw new Error(`Failed to toggle featured: ${error.message}`);
}

/**
 * Update publish status
 */
export async function updatePublishStatus(id: string, status: 'draft' | 'published' | 'trashed'): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('properties')
        .update({ publish_status: status })
        .eq('id', id);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
}

/**
 * Save draft data (auto-save for published properties)
 * Stores edits in draft_data JSONB without touching published columns
 */
export async function saveDraft(id: string, draftPayload: Record<string, unknown>): Promise<PropertyRecord> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('properties')
        .update({ draft_data: draftPayload })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to save draft: ${error.message}`);
    return data as PropertyRecord;
}

/**
 * Publish a property — merges draft_data into main columns,
 * clears draft_data, and sets publish_status to 'published'
 */
export async function publishProperty(id: string, payload: Partial<PropertyInput>): Promise<PropertyRecord> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('properties')
        .update({
            ...payload,
            publish_status: 'published',
            draft_data: null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to publish property: ${error.message}`);
    return data as PropertyRecord;
}

/**
 * Get property count by status (for dashboard)
 */
export async function getPropertyCounts(): Promise<{ total: number; published: number; draft: number; trashed: number }> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('properties')
        .select('publish_status');

    if (error) throw new Error(`Failed to get counts: ${error.message}`);

    const records = data || [];
    return {
        total: records.filter(r => r.publish_status !== 'trashed').length,
        published: records.filter(r => r.publish_status === 'published').length,
        draft: records.filter(r => r.publish_status === 'draft').length,
        trashed: records.filter(r => r.publish_status === 'trashed').length,
    };
}

/**
 * Soft-delete: move property to trash
 */
export async function trashProperty(id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('properties')
        .update({ publish_status: 'trashed', export_target: null, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(`Failed to trash property: ${error.message}`);
}

/**
 * Restore a trashed property back to draft
 */
export async function restoreProperty(id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
        .from('properties')
        .update({ publish_status: 'draft' })
        .eq('id', id);

    if (error) throw new Error(`Failed to restore property: ${error.message}`);
}

/**
 * Permanently delete trashed properties older than `daysOld` days
 * Returns the number of purged records
 */
export async function permanentlyDeleteTrashedProperties(daysOld: number = 30): Promise<{ purged: number; imageUrls: string[] }> {
    const supabase = getAdminClient();
    const cutoff = new Date(Date.now() - daysOld * 86400000).toISOString();

    // Fetch trashed properties older than cutoff
    const { data, error: fetchError } = await supabase
        .from('properties')
        .select('id, images')
        .eq('publish_status', 'trashed')
        .lt('updated_at', cutoff);

    if (fetchError) throw new Error(`Failed to fetch trashed: ${fetchError.message}`);
    if (!data || data.length === 0) return { purged: 0, imageUrls: [] };

    // Collect image URLs for blob cleanup
    const imageUrls: string[] = [];
    for (const row of data) {
        if (row.images && Array.isArray(row.images)) {
            for (const img of row.images) {
                if (typeof img === 'string') imageUrls.push(img);
                else if (img && typeof img === 'object' && 'url' in img) imageUrls.push((img as { url: string }).url);
            }
        }
    }

    // Delete from database
    const ids = data.map(r => r.id);
    const { error: delError } = await supabase
        .from('properties')
        .delete()
        .in('id', ids);

    if (delError) throw new Error(`Failed to permanently delete: ${delError.message}`);

    return { purged: ids.length, imageUrls };
}
