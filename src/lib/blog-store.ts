/**
 * Blog Store — CRUD operations for the blog_posts table
 * Uses Supabase admin client (service role) for server-side operations
 * Mirrors the pattern from property-store.ts
 */

import { getAdminClient } from './supabase';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface BlogPostRecord {
    id: string;
    slug: string;

    // Content (3 languages)
    title_sk: string;
    title_en: string | null;
    title_cz: string | null;
    excerpt_sk: string | null;
    excerpt_en: string | null;
    excerpt_cz: string | null;
    content_sk: string | null;
    content_en: string | null;
    content_cz: string | null;

    // Metadata
    category: string;
    author: string;
    read_time: number;
    image: string;
    video_url: string | null;

    // SEO
    meta_title_sk: string | null;
    meta_title_en: string | null;
    meta_title_cz: string | null;
    meta_description_sk: string | null;
    meta_description_en: string | null;
    meta_description_cz: string | null;

    // Publishing
    featured: boolean;
    publish_status: 'draft' | 'published' | 'archived';

    // Timestamps
    created_at: string;
    updated_at: string;
    published_at: string | null;
}

// Input type for creating/updating (no id, timestamps)
export type BlogPostInput = Omit<BlogPostRecord, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// HELPER: Generate slug from title
// ============================================

function generateSlug(title: string): string {
    const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    // Append random suffix for uniqueness
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/** Get all blog posts (admin view — all statuses) */
export async function getAllBlogPosts(): Promise<BlogPostRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch blog posts: ${error.message}`);
    return (data || []) as BlogPostRecord[];
}

/** Get published blog posts only (public site) */
export async function getPublishedBlogPosts(): Promise<BlogPostRecord[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('publish_status', 'published')
        .order('published_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch published blog posts: ${error.message}`);
    return (data || []) as BlogPostRecord[];
}

/** Get a single blog post by ID */
export async function getBlogPostById(id: string): Promise<BlogPostRecord | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to fetch blog post: ${error.message}`);
    }
    return data as BlogPostRecord;
}

/** Get a single blog post by slug (for public pages) */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('publish_status', 'published')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch blog post: ${error.message}`);
    }
    return data as BlogPostRecord;
}

/** Create a new blog post */
export async function createBlogPost(input: Partial<BlogPostInput>): Promise<BlogPostRecord> {
    const supabase = getAdminClient();

    const slug = generateSlug(input.title_sk || 'blog-post');

    const insertData = {
        slug,
        title_sk: input.title_sk || '',
        title_en: input.title_en || null,
        title_cz: input.title_cz || null,
        excerpt_sk: input.excerpt_sk || '',
        excerpt_en: input.excerpt_en || null,
        excerpt_cz: input.excerpt_cz || null,
        content_sk: input.content_sk || '',
        content_en: input.content_en || null,
        content_cz: input.content_cz || null,
        category: input.category || '',
        author: input.author || 'Relax Properties',
        read_time: input.read_time ?? 5,
        image: input.image || '',
        meta_title_sk: input.meta_title_sk || null,
        meta_title_en: input.meta_title_en || null,
        meta_title_cz: input.meta_title_cz || null,
        meta_description_sk: input.meta_description_sk || null,
        meta_description_en: input.meta_description_en || null,
        meta_description_cz: input.meta_description_cz || null,
        featured: input.featured ?? false,
        publish_status: input.publish_status || 'draft',
    };

    const { data, error } = await supabase
        .from('blog_posts')
        .insert(insertData)
        .select()
        .single();

    if (error) throw new Error(`Failed to create blog post: ${error.message}`);
    return data as BlogPostRecord;
}

/** Update an existing blog post */
export async function updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPostRecord> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to update blog post: ${error.message}`);
    return data as BlogPostRecord;
}

/** Delete a blog post */
export async function deleteBlogPost(id: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete blog post: ${error.message}`);
}

/** Publish a blog post */
export async function publishBlogPost(id: string, payload: Partial<BlogPostInput>): Promise<BlogPostRecord> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .update({
            ...payload,
            publish_status: 'published',
            published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`Failed to publish blog post: ${error.message}`);
    return data as BlogPostRecord;
}

/** Get blog post counts by status (for dashboard) */
export async function getBlogPostCounts(): Promise<{ total: number; published: number; draft: number; archived: number }> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('publish_status');

    if (error) throw new Error(`Failed to count blog posts: ${error.message}`);

    const rows = data || [];
    return {
        total: rows.length,
        published: rows.filter(r => r.publish_status === 'published').length,
        draft: rows.filter(r => r.publish_status === 'draft').length,
        archived: rows.filter(r => r.publish_status === 'archived').length,
    };
}
