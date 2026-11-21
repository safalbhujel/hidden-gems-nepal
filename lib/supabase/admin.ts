import { createClient } from '@supabase/supabase-js';

/**
 * Server-only privileged Supabase client for administrative operations.
 * Bypasses RLS using the SUPABASE_SERVICE_ROLE_KEY to perform content moderation,
 * status transitions, and system telemetry queries.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error('[createSupabaseAdminClient] Missing Supabase configuration');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
