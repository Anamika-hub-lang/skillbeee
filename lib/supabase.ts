import { createClient, SupabaseClient } from '@supabase/supabase-js';

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? '';
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? '';

/** Realtime + Auth + Storage wiring — pass env keys to enable network calls */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function assertSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
