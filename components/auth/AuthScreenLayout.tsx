import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkillBeeLogo } from '@/components/brand/SkillBeeLogo';
import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import { layout, palette, radii, space } from '@/theme';

type Props = {
  children: ReactNode;
  /** Show back chevron (calls onBack). */
  onBack?: () => void;
};

/**
 * Yellow honeycomb hero with logo above; cream form card sits lower on the screen.
 */
export function AuthScreenLayout({ children, onBack }: Props) {
  const scheme = useAppColorScheme();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.layer}>
        <HoneycombBackground scheme={scheme} surface="yellow" opacity={0.92} />
        <View style={styles.shell}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={14}
              style={styles.backRow}>
              <Ionicons name="chevron-back" size={28} color={palette.black} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <View style={styles.logoZone}>
            <SkillBeeLogo size="authHero" />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.card}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  layer: {
    flex: 1,
  },
  shell: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: layout.screenPaddingX,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backSpacer: {
    height: space.md,
  },
  logoZone: {
    flex: 1,
    minHeight: 140,
    maxHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: space.lg,
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: radii.xxxl,
    borderWidth: 2,
    borderColor: palette.black,
    padding: space.lg,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      },
    ]),
  },
});
