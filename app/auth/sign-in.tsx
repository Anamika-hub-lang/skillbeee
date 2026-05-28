import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { isValidEmail, signInWithEmailPassword } from '@/lib/auth/emailPassword';
import { signInWithGoogle } from '@/lib/auth/google';
import { goToRoleAfterAuth } from '@/lib/auth/goToRoleAfterAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fontSizes, palette, radii, space } from '@/theme';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onEmailSignIn = () => {
    void (async () => {
      const e = email.trim();
      if (!e) {
        Alert.alert('Email', 'Enter your email.');
        return;
      }
      if (!isValidEmail(e)) {
        Alert.alert('Email', 'Enter a valid email address.');
        return;
      }
      if (!password) {
        Alert.alert('Password', 'Enter your password.');
        return;
      }
      if (!isSupabaseConfigured()) {
        Alert.alert(
          'Supabase required',
          'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment, then rebuild the app.',
        );
        return;
      }
      setBusy(true);
      try {
        const r = await signInWithEmailPassword(e, password);
        if (!r.ok) {
          Alert.alert('Could not sign in', r.message);
          return;
        }
        goToRoleAfterAuth(router);
      } catch (err) {
        Alert.alert(
          'Could not sign in',
          err instanceof Error ? err.message : 'Something went wrong. Try again.',
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const onGoogle = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Supabase required',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment, then rebuild the app.',
      );
      return;
    }
    setGoogleBusy(true);
    try {
      const r = await signInWithGoogle();
      if (r.ok) goToRoleAfterAuth(router);
      else Alert.alert('Google sign-in', r.reason);
    } catch (err) {
      Alert.alert('Google sign-in', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthScreenLayout onBack={() => router.back()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppText variant="title" style={styles.heading}>
          Log in
        </AppText>
        <AppText variant="body" style={styles.hint}>
          Use the email and password you signed up with.
        </AppText>

        <AppText variant="caption" style={styles.label}>
          Email
        </AppText>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="rgba(10,10,10,0.4)"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <AppText variant="caption" style={[styles.label, { marginTop: space.md }]}>
          Password
        </AppText>
        <View style={styles.pwRow}>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="rgba(10,10,10,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            style={[styles.input, styles.pwInput]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
            onPress={() => setShowPw((v) => !v)}
            style={styles.eye}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={22} color={palette.black} />
          </Pressable>
        </View>

        <View style={{ height: space.lg }} />
      <BeeButton title="Sign in" loading={busy} disabled={googleBusy} onPress={onEmailSignIn} />
        <View style={{ height: space.md }} />
        <BeeButton
          variant="secondary"
          title="Continue with Google"
          loading={googleBusy}
          disabled={busy}
          onPress={() => void onGoogle()}
        />

        <View style={styles.switchRow}>
          <AppText variant="caption" style={styles.switchText}>
            New here?{' '}
          </AppText>
          <Pressable onPress={() => router.push('/auth/sign-up')}>
            <AppText variant="caption" style={styles.switchBold}>
              Create an account
            </AppText>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/auth/forgot')} style={styles.forgotLink}>
          <AppText variant="caption" style={styles.linkOnly}>
            Forgot password?
          </AppText>
        </Pressable>
      </KeyboardAvoidingView>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: palette.black,
    marginBottom: space.xs,
  },
  hint: {
    color: 'rgba(10,10,10,0.72)',
    marginBottom: space.lg,
    lineHeight: 22,
  },
  label: {
    fontWeight: '800',
    color: palette.black,
    marginBottom: space.xs,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: palette.black,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: fontSizes.md,
    color: palette.black,
    backgroundColor: palette.white,
  },
  pwRow: {
    position: 'relative',
  },
  pwInput: {
    paddingRight: 48,
  },
  eye: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  switchRow: {
    marginTop: space.lg,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  switchText: {
    color: 'rgba(10,10,10,0.65)',
  },
  switchBold: {
    fontWeight: '800',
    color: palette.black,
    textDecorationLine: 'underline',
  },
  linkOnly: {
    color: palette.black,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  forgotLink: {
    marginTop: space.md,
    alignItems: 'center',
  },
});
