import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { signInWithGoogle } from '@/lib/auth/google';
import { goToRoleAfterAuth } from '@/lib/auth/goToRoleAfterAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fontSizes, palette, space } from '@/theme';

export default function Login() {
  const router = useRouter();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [savedSessionEmail, setSavedSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email?.trim();
      setSavedSessionEmail(email || null);
    });
  }, []);

  const continueGoogle = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Supabase required',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment (EAS production profile or .env), then rebuild the app.',
      );
      return;
    }
    setGoogleBusy(true);
    try {
      const r = await signInWithGoogle();
      if (r.ok) {
        goToRoleAfterAuth(router);
        return;
      }
      Alert.alert('Google sign-in', r.reason);
    } catch (e) {
      Alert.alert('Google sign-in', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthScreenLayout onBack={() => router.replace('/onboarding')}>
      <AppText variant="caption" style={styles.kicker}>
        welcome in
      </AppText>
      <AppText variant="body" style={styles.sub}>
        Sign in or create an account with email. Clients and students both use the same login — you'll
        pick your role next.
      </AppText>

      <View style={{ height: space.lg }} />

      {savedSessionEmail ? (
        <>
          <BeeButton
            title={`Continue as ${savedSessionEmail}`}
            onPress={() => goToRoleAfterAuth(router)}
          />
          <View style={{ height: space.md }} />
        </>
      ) : null}

      <BeeButton title="Log in with email" onPress={() => router.push('/auth/sign-in')} />
      <View style={{ height: space.md }} />
      <BeeButton
        variant="secondary"
        title="Create account"
        onPress={() => router.push('/auth/sign-up')}
      />
      <View style={{ height: space.md }} />
      <BeeButton
        variant="ghost"
        title="Continue with Google"
        loading={googleBusy}
        onPress={() => void continueGoogle()}
      />

      <Pressable onPress={() => router.push('/auth/forgot')} style={styles.forgotWrap}>
        <AppText variant="caption" style={styles.link}>
          Forgot password?
        </AppText>
      </Pressable>

      <AppText variant="caption" style={styles.note}>
        Email/password uses your Supabase project (enable Email provider in Authentication → Providers).
      </AppText>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  kicker: {
    textTransform: 'lowercase',
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(10,10,10,0.55)',
  },
  sub: {
    marginTop: space.xs,
    lineHeight: 22,
    color: 'rgba(10,10,10,0.78)',
  },
  forgotWrap: {
    marginTop: space.lg,
    alignItems: 'center',
  },
  link: {
    color: palette.black,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontSize: fontSizes.sm,
  },
  note: {
    marginTop: space.xl,
    color: 'rgba(10,10,10,0.5)',
    lineHeight: 18,
  },
});
