import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { palette, space } from '@/theme';

/** Avoid blank screen when tabs mount before Zustand persist finishes (e.g. Android state restore). */
export function HydrationGate() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.layer}>
        <HoneycombBackground scheme="light" surface="yellow" opacity={0.85} />
        <View style={styles.inner}>
          <Text style={styles.title}>SkillBee</Text>
          <Text style={styles.sub}>loading…</Text>
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
    position: 'relative',
  },
  inner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.black,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: space.sm,
    fontSize: 14,
    color: 'rgba(10,10,10,0.6)',
    fontWeight: '600',
  },
});
