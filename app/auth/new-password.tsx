import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { goToRoleAfterAuth } from '@/lib/auth/goToRoleAfterAuth';
import { validatePasswordForSignUp } from '@/lib/auth/emailPassword';
import { supabase } from '@/lib/supabase';
import { fontSizes, palette, radii, space } from '@/theme';

/**
 * Shown after password recovery deep link — user already has a temporary session.
 */
export default function NewPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <AuthScreenLayout onBack={() => router.replace('/auth/login')}>
      <AppText variant="title" style={styles.heading}>
        New password
      </AppText>
      <AppText variant="body" style={styles.hint}>
        Choose a strong password for your SkillBee account.
      </AppText>

      <AppText variant="caption" style={styles.label}>
        New password
      </AppText>
      <TextInput
        placeholder="At least 8 characters"
        placeholderTextColor="rgba(10,10,10,0.4)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <AppText variant="caption" style={[styles.label, { marginTop: space.md }]}>
        Confirm
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
      <BeeButton
        title="Update password"
        loading={busy}
        onPress={() => {
          void (async () => {
            const err = validatePasswordForSignUp(password);
            if (err) {
              Alert.alert('Password', err);
              return;
            }
            if (password !== confirm) {
              Alert.alert('Password', 'Passwords do not match.');
              return;
            }
            setBusy(true);
            try {
              const { error } = await supabase.auth.updateUser({ password });
              if (error) {
                Alert.alert('Could not update', error.message);
                return;
              }
              Alert.alert('Done', 'Your password was updated.', [
                { text: 'OK', onPress: () => goToRoleAfterAuth(router) },
              ]);
            } catch (e) {
              Alert.alert('Could not update', e instanceof Error ? e.message : 'Something went wrong.');
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
});
