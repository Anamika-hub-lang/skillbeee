import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { radii, space } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function SkillPill({ label, selected, onPress }: Props) {
  const t = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? t.text : t.surface,
          borderColor: selected ? t.text : t.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <AppText
        variant="caption"
        style={{
          color: selected ? t.background : t.text,
          fontWeight: '700',
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
});
