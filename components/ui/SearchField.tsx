import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, radii, space } from '@/theme';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** When set, shows a ring (e.g. yellow on discover). */
  outlineColor?: string;
  outlineWidth?: number;
  compact?: boolean;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  outlineColor,
  outlineWidth = 2,
  compact = false,
}: Props) {
  const t = useThemeColors();
  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        {
          backgroundColor: t.surface,
          ...(outlineColor != null
            ? { borderWidth: outlineWidth, borderColor: outlineColor }
            : {}),
        },
      ]}>
      <Ionicons name="search" size={compact ? 18 : 20} color={t.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        style={[styles.input, compact && styles.inputCompact, { color: t.text }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearBtn}>
          <Ionicons name="close-circle" size={compact ? 18 : 20} color={t.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    height: 52,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      },
    ]),
  },
  wrapCompact: {
    height: 44,
    paddingHorizontal: space.sm,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    marginLeft: space.sm,
  },
  inputCompact: {
    fontSize: fontSizes.sm,
    marginLeft: space.xs,
  },
  clearBtn: {
    marginLeft: space.xs,
    padding: 2,
  },
});
