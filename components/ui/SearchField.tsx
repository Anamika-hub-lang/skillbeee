import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, radii, space } from '@/theme';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder }: Props) {
  const t = useThemeColors();
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface }]}>
      <Ionicons name="search" size={20} color={t.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        style={[styles.input, { color: t.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
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
  input: {
    flex: 1,
    fontSize: fontSizes.md,
  },
});
