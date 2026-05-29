import { Redirect, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { SkillBeeLogo } from '@/components/brand/SkillBeeLogo';
import { AppText } from '@/components/ui/AppText';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';
import { palette, space } from '@/theme';

/**
 * Entry: show branded splash until persist + min time + root navigator are ready,
 * then use <Redirect /> (reliable on Android — router.replace before nav mount = white screen).
 */
export default function Entry() {
  const hydrated = useSessionStore((s) => s.hydrated);
  const supabaseAuthReady = useSessionStore((s) => s.supabaseAuthReady);
  const onboardingComplete = useSessionStore((s) => s.onboardingComplete);
  const authFlowComplete = useSessionStore((s) => s.authFlowComplete);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const role = useSessionStore((s) => s.role);
  const studentProfileComplete = useSessionStore((s) => s.studentProfileComplete);
  const clientProfileComplete = useSessionStore((s) => s.clientProfileComplete);
  const rootNav = useRootNavigationState();
  const scheme = useAppColorScheme();
  const [minElapsed, setMinElapsed] = useState(false);
  const scale = useSharedValue(0.86);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!useSessionStore.getState().hydrated) {
        useSessionStore.getState().setHydrated(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220 }),
    );
  }, [scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const navReady = Boolean(rootNav?.key);
  const authGateOk = !isSupabaseConfigured() || supabaseAuthReady;
  const ready = hydrated && minElapsed && navReady && authGateOk;

  if (!ready) {
    return (
      <View style={styles.root}>
        <HoneycombBackground scheme={scheme} surface="yellow" opacity={0.96} />
        <View style={styles.splashContent}>
          <Animated.View style={logoStyle}>
            <SkillBeeLogo size="splash" style={styles.logoCenter} />
          </Animated.View>
          <AppText variant="caption" center style={styles.tagline}>
            micro-gigs. mega vibes.
          </AppText>
        </View>
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }
  if (!authFlowComplete || !isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  if (!role) {
    return <Redirect href="/role" />;
  }
  if (role === 'student' && !studentProfileComplete) {
    return <Redirect href="/student-setup" />;
  }
  if (role === 'client' && !clientProfileComplete) {
    return <Redirect href="/client-setup" />;
  }
  if (role === 'client') {
    return <Redirect href="/(tabs)/client-home" />;
  }
  return <Redirect href="/(tabs)/discover" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  splashContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    zIndex: 1,
  },
  logoCenter: {
    alignSelf: 'center',
  },
  tagline: {
    marginTop: space.lg,
    color: 'rgba(10,10,10,0.65)',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
});
