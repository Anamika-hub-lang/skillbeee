import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { useAuthMe } from '@/hooks/useAuthMe';
import { useRequirementGig } from '@/hooks/useRequirementGig';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/stores/session';
import { layout, palette, radii, space, fontSizes, fontWeights } from '@/theme';

export default function Match() {
  const params = useLocalSearchParams<{ gigId?: string | string[] }>();
  const scheme = useAppColorScheme();
  const gigIdRaw = params.gigId;
  const gigId = Array.isArray(gigIdRaw) ? gigIdRaw[0] : gigIdRaw;
  const router = useRouter();
  const student = useSessionStore((s) => s.studentProfile);
  const role = useSessionStore((s) => s.role);
  const { data: me } = useAuthMe(Boolean(role));
  const { data: gig } = useRequirementGig(gigId);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const clientUri = gig?.clientAvatar;
  const studentUri = me?.profile?.photoUrl ?? student.photoUri;

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.root}>
          <HoneycombBackground scheme={scheme} surface="yellow" opacity={1} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces>
            <View style={[styles.kickerPill, { borderColor: palette.black, backgroundColor: '#fff' }]}>
              <AppText variant="caption" style={styles.kickerPillText}>
                new connection
              </AppText>
            </View>
            <View style={{ height: space.md }} />
            <View style={styles.headerBlock}>
              <AppText variant="hero" style={styles.title}>
                It&apos;s a match!
              </AppText>
              <AppText variant="body" style={styles.sub}>
                you + {gig?.clientName ?? 'a client'} · thread opens in real time.
              </AppText>
            </View>

            <BeeCard tone="default" style={{ marginBottom: space.xl, backgroundColor: '#fff' }}>
              <View style={styles.photos}>
              <View style={[styles.photo, styles.left]}>
                {studentUri ? (
                  <Image source={{ uri: studentUri }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.placeholder]}>
                    <AppText variant="title" style={{ color: '#0A0A0A' }}>
                      {(student.displayName || 'U')[0]}
                    </AppText>
                  </View>
                )}
              </View>
              <View style={[styles.photo, styles.right]}>
                {clientUri ? (
                  <Image source={{ uri: clientUri }} style={styles.img} />
                ) : gig?.imageUrl ? (
                  <Image source={{ uri: gig.imageUrl }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.placeholder]}>
                    <AppText variant="title" style={{ color: '#0A0A0A' }}>
                      {(gig?.clientName || 'C')[0]}
                    </AppText>
                  </View>
                )}
              </View>
              <Animated.View style={[styles.star, starStyle]}>
                <AppText variant="title" style={{ color: '#0A0A0A' }}>
                  ★
                </AppText>
              </Animated.View>
            </View>
            </BeeCard>

            <MatchSummaryCard gigTitle={gig?.title} studentName={student.displayName} />

            <View style={styles.actions}>
              <BeeButton
                title="Open chat"
                onPress={() => {
                  if (gigId) {
                    router.replace({
                      pathname: '/chat/[id]',
                      params: {
                        id: gigId,
                        peerName: gig?.clientName ?? 'Client',
                        peerPhotoUrl: gig?.clientAvatar ?? '',
                      },
                    });
                  } else router.replace('/(tabs)/inbox');
                }}
              />
              <View style={{ height: space.md }} />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (gigId) router.push(`/gig/${gigId}`);
                }}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  { opacity: pressed ? 0.88 : 1 },
                ]}>
                <AppText style={styles.outlineBtnText}>View gig details</AppText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

function MatchSummaryCard({
  gigTitle,
  studentName,
}: {
  gigTitle?: string;
  studentName?: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <AppText variant="caption" style={styles.summaryKicker}>
        first move
      </AppText>
      <AppText variant="subtitle" style={styles.summaryTitle}>
        {studentName || 'You'} × {gigTitle ?? 'Quick gig'}
      </AppText>
      <AppText variant="body" style={styles.summaryQuote}>
        Application sent — the client gets notified in real time.
      </AppText>
    </View>
  );
}

const PHOTO = 128;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  root: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    justifyContent: 'center',
  },
  headerBlock: {
    marginBottom: space.lg,
  },
  kickerPill: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  kickerPillText: {
    fontWeight: '900',
    textTransform: 'lowercase',
    letterSpacing: 0.6,
    color: palette.black,
  },
  title: {
    textAlign: 'center',
    color: palette.black,
    letterSpacing: -0.6,
  },
  sub: {
    textAlign: 'center',
    color: 'rgba(10,10,10,0.72)',
    marginTop: space.md,
    lineHeight: 22,
  },
  photos: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  photo: {
    position: 'absolute',
    width: PHOTO,
    height: PHOTO,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#fff',
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      },
    ]),
  },
  left: {
    transform: [{ rotate: '-8deg' }, { translateX: -44 }],
  },
  right: {
    transform: [{ rotate: '8deg' }, { translateX: 44 }],
  },
  img: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 2,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    ]),
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: radii.xxl,
    padding: space.lg,
    borderWidth: 2,
    borderColor: 'rgba(10,10,10,0.12)',
    marginBottom: space.xl,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 10,
      },
    ]),
  },
  summaryKicker: {
    color: 'rgba(10,10,10,0.55)',
    fontWeight: '800',
    textTransform: 'lowercase',
    letterSpacing: 0.4,
  },
  summaryTitle: {
    marginTop: space.xs,
    color: palette.black,
    fontWeight: '800',
  },
  summaryQuote: {
    marginTop: space.sm,
    color: 'rgba(10,10,10,0.78)',
    lineHeight: 22,
  },
  actions: {
    marginTop: space.sm,
  },
  outlineBtn: {
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: palette.black,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
});
