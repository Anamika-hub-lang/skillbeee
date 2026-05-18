import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { Gig } from '@/types';
import { radii, space } from '@/theme';

import { GigStackCard } from './GigStackCard';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_OUT = SCREEN_W * 0.35;

type Props = {
  gigs: Gig[];
  onAccept: (gig: Gig) => void;
  onSkip: (gig: Gig) => void;
};

export function GigSwipeDeck({ gigs, onAccept, onSkip }: Props) {
  const t = useThemeColors();
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const top = gigs[index];
  const next = gigs[index + 1];
  const third = gigs[index + 2];

  const reset = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  const bump = useCallback(() => {
    setIndex((i) => Math.min(i + 1, gigs.length));
    reset();
  }, [gigs.length, reset]);

  const completeAccept = useCallback(
    (g: Gig) => {
      onAccept(g);
      bump();
    },
    [bump, onAccept],
  );

  const completeSkip = useCallback(
    (g: Gig) => {
      onSkip(g);
      bump();
    },
    [bump, onSkip],
  );

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
            translateX.value = withSpring(SCREEN_W * 1.2, {}, (finished) => {
              if (finished) {
                runOnJS(completeAccept)(top);
              }
            });
          } else if (x < -SWIPE_OUT && top) {
            translateX.value = withSpring(-SCREEN_W * 1.2, {}, (finished) => {
              if (finished) {
                runOnJS(completeSkip)(top);
              }
            });
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
        <Animated.View>
          {/* end state */}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.stack}>
        {third ? (
          <View style={[styles.back, { transform: [{ scale: 0.94 }], top: 18 }]}>
            <GigStackCard gig={third} />
          </View>
        ) : null}
        {next ? (
          <View style={[styles.back, { transform: [{ scale: 0.97 }], top: 9 }]}>
            <GigStackCard gig={next} />
          </View>
        ) : null}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.front, topStyle]}>
            <GigStackCard gig={top} />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={tapSkip}
          style={[
            styles.circle,
            { backgroundColor: t.surface, borderColor: t.border, marginRight: space.xl },
          ]}>
          <Ionicons name="close" size={34} color={t.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={tapAccept}
          style={[styles.circle, { backgroundColor: t.primary, borderColor: t.primary }]}>
          <Ionicons name="checkmark" size={34} color="#0A0A0A" />
        </Pressable>
      </View>
    </View>
  );
}

const CARD_H = Dimensions.get('window').height * 0.62;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space.md,
  },
  back: {
    position: 'absolute',
    width: '100%',
    height: CARD_H,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  front: {
    width: '100%',
    height: CARD_H,
    borderRadius: radii.xxl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: space.lg,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      },
    ]),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
