import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { ReactNode, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/theme/colors';
import { colors } from '@/theme/colors';
import { layout, space } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  /** Hide hive texture (e.g. modals) */
  showPattern?: boolean;
  /** Lock this screen to light or dark regardless of app theme */
  forcedScheme?: ColorScheme;
};

export function Screen({
  children,
  scroll = false,
  contentStyle,
  edges = ['top', 'left', 'right'],
  showPattern = true,
  forcedScheme,
}: Props) {
  const appScheme = useAppColorScheme();
  const scheme = forcedScheme ?? appScheme;
  const t = colors[scheme];
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  const patternSurface = scheme === 'light' ? 'cream' : 'default';

  const scrollBottomPad =
    space.xxxl + (tabBarHeight > 0 ? tabBarHeight + space.xl : insets.bottom + space.xl);

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomPad },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.fill} edges={edges}>
      <View style={[styles.fill, { backgroundColor: t.background }]}>
        {showPattern ? (
          <HoneycombBackground scheme={scheme} surface={patternSurface} opacity={0.96} />
        ) : null}
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.xs,
  },
});
