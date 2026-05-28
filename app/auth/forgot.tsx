import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { getAuthRedirectTo } from '@/lib/auth/authRedirect';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fontSizes, palette, radii, space } from '@/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <AuthScreenLayout onBack={() => router.back()}>
      <AppText variant="title" style={styles.heading}>
        Reset password
      </AppText>
      <AppText variant="body" style={styles.hint}>
        We’ll email you a link. Open it on this phone. In Supabase → Authentication → URL configuration,
        allow redirect{' '}
        <AppText variant="body" style={{ fontWeight: '800' }}>
          skillbee://auth/callback
        </AppText>{' '}
        (localhost links fail on a real device).
      </AppText>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@email.com"
        placeholderTextColor="rgba(10,10,10,0.4)"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <View style={{ height: space.lg }} />
      <BeeButton
        title="Send reset link"
        loading={busy}
        onPress={() => {
          void (async () => {
            if (!isSupabaseConfigured()) {
              Alert.alert('Not configured', 'Add Supabase keys in .env first.');
              return;
            }
            const trimmed = email.trim();
            if (!trimmed) {
              Alert.alert('Email', 'Enter your email.');
              return;
            }
            setBusy(true);
            try {
              const redirectTo = getAuthRedirectTo();
              const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
                redirectTo,
              });
              if (error) {
                Alert.alert('Reset failed', error.message);
                return;
              }
              Alert.alert('Check your inbox', 'Open the link on this device to finish reset.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e) {
              Alert.alert('Reset failed', e instanceof Error ? e.message : 'Something went wrong.');
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
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
});
