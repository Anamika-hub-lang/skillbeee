import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { Gig } from '@/types';
import { palette, radii, space, tabBarStripHeight } from '@/theme';

import { AppText } from '../ui/AppText';
import { GigStackCard } from './GigStackCard';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_OUT = SCREEN_W * 0.35;
/** Card height — leave room for action row below the deck */
const CARD_H = Math.min(SCREEN_H * 0.5, 460);
const PEEK_GAP = 12;
/** Deck canvas: front card + peek for stacked backs */
const DECK_BOX_H = CARD_H + PEEK_GAP * 2 + 24;

type Props = {
  gigs: Gig[];
  onAccept: (gig: Gig) => void;
  onSkip: (gig: Gig) => void;
  /** When true and the list is empty, show search-specific copy instead of “caught up”. */
  hasActiveSearch?: boolean;
};

export function GigSwipeDeck({ gigs, onAccept, onSkip, hasActiveSearch = false }: Props) {
  const t = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarH = useContext(BottomTabBarHeightContext) ?? 0;
  /** Tab is `position: absolute` — reserve full strip height (context can be 0 briefly) */
  const tabStripH = Math.max(tabBarH, tabBarStripHeight(insets.bottom), 76);
  /** Reserve space above the tab strip for the action buttons */
  const actionsBottomPad = tabStripH + space.sm;
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const n = gigs.length;
  const idx = n > 0 ? index % n : 0;
  const top = n > 0 ? gigs[idx] : undefined;
  const next = n > 1 ? gigs[(idx + 1) % n] : undefined;
  const third = n > 2 ? gigs[(idx + 2) % n] : undefined;

  const reset = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  const bump = useCallback(() => {
    if (n <= 0) return;
    setIndex((i) => (i + 1) % n);
    reset();
  }, [n, reset]);

  const completeAccept = useCallback(
    (g: Gig) => {
      onAccept(g);
    },
    [onAccept],
  );

  const completeSkip = useCallback(
    (g: Gig) => {
      onSkip(g);
      bump();
    },
    [bump, onSkip],
  );

  useEffect(() => {
    setIndex(0);
    reset();
  }, [gigs, reset]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.12;
        })
        .onEnd((e) => {
          const x = e.translationX;
          if (x > SWIPE_OUT && top) {
            translateX.value = 0;
            translateY.value = 0;
            runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            runOnJS(completeAccept)(top);
          } else if (x < -SWIPE_OUT && top) {
            translateX.value = 0;
            translateY.value = 0;
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(completeSkip)(top);
          } else {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
          }
        }),
    [completeAccept, completeSkip, top, translateX, translateY],
  );

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_W, SCREEN_W],
          [-10, 10],
        )}deg`,
      },
    ],
  }));

  const tapAccept = () => {
    if (!top) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeAccept(top);
  };

  const tapSkip = () => {
    if (!top) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeSkip(top);
  };

  if (!top) {
    return (
      <View style={styles.empty}>
        {hasActiveSearch ? (
          <>
            <AppText variant="title" center>
              No gigs match
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: space.sm, marginBottom: space.lg }}>
              Try a different search or clear the bar to see everything in your feed.
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="title" center>
              {"You're all caught up"}
            </AppText>
            <AppText variant="body" muted center style={{ marginTop: space.sm, marginBottom: space.lg }}>
              {
                "No open tasks right now. When clients post, they'll show up here — check back soon."
              }
            </AppText>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.stackArea}>
        <View style={styles.deckBox}>
          {third ? (
            <View style={[styles.back, styles.backFar]}>
              <GigStackCard gig={third} />
            </View>
          ) : null}
          {next ? (
            <View style={[styles.back, styles.backMid]}>
              <GigStackCard gig={next} />
            </View>
          ) : null}
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.front, topStyle]}>
              <GigStackCard gig={top} />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: actionsBottomPad }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip gig"
          onPress={tapSkip}
          style={[styles.circle, styles.skipCircle, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="close" size={30} color={t.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply to gig"
          onPress={tapAccept}
          style={[styles.circle, styles.acceptCircle, { backgroundColor: t.primary }]}>
          <Ionicons name="checkmark" size={30} color="#0A0A0A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  stackArea: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start',
    paddingTop: space.sm,
  },
  deckBox: {
    height: DECK_BOX_H,
    width: '100%',
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 1,
  },
  back: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CARD_H,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  backMid: {
    bottom: PEEK_GAP,
    zIndex: 1,
    transform: [{ scale: 0.97 }],
  },
  backFar: {
    bottom: PEEK_GAP * 2,
    zIndex: 0,
    transform: [{ scale: 0.94 }],
  },
  front: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CARD_H,
    zIndex: 4,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xl,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    flexShrink: 0,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
    ]),
  },
  skipCircle: {
    borderColor: palette.gray200,
  },
  acceptCircle: {
    borderColor: palette.black,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
});
