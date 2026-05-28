import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkillBeeLogo } from '@/components/brand/SkillBeeLogo';
import { AppText } from '@/components/ui/AppText';
import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import { fontWeights, layout, palette, radii, space } from '@/theme';

type Props = {
  children: ReactNode;
  /** Show back chevron (calls onBack). */
  onBack?: () => void;
  /** Bold line under the logo (yellow area). */
  heroTitle?: string;
  /** Optional second line under heroTitle. */
  heroSubtitle?: string;
};

/**
 * Yellow honeycomb hero: logo + greeting on top, cream form card below (compact, aligned).
 */
export function AuthScreenLayout({
  children,
  onBack,
  heroTitle = 'Hello!',
  heroSubtitle,
}: Props) {
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

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.heroBlock}>
              <View style={styles.logoWrap}>
                <SkillBeeLogo size="authHero" />
              </View>
              {heroTitle ? (
                <AppText variant="hero" style={styles.heroTitle}>
                  {heroTitle}
                </AppText>
              ) : null}
              {heroSubtitle ? (
                <AppText variant="body" style={styles.heroSubtitle}>
                  {heroSubtitle}
                </AppText>
              ) : null}
            </View>

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
    height: space.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: space.lg,
    justifyContent: 'center',
    gap: space.lg,
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: space.xs,
    paddingBottom: space.xs,
    gap: space.xxs,
  },
  logoWrap: {
    marginBottom: -18,
  },
  heroTitle: {
    marginTop: 0,
    textAlign: 'center',
    color: palette.black,
    letterSpacing: -0.5,
    fontWeight: fontWeights.heavy,
  },
  heroSubtitle: {
    marginTop: space.xs,
    textAlign: 'center',
    color: 'rgba(10,10,10,0.72)',
    lineHeight: 22,
    paddingHorizontal: space.md,
    maxWidth: 340,
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
