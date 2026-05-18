import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useSessionStore } from '@/stores/session';
import { palette, space } from '@/theme';

export default function Entry() {
  const router = useRouter();
  const hydrated = useSessionStore((s) => s.hydrated);
  const [minElapsed, setMinElapsed] = useState(false);
  const scale = useSharedValue(0.86);
  const rotate = useSharedValue(-6);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220 }),
    );
    rotate.value = withSequence(
      withTiming(0, { duration: 520 }),
      withRepeat(
        withSequence(
          withTiming(4, { duration: 900 }),
          withTiming(-4, { duration: 900 }),
        ),
        -1,
        true,
      ),
    );
  }, [rotate, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  useEffect(() => {
    if (!hydrated || !minElapsed) return;
    const s = useSessionStore.getState();
    if (!s.onboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    if (!s.isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (!s.role) {
      router.replace('/role');
      return;
    }
    if (s.role === 'student' && !s.studentProfileComplete) {
      router.replace('/student-setup');
      return;
    }
    router.replace('/(tabs)/discover');
  }, [hydrated, minElapsed, router]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.mark, logoStyle]}>
        <AppText variant="hero" style={styles.wordmark}>
          SkillBee
        </AppText>
      </Animated.View>
      <AppText variant="caption" muted center style={{ marginTop: space.md }}>
        micro-gigs. mega vibes.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  mark: {
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  wordmark: {
    color: palette.black,
    letterSpacing: -0.5,
  },
});
