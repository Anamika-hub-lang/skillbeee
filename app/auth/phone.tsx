import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, radii, space } from '@/theme';

export default function PhoneAuth() {
  const router = useRouter();
  const t = useThemeColors();
  const signIn = useSessionStore((s) => s.signInDemo);
  const [phone, setPhone] = useState('');

  return (
    <Screen scroll>
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        Phone OTP
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.xl }}>
        UI-only flow — connect Supabase phone provider to go live.
      </AppText>
      <TextInput
        keyboardType="phone-pad"
        placeholder="+1 (555) 000-0000"
        placeholderTextColor={t.muted}
        value={phone}
        onChangeText={setPhone}
        style={[
          styles.input,
          { color: t.text, backgroundColor: t.surface, borderColor: t.border },
        ]}
      />
      <View style={{ height: space.lg }} />
      <BeeButton
        title="Send code"
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
