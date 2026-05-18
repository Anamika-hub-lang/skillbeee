import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import { radii } from '@/theme';

export function SkeletonBox({
  height,
  width = '100%',
}: {
  height: number;
  width?: number | `${number}%`;
}) {
  const t = useThemeColors();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.box,
        style,
        {
          height,
          width: width as never,
          backgroundColor: t.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.md,
  },
});
