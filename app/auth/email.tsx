import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, radii, space } from '@/theme';

export default function EmailAuth() {
  const router = useRouter();
  const t = useThemeColors();
  const signIn = useSessionStore((s) => s.signInDemo);
  const [email, setEmail] = useState('');

  return (
    <Screen scroll>
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        College email
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.xl }}>
        We’ll verify your .edu — demo skips verification.
      </AppText>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@school.edu"
        placeholderTextColor={t.muted}
        value={email}
        onChangeText={setEmail}
        style={[
          styles.input,
          { color: t.text, backgroundColor: t.surface, borderColor: t.border },
        ]}
      />
      <View style={{ height: space.lg }} />
      <BeeButton
        title="Continue"
        onPress={() => {
          signIn();
          router.replace('/role');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: fontSizes.md,
    borderWidth: 1,
  },
});
