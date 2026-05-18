import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GigSwipeDeck } from '@/components/gigs/GigSwipeDeck';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { SearchField } from '@/components/ui/SearchField';
import { SkeletonBox } from '@/components/ui/Skeleton';
import { useGigs } from '@/hooks/useGigs';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/stores/session';
import type { Gig } from '@/types';
import { palette, radii, space } from '@/theme';

export default function Discover() {
  const router = useRouter();
  const t = useThemeColors();
  const role = useSessionStore((s) => s.role);
  const { data, isLoading } = useGigs();
  const [query, setQuery] = useState('');

  const gigs = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.skills.some((s) => s.toLowerCase().includes(q)),
    );
  }, [data, query]);

  const onAccept = (gig: Gig) => {
    router.push({ pathname: '/match', params: { gigId: gig.id } });
  };

  const onSkip = (_gig: Gig) => {
    // no-op: deck advances internally
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <View style={[styles.hero, { backgroundColor: palette.yellow }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={12}>
            <Ionicons name="notifications-outline" size={24} color="#0A0A0A" />
          </Pressable>
          <AppText variant="caption" style={styles.logo}>
            skillbee
          </AppText>
          <Pressable onPress={() => router.push('/client/post')} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={26} color="#0A0A0A" />
          </Pressable>
        </View>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search skills, stacks, vibes…"
        />
        <View style={{ height: space.md }} />
      </View>

      <View style={[styles.sheet, { backgroundColor: t.background }]}>
        {role === 'client' ? (
          <View style={styles.client}>
            <AppText variant="title" style={{ marginBottom: space.sm }}>
              Post a lightning task
            </AppText>
            <AppText variant="body" muted style={{ marginBottom: space.lg }}>
              students are online — keep it under a few hours for best matches.
            </AppText>
            <BeeButton title="Create a gig" onPress={() => router.push('/client/post')} />
          </View>
        ) : isLoading ? (
          <View style={{ paddingTop: space.lg }}>
            <SkeletonBox height={420} width="100%" />
          </View>
        ) : (
          <GigSwipeDeck gigs={gigs} onAccept={onAccept} onSkip={onSkip} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  logo: {
    textTransform: 'lowercase',
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0A0A0A',
  },
  sheet: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  client: {
    paddingTop: space.md,
  },
});
