import * as WebBrowser from 'expo-web-browser';

import { consumeAuthCallbackUrl, getAuthRedirectTo } from '@/lib/auth/authRedirect';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth via Supabase (`supabase.auth.signInWithOAuth`) + in-app browser (PKCE).
 * For production Android APK, add the redirect URL (e.g. `skillbee://auth/callback`) to Supabase Auth URL allow list.
 */
export async function signInWithGoogle(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'Supabase is not configured' };
  }

  const redirectTo = getAuthRedirectTo();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { ok: false, reason: error?.message ?? 'No OAuth URL' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success' || !('url' in result) || !result.url) {
      return { ok: false, reason: result.type === 'cancel' ? 'Cancelled' : 'Auth session failed' };
    }

    const consumed = await consumeAuthCallbackUrl(result.url);
    if (!consumed.ok) {
      return { ok: false, reason: consumed.reason };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Google sign-in failed' };
  }
}
