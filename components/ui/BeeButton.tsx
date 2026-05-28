import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, fontWeights, palette, radii, space } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function BeeButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const t = useThemeColors();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  const bg = isPrimary
    ? palette.black
    : isGhost
      ? 'transparent'
      : t.surface;
  const fg = isPrimary ? palette.white : t.text;
  const borderWidth = isGhost ? 1.5 : 0;
  const borderColor = isGhost ? t.border : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.base,
        {
          backgroundColor: bg,
          opacity: pressed ? 0.92 : disabled ? 0.45 : 1,
          borderWidth,
          borderColor,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <AppText
          style={{
            color: fg,
            fontSize: fontSizes.md,
            fontWeight: fontWeights.bold,
          }}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
});
