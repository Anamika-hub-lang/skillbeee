import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { radii, shadows, space } from '@/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  tone?: 'default' | 'yellow' | 'cream';
};

export function BeeCard({ children, style, padded = true, tone = 'default' }: Props) {
  const t = useThemeColors();
  const bg =
    tone === 'yellow'
      ? t.primary
      : tone === 'cream'
        ? t.background
        : t.surface;
  return (
    <View
      style={[
        styles.card,
        shadows.card,
        { backgroundColor: bg },
        padded && { padding: space.lg },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
  },
});
