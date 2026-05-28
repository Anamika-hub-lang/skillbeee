import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useInboxThreads } from '@/hooks/useInboxThreads';
import { markChatRead } from '@/lib/markChatRead';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { InboxThread } from '@/types';
import { radii, space } from '@/theme';

export default function Inbox() {
  const router = useRouter();
  const qc = useQueryClient();
  const t = useThemeColors();
  const { data: threads, isPending, isFetching, isFetched, isError, error, refetch } = useInboxThreads();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const list = threads ?? [];
  const loading = isFetching && list.length === 0;
  const subtitle = isError
    ? (error instanceof Error ? error.message : 'Could not load chats.')
    : loading
      ? 'Syncing threads…'
      : 'Live from your SkillBee server';

  const renderThread = useCallback(
    ({ item }: ListRenderItemInfo<InboxThread>) => (
      <Pressable
        onPress={() => {
          if (item.unread > 0) {
            void markChatRead(qc, item.id);
          }
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              peerName: item.name,
              peerPhotoUrl: item.peerPhotoUrl ?? '',
            },
          });
        }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.row,
          {
            backgroundColor: t.surface,
            borderColor: t.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        {item.peerPhotoUrl ? (
          <Image
            source={{ uri: item.peerPhotoUrl }}
            style={styles.avatarImg}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: t.primary }]}>
            <AppText variant="subtitle" style={{ color: '#0A0A0A' }}>
              {item.name[0]?.toUpperCase() ?? '?'}
            </AppText>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.topLine}>
            <AppText variant="subtitle">{item.name}</AppText>
            <AppText variant="caption" muted>
              {item.time}
            </AppText>
          </View>
          <AppText variant="caption" muted numberOfLines={1}>
            {item.last}
          </AppText>
        </View>
        {item.unread ? (
          <View style={styles.badge}>
            <AppText variant="caption" style={{ color: '#fff', fontWeight: '800' }}>
              {item.unread}
            </AppText>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={t.muted} />
        )}
      </Pressable>
    ),
    [qc, router, t],
  );

  const threadSeparator = useCallback(() => <View style={{ height: space.md }} />, []);

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="title">Chats</AppText>
        <AppText variant="caption" muted numberOfLines={3}>
          {subtitle}
        </AppText>
        {isError ? (
          <View style={{ marginTop: space.md }}>
            <BeeButton title="Retry" variant="secondary" onPress={() => void refetch()} />
          </View>
        ) : null}
      </View>
      <FlatList<InboxThread>
        data={list}
        keyExtractor={(i: InboxThread) => i.id}
        initialNumToRender={12}
        windowSize={6}
        maxToRenderPerBatch={10}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        ItemSeparatorComponent={threadSeparator}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isPending} onRefresh={() => void refetch()} />
        }
        ListEmptyComponent={
          isError ? null : isFetched && list.length === 0 ? (
            <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
              <AppText variant="caption" muted center>
                No chats yet — apply to a gig or post one as a client. New messages refresh here and in
                real time when Supabase Realtime is enabled.
              </AppText>
            </View>
          ) : loading ? (
            <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
              <ActivityIndicator color={t.text} />
            </View>
          ) : null
        }
        renderItem={renderThread}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    marginRight: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    marginLeft: space.sm,
  },
});
