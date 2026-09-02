import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded when this module is imported
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug: log whether env vars are present (do not print secrets)
console.log('supabaseClient: SUPABASE_URL present=', Boolean(SUPABASE_URL), 'length=', SUPABASE_URL.length);
console.log('supabaseClient: SUPABASE_ANON_KEY present=', Boolean(SUPABASE_ANON_KEY), 'length=', SUPABASE_ANON_KEY.length);
console.log('supabaseClient: SUPABASE_SERVICE_ROLE_KEY present=', Boolean(SUPABASE_SERVICE_ROLE_KEY), 'length=', SUPABASE_SERVICE_ROLE_KEY.length);

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    // use global fetch in node 18+
  });
}

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
  }
  return supabase;
}

export function getServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Service role client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export default supabase;
