import { getAuthRedirectTo } from '@/lib/auth/authRedirect';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const MIN_PASSWORD_LEN = 8;

export function isValidEmail(email: string): boolean {
  const t = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function validatePasswordForSignUp(password: string): string | null {
  if (password.length < MIN_PASSWORD_LEN) {
    return `Password must be at least ${MIN_PASSWORD_LEN} characters.`;
  }
  return null;
}

function mapAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Something went wrong. Check your connection and try again.';
}

/**
 * Email/password sign-in via Supabase Auth (`supabase.auth.signInWithPassword`).
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase is not configured. Add keys to .env and restart Expo.' };
  }
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAuthError(e) };
  }
}

/**
 * Email/password sign-up via Supabase Auth (`supabase.auth.signUp`).
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string,
): Promise<
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; message: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase is not configured. Add keys to .env and restart Expo.' };
  }
  const pwErr = validatePasswordForSignUp(password);
  if (pwErr) return { ok: false, message: pwErr };

  const redirectTo = getAuthRedirectTo();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) return { ok: false, message: error.message };
    const needsEmailConfirmation = !data.session;
    return { ok: true, needsEmailConfirmation };
  } catch (e) {
    return { ok: false, message: mapAuthError(e) };
  }
}
