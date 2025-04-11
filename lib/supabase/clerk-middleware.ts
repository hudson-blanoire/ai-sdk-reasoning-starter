import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client authenticated with Clerk user identity
 * This should be used in API routes to maintain proper authorization
 */
export async function createClerkAuthenticatedSupabaseClient(req: NextRequest) {
  // Get the Clerk authentication context
  const { userId } = getAuth(req);
  
  if (!userId) {
    throw new Error("Unauthorized: No authenticated user found");
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and service role key must be provided in environment variables');
  }
  
  // Create Supabase client with Clerk user context
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          // Pass Clerk user ID as custom header
          'x-clerk-user-id': userId,
        },
      },
    }
  );
  
  return { supabase, userId };
}
