import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { ApplySamplesModal } from '@/components/gigs/ApplySamplesModal';
import { GigSwipeDeck } from '@/components/gigs/GigSwipeDeck';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { useGigs } from '@/hooks/useGigs';
import { filterGigsByQuery, gigSearchResultLabel } from '@/lib/filterGigsByQuery';
import { useSubmitApplication } from '@/hooks/useSubmitApplication';
import { useSessionStore } from '@/stores/session';
import type { Gig } from '@/types';
import { layout, palette, radii, space } from '@/theme';
import { useUnreadBadgeCounts } from '@/hooks/useUnreadBadgeCounts';

export default function Discover() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const scheme = useAppColorScheme();
  const t = useThemeColors();
  const { notifUnread, messageNotifUnread } = useUnreadBadgeCounts();
  const notifBadge = notifUnread > 99 ? '99+' : String(notifUnread);
  const chatBadge = messageNotifUnread > 99 ? '99+' : String(messageNotifUnread);
  const { data, isLoading, isError, error, refetch } = useGigs();
  const applyMut = useSubmitApplication();
  const [query, setQuery] = useState('');
  const [applyTarget, setApplyTarget] = useState<Gig | null>(null);

  const gigs = useMemo(() => filterGigsByQuery(data ?? [], query), [data, query]);
  const searchHint = useMemo(() => gigSearchResultLabel(gigs.length, query), [gigs.length, query]);

  const onAccept = (gig: Gig) => {
    setApplyTarget(gig);
  };

  const onSkip = (_gig: Gig) => {
    // deck loops internally
  };

  if (role === 'client') {
    return <Redirect href="/(tabs)/client-home" />;
  }

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      <View style={styles.pageRoot}>
        <View style={styles.pageLayer}>
          <View style={styles.column}>
            <View style={styles.hero}>
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.heroYellowFill]}
              />
              <HoneycombBackground scheme={scheme} surface="yellow" opacity={0.92} />
              <View style={styles.heroInner}>
                <View style={styles.topBar}>
                  <View style={styles.iconBtn} />
                  <AppText variant="caption" style={styles.logo}>
                    skillbee
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
                <SearchField
                  compact
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search title, skills, client…"
                  outlineColor={palette.yellow}
                  outlineWidth={2}
                />
                {searchHint ? (
                  <AppText variant="caption" style={styles.searchHint} numberOfLines={1}>
                    {searchHint}
                  </AppText>
                ) : null}
                {messageNotifUnread > 0 ? (
                  <View style={styles.chatHintPill}>
                    <View style={styles.chatHintDot} />
                    <AppText variant="caption" style={styles.chatHintText}>
                      {chatBadge} new chat{messageNotifUnread === 1 ? '' : 's'}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.sheet}>
              {isLoading ? (
                <View
                  style={{
                    flex: 1,
                    minHeight: 360,
                    paddingTop: space.xl,
                    paddingHorizontal: layout.screenPaddingX,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ActivityIndicator size="large" color={t.text} />
                  <AppText variant="body" muted center style={{ marginTop: space.md }}>
                    Loading your feed…
                  </AppText>
                </View>
              ) : isError ? (
                <View style={{ paddingHorizontal: layout.screenPaddingX, paddingTop: space.lg }}>
                  <AppText variant="body" muted>
                    {error instanceof Error ? error.message : 'Could not load gigs.'}
                  </AppText>
                  <View style={{ height: space.md }} />
                  <BeeButton title="Retry" variant="secondary" onPress={() => void refetch()} />
                </View>
              ) : (
                <View style={styles.deckWrap}>
                  <GigSwipeDeck
                    gigs={gigs}
                    hasActiveSearch={query.trim().length > 0}
                    onAccept={onAccept}
                    onSkip={onSkip}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {applyTarget ? (
        <ApplySamplesModal
          visible
          gigTitle={applyTarget.title}
          onClose={() => setApplyTarget(null)}
          onSubmit={async (sampleUrls) => {
            const gid = applyTarget.id;
            await applyMut.mutateAsync({
              requirementId: gid,
              coverNote: null,
              sampleUrls,
            });
            router.push({ pathname: '/match', params: { gigId: gid } });
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
  },
  pageLayer: {
    flex: 1,
    zIndex: 1,
  },
  column: {
    flex: 1,
  },
  hero: {
    position: 'relative',
    paddingBottom: space.md,
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 4,
    borderWidth: 2,
    borderColor: palette.black,
  },
  heroYellowFill: {
    backgroundColor: palette.yellow,
  },
  heroInner: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  iconBtn: {
    minWidth: 40,
    minHeight: 40,
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
    letterSpacing: 2,
    color: '#0A0A0A',
  },
  searchHint: {
    marginTop: space.xs,
    fontWeight: '700',
    color: 'rgba(10,10,10,0.62)',
    textAlign: 'center',
  },
  chatHintPill: {
    marginTop: space.xs,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.black,
    backgroundColor: '#fff',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  chatHintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#E53935',
  },
  chatHintText: {
    fontWeight: '800',
    color: '#0A0A0A',
  },
  sheet: {
    flex: 1,
    minHeight: 0,
    paddingTop: space.sm,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 0,
  },
  deckWrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
});
