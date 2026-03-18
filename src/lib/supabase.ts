import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy-initialized clients (avoids crash when env vars not set during build)
let _client: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

/**
 * Get the public Supabase client (respects RLS)
 */
export function getSupabaseClient(): SupabaseClient {
    if (!_client) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase nie je nakonfigurovaný. Nastavte NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY v .env.local');
        }
        _client = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _client;
}

/**
 * Get admin Supabase client (bypasses RLS via service role key)
 * Only use on the server side — NEVER expose to the browser
 */
export function getAdminClient(): SupabaseClient {
    if (!_adminClient) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase admin nie je nakonfigurovaný. Nastavte SUPABASE_SERVICE_ROLE_KEY v .env.local');
        }
        _adminClient = createClient(supabaseUrl, serviceRoleKey);
    }
    return _adminClient;
}
