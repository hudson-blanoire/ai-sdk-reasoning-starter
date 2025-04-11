import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get a singleton instance of the Supabase client
 * This is for client-side usage and has limited permissions
 */
export function getSupabaseClient() {
  // Check if we have an environment URL and key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key must be provided in environment variables');
  }

  // Create client if it doesn't exist
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

/**
 * Get a Supabase client with admin privileges
 * This should ONLY be used in server-side contexts
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and service role key must be provided in environment variables');
  }

  // Create a new admin client (don't reuse for security reasons)
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    }
  });
}

/**
 * Create a Supabase client with a specific user context
 * This is useful for server functions that need to operate on behalf of a user
 */
export function createSupabaseClientWithUser(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and service role key must be provided in environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-clerk-user-id': userId,
      },
    },
  });
}
