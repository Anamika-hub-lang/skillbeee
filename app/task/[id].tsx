import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { layout, palette, radii, space } from '@/theme';

const STEPS = [
  { key: 'accepted', label: 'Accepted', done: true },
  { key: 'working', label: 'Working', done: true },
  { key: 'review', label: 'Review', done: false },
  { key: 'paid', label: 'Payment released', done: false },
] as const;

export default function TaskProgress() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useThemeColors();
  const scheme = useAppColorScheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: t.background }]}>
        <HoneycombBackground
          scheme={scheme}
          surface={scheme === 'light' ? 'cream' : 'default'}
          opacity={0.92}
        />
        <View style={styles.layer}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={t.text} />
            </Pressable>
            <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>
              Task flow
            </AppText>
          </View>

          <View style={{ paddingHorizontal: layout.screenPaddingX }}>
            <BeeCard>
              <AppText variant="caption" muted>
                THREAD {id}
              </AppText>
              <AppText variant="subtitle" style={{ marginTop: space.xs }}>
                Milestones unlock payouts
              </AppText>
            </BeeCard>

            <View style={{ height: space.lg }} />

            <BeeCard>
              {STEPS.map((s, idx) => (
                <View key={s.key} style={styles.stepRow}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: s.done ? palette.yellow : t.border,
                      },
                    ]}>
                    <Ionicons
                      name={s.done ? 'checkmark' : 'ellipse-outline'}
                      size={18}
                      color={s.done ? '#0A0A0A' : t.muted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle">{s.label}</AppText>
                    {idx < STEPS.length - 1 ? (
                      <View style={[styles.line, { backgroundColor: t.border }]} />
                    ) : null}
                  </View>
                </View>
              ))}
            </BeeCard>

            <View style={{ height: space.xl }} />
            <BeeButton title="Mark review done" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 54 },
  layer: { flex: 1, zIndex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: space.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
    marginTop: 2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 22,
    marginLeft: 17,
    marginTop: space.xs,
    borderRadius: 2,
  },
});
