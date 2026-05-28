/**
 * Supabase client for Expo (dev, preview, and EAS production).
 *
 * **Environment (bundled at build time):**
 * - `EXPO_PUBLIC_SUPABASE_URL` — project URL, no trailing slash (normalized below).
 * - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — public anon key (never use the service role in the app).
 *
 * **EAS / production:** define both in [Expo dashboard → Environment variables](https://docs.expo.dev/eas/environment-variables/)
 * for the `production` and `preview` profiles. `EXPO_PUBLIC_*` is inlined when Metro bundles the app, so you must
 * create a new build after changing them.
 *
 * **Optional fallback:** if you inject values via `app.config` / `app.json` → `expo.extra`, those are read when env
 * vars are empty (useful for CI or local `eas build` without dashboard envs).
 *
 * **Polyfill:** `react-native-url-polyfill/auto` must load before `@supabase/supabase-js` (GoTrue uses `URL`).
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'skillbee.supabase.auth';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function trimOrEmpty(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Resolve config: `process.env` first (Metro / EAS), then `expo.extra` (optional app.config hook).
 */
function getSupabaseUrl(): string {
  const fromEnv = trimOrEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL);
  if (fromEnv) return stripTrailingSlash(fromEnv);
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const fromExtra = trimOrEmpty(extra.supabaseUrl);
  return stripTrailingSlash(fromExtra);
}

function getSupabaseAnonKey(): string {
  const fromEnv = trimOrEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  if (fromEnv) return fromEnv;
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return trimOrEmpty(extra.supabaseAnonKey);
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[SkillBee] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (or expo.extra.supabaseUrl / supabaseAnonKey). Supabase auth and API calls will not work until they are set and the app is rebuilt.',
  );
}

/**
 * Single shared client. On native, the session is persisted with AsyncStorage (`persistSession` + `storageKey`).
 * On web, the default browser storage is used when `storage` is omitted.
 *
 * `flowType: 'pkce'` is recommended for mobile OAuth / deep links (Expo AuthSession).
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
  {
    auth: {
      ...(Platform.OS !== 'web'
        ? {
            storage: AsyncStorage,
            storageKey: STORAGE_KEY,
          }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);

/**
 * React Native: run token refresh only while the app is foregrounded (Supabase + RN guidance).
 * This keeps `onAuthStateChange` receiving `TOKEN_REFRESHED` / `SIGNED_OUT` and avoids background timers.
 * Register once at module load; must be imported early (e.g. via `AuthSessionBridge` in root providers).
 *
 * @see https://supabase.com/docs/reference/javascript/auth-startautorefresh
 */
if (Platform.OS !== 'web') {
  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }

  AppState.addEventListener('change', (next) => {
    if (next === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}
