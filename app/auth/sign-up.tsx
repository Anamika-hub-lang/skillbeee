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
import {
  isValidEmail,
  signUpWithEmailPassword,
  validatePasswordForSignUp,
} from '@/lib/auth/emailPassword';
import { signInWithGoogle } from '@/lib/auth/google';
import { goToRoleAfterAuth } from '@/lib/auth/goToRoleAfterAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fontSizes, palette, radii, space } from '@/theme';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onCreateAccount = () => {
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
      const pwErr = validatePasswordForSignUp(password);
      if (pwErr) {
        Alert.alert('Password', pwErr);
        return;
      }
      if (password !== confirm) {
        Alert.alert('Password', 'Passwords do not match.');
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
        const r = await signUpWithEmailPassword(e, password);
        if (!r.ok) {
          Alert.alert('Could not sign up', r.message);
          return;
        }
        if (r.needsEmailConfirmation) {
          Alert.alert(
            'Confirm your email',
            'We sent you a link. Open it on this device, then return and log in.',
            [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }],
          );
          return;
        }
        goToRoleAfterAuth(router);
      } catch (err) {
        Alert.alert(
          'Could not sign up',
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
    <AuthScreenLayout
      onBack={() => router.back()}
      heroTitle="Hello!"
      heroSubtitle="Create your SkillBee account">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppText variant="subtitle" style={styles.heading}>
          Sign up with email
        </AppText>
        <AppText variant="caption" style={styles.hint}>
          Client or student — you’ll pick your role next.
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
            placeholder="At least 8 characters"
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

        <AppText variant="caption" style={[styles.label, { marginTop: space.md }]}>
          Confirm password
        </AppText>
        <TextInput
          placeholder="Repeat password"
          placeholderTextColor="rgba(10,10,10,0.4)"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          style={styles.input}
        />

        <View style={{ height: space.lg }} />
        <BeeButton title="Create account" loading={busy} disabled={googleBusy} onPress={onCreateAccount} />
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
            Already have an account?{' '}
          </AppText>
          <Pressable onPress={() => router.replace('/auth/sign-in')}>
            <AppText variant="caption" style={styles.switchBold}>
              Log in
            </AppText>
          </Pressable>
        </View>
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
});
