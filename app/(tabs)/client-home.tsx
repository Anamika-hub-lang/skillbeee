import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useClientRequirements } from '@/hooks/useClientRequirements';
import { useClientApplicationCounts } from '@/hooks/useClientApplicationCounts';
import { useDashboard } from '@/hooks/useDashboard';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { useUnreadBadgeCounts } from '@/hooks/useUnreadBadgeCounts';
import { formatGigBudget } from '@/lib/formatMoney';
import { useSessionStore } from '@/stores/session';
import type { Gig } from '@/types';
import { layout, palette, radii, space } from '@/theme';

export default function ClientHome() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const t = useThemeColors();
  const scheme = useAppColorScheme();
  const { data: rows, isPending, isError, error, refetch, isRefetching } = useClientRequirements();
  const { data: appCounts } = useClientApplicationCounts();
  const { data: dash } = useDashboard();
  const { notifUnread, applicationNotifUnread } = useUnreadBadgeCounts();
  const notifBadge = notifUnread > 99 ? '99+' : String(notifUnread);
  const appBadge = applicationNotifUnread > 99 ? '99+' : String(applicationNotifUnread);

  const counts =
    dash && dash.role === 'client'
      ? dash.counts
      : { openRequirements: 0, activeMatches: 0 };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Gig>) => {
      const pendingApps = appCounts?.[item.id] ?? 0;
      return (
      <Pressable
        onPress={() => router.push(`/client/requirement/${item.id}` as Href)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: t.surface,
            borderColor: t.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <View style={styles.cardTop}>
          <AppText variant="subtitle" numberOfLines={2} style={{ flex: 1 }}>
            {item.title}
          </AppText>
          <View style={styles.cardTopRight}>
            {pendingApps > 0 ? (
              <View style={styles.appBadge} accessibilityLabel={`${pendingApps} new applications`}>
                <AppText variant="caption" style={styles.appBadgeText}>
                  {pendingApps} new
                </AppText>
              </View>
            ) : null}
            <AppText variant="caption" style={styles.budget}>
              {formatGigBudget(item.budget, item.currency)}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" muted numberOfLines={1}>
          {(item.skills ?? []).slice(0, 4).join(' · ')}
          {(item.skills ?? []).length > 4 ? '…' : ''}
        </AppText>
        <View style={styles.cardFoot}>
          <AppText variant="caption" muted>
            {item.postedAgo}
            {pendingApps > 0 ? ` · ${pendingApps} applicant${pendingApps === 1 ? '' : 's'} waiting` : ''}
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={t.muted} />
        </View>
      </Pressable>
      );
    },
    [router, t, appCounts],
  );

  const listSeparator = useCallback(() => <View style={{ height: space.md }} />, []);

  if (role !== 'client') {
    return <Redirect href="/(tabs)/discover" />;
  }

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      <View style={styles.pageRoot}>
        <View style={styles.layer}>
          <View style={styles.hero}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, styles.heroYellowFill]}
            />
            <HoneycombBackground scheme={scheme} surface="yellow" opacity={0.92} />
            <View style={styles.heroInner}>
              <View style={styles.topBar}>
                <AppText variant="caption" style={styles.logo}>
                  skillbee · client
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/notifications')}
                  hitSlop={12}
                  style={styles.iconBtn}>
                  <View>
                    <Ionicons name="notifications-outline" size={24} color="#0A0A0A" />
                    {notifUnread > 0 ? (
                      <View style={styles.notifDot} accessibilityLabel={`${notifUnread} unread notifications`}>
                        <AppText variant="caption" style={styles.notifText}>
                          {notifBadge}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </View>
              <AppText variant="hero" style={styles.heroTitle}>
                Your postings
              </AppText>
              <AppText variant="body" style={styles.heroSub}>
                {counts.openRequirements} open · {counts.activeMatches} active matches
              </AppText>
              {applicationNotifUnread > 0 ? (
                <View style={styles.appHintPill}>
                  <View style={styles.appHintDot} />
                  <AppText variant="caption" style={styles.appHintText}>
                    {appBadge} new application{applicationNotifUnread === 1 ? '' : 's'}
                  </AppText>
                </View>
              ) : null}
              <View style={{ height: space.md }} />
              <BeeButton title="Post a new task" onPress={() => router.push('/client/post')} />
            </View>
          </View>

          <View style={styles.listHeader}>
            <AppText variant="subtitle">Live feed</AppText>
            <Pressable onPress={() => void refetch()} hitSlop={10} disabled={isRefetching}>
              {isRefetching ? (
                <ActivityIndicator size="small" color={t.text} />
              ) : (
                <Ionicons name="refresh" size={22} color={t.text} />
              )}
            </Pressable>
          </View>

          <FlatList<Gig>
            data={rows ?? []}
            keyExtractor={(g) => g.id}
            renderItem={renderItem}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={8}
            removeClippedSubviews={Platform.OS === 'android'}
            contentContainerStyle={{
              paddingHorizontal: layout.screenPaddingX,
              paddingBottom: space.xxxl,
            }}
            ItemSeparatorComponent={listSeparator}
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            ListEmptyComponent={
              isPending ? (
                <View style={styles.empty}>
                  <ActivityIndicator color={t.text} />
                </View>
              ) : isError ? (
                <View style={styles.empty}>
                  <AppText variant="body" muted style={{ textAlign: 'center' }}>
                    {error instanceof Error && error.message
                      ? error.message
                      : 'Could not load postings. Pull to refresh or sign in again.'}
                  </AppText>
                  <View style={{ height: space.md }} />
                  <BeeButton title="Retry" variant="secondary" onPress={() => void refetch()} />
                </View>
              ) : (
                <View style={styles.empty}>
                  <AppText variant="body" muted style={{ textAlign: 'center' }}>
                    Nothing posted yet. Students see new tasks in real time once you publish.
                  </AppText>
                </View>
              )
            }
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageRoot: { flex: 1 },
  layer: { flex: 1, zIndex: 1 },
  hero: {
    position: 'relative',
    paddingBottom: space.lg,
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.black,
  },
  heroYellowFill: {
    backgroundColor: palette.yellow,
  },
  heroInner: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.sm,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 10,
    lineHeight: 12,
  },
  logo: {
    textTransform: 'lowercase',
    fontWeight: '900',
    letterSpacing: 1,
    color: '#0A0A0A',
  },
  heroTitle: {
    color: '#0A0A0A',
    letterSpacing: -0.6,
  },
  heroSub: {
    marginTop: space.sm,
    color: 'rgba(10,10,10,0.72)',
  },
  appHintPill: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.black,
    backgroundColor: '#fff',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  appHintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#E53935',
  },
  appHintText: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.xs,
  },
  cardTopRight: {
    alignItems: 'flex-end',
    gap: space.xs,
  },
  appBadge: {
    borderRadius: radii.pill,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: palette.black,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  appBadgeText: {
    fontWeight: '900',
    color: '#fff',
  },
  budget: {
    fontWeight: '800',
    color: palette.black,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  empty: {
    paddingTop: space.xl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
});
