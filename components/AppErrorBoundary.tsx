import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, space } from '@/theme';

/**
 * Replaces Expo Router’s generic “Something went wrong” with the real message
 * so dev / users can fix API URL, auth, or bad data issues.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>
        <Text style={styles.title}>SkillBee — yeh crash hua</Text>
        <Text style={styles.message}>{message}</Text>
        {__DEV__ && stack ? (
          <ScrollView style={styles.trace} keyboardShouldPersistTaps="handled">
            <Text selectable style={styles.mono}>
              {stack}
            </Text>
          </ScrollView>
        ) : null}
        <Text style={styles.hint}>
          Check Supabase env keys, run SQL `004_client_supabase_only.sql` for RLS + RPCs, and sign in again. Open
          DevTools (dev build) for the full stack trace above.
        </Text>
        <Pressable onPress={retry} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  inner: {
    flex: 1,
    padding: space.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.black,
    marginBottom: space.md,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(10,10,10,0.88)',
    marginBottom: space.md,
  },
  trace: {
    maxHeight: 160,
    marginBottom: space.md,
    padding: space.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.12)',
  },
  mono: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: palette.black,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(10,10,10,0.72)',
    marginBottom: space.lg,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: palette.black,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: 999,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
