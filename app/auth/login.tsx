import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useSessionStore } from '@/stores/session';
import { palette, radii, space } from '@/theme';

export default function Login() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signInDemo);

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.sheet}>
        <AppText variant="caption" style={styles.kicker}>
          welcome in
        </AppText>
        <AppText variant="hero" style={styles.title}>
          Sign in to SkillBee
        </AppText>
        <AppText variant="body" muted style={{ marginTop: space.sm, marginBottom: space.xl }}>
          quick gigs for students. clients who move fast.
        </AppText>

        <BeeButton
          title="Continue with Google"
          onPress={() => {
            signIn();
            router.replace('/role');
          }}
        />
        <View style={{ height: space.md }} />
        <BeeButton
          variant="secondary"
          title="Phone OTP"
          onPress={() => router.push('/auth/phone')}
        />
        <View style={{ height: space.md }} />
        <BeeButton
          variant="ghost"
          title="College email"
          onPress={() => router.push('/auth/email')}
        />

        <View style={styles.row}>
          <Ionicons name="lock-closed-outline" size={18} color={palette.gray500} />
          <AppText variant="caption" muted style={{ marginLeft: space.sm }}>
            Supabase Auth ready — wire keys in `.env`
          </AppText>
        </View>
      </View>

      <Link href="/onboarding" asChild>
        <AppText variant="caption" center muted style={{ marginTop: space.lg }}>
          Back
        </AppText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: space.xxxl,
    backgroundColor: palette.white,
    borderTopLeftRadius: radii.xxxl,
    borderTopRightRadius: radii.xxxl,
    paddingHorizontal: space.lg,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
    minHeight: '72%',
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: -8 },
        elevation: 16,
      },
    ]),
  },
  kicker: {
    textTransform: 'lowercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: space.sm,
    letterSpacing: -0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
  },
});
