import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

/**
 * URL embedded in Supabase emails (password reset, email confirm).
 * Must be listed under Supabase Dashboard → Authentication → URL configuration → Redirect URLs.
 *
 * `makeRedirectUri` / Metro often produce `http://localhost:8081` — that fails on a real phone
 * ("connection refused"). We fall back to the app scheme from `app.json`.
 */
export function getAuthRedirectTo(): string {
  const created = Linking.createURL('/auth/callback');
  const lower = created.toLowerCase();
  if (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.startsWith('http://localhost') ||
    lower.startsWith('https://localhost')
  ) {
    return 'skillbee://auth/callback';
  }
  return created;
}

export type ConsumeAuthUrlResult =
  | { ok: true; flow: 'recovery' | 'signup' | 'signin' }
  | { ok: false; reason: string };

/**
 * Parses OAuth / magic-link / password-recovery redirects and sets the Supabase session.
 */
export async function consumeAuthCallbackUrl(url: string): Promise<ConsumeAuthUrlResult> {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(String(code));
    if (error) return { ok: false, reason: error.message };
    return { ok: true, flow: 'signin' };
  }

  let hash = '';
  try {
    const u = new URL(url);
    hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash;
  } catch {
    /* query-only URL */
  }
  if (!hash && url.includes('#')) {
    hash = (url.split('#')[1] ?? '').split('?')[0] ?? '';
  }

  const search = new URLSearchParams(hash);
  let access_token = search.get('access_token');
  let refresh_token = search.get('refresh_token');
  let type = search.get('type');

  if (!access_token || !refresh_token) {
    try {
      const u = new URL(url);
      access_token = u.searchParams.get('access_token') ?? access_token;
      refresh_token = u.searchParams.get('refresh_token') ?? refresh_token;
      type = u.searchParams.get('type') ?? type;
    } catch {
      /* ignore */
    }
  }

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return { ok: false, reason: error.message };
    const flow: 'recovery' | 'signup' | 'signin' =
      type === 'recovery' ? 'recovery' : type === 'signup' ? 'signup' : 'signin';
    return { ok: true, flow };
  }

  return { ok: false, reason: 'No auth parameters in link' };
}
