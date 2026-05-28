import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { markNotificationRead } from '@/lib/data/notifications';
import { notificationHref } from '@/lib/notificationRouting';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/stores/session';
import type { NotificationItem } from '@/types';
import { layout, space } from '@/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

function iconFor(type: NotificationItem['type']): IonName {
  switch (type) {
    case 'match':
      return 'heart';
    case 'payment':
      return 'wallet-outline';
    case 'message':
      return 'chatbubble-outline';
    case 'application':
      return 'person-add-outline';
    case 'requirement':
      return 'briefcase-outline';
    case 'system':
      return 'information-circle-outline';
    case 'task':
      return 'flash';
  }
}

export default function Notifications() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const t = useThemeColors();
  const scheme = useAppColorScheme();
  const qc = useQueryClient();
  const { data: items, isError, error, isFetching, isFetched, refetch } = useNotificationsList();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const list = items ?? [];
  const unreadCount = list.filter((n) => !n.read).length;

  const markRead = useMutation({
    mutationFn: async (nid: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      await markNotificationRead(nid, session.user.id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Pressable
        onPress={() => {
          if (!item.read) markRead.mutate(item.id);
          const href = notificationHref(item, role);
          if (href) router.push(href as never);
        }}>
        <BeeCard style={{ marginBottom: space.md }} padded>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: t.primary }]}>
              <Ionicons name={iconFor(item.type)} size={18} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle">{item.title}</AppText>
              <AppText variant="body" muted style={{ marginTop: space.xs }}>
                {item.body}
              </AppText>
            </View>
            {!item.read ? <View style={styles.dot} /> : null}
          </View>
        </BeeCard>
      </Pressable>
    ),
    [t, markRead.mutate, role, router],
  );

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
            <View style={{ flex: 1, marginLeft: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <AppText variant="title">Alerts</AppText>
                {!isError && unreadCount > 0 ? (
                  <View style={[styles.unreadPill, { marginLeft: space.sm }]}>
                    <View style={styles.unreadDot} />
                    <AppText variant="caption" style={styles.unreadPillText}>
                      {unreadCount} new
                    </AppText>
                  </View>
                ) : null}
              </View>
              {isError ? (
                <>
                  <AppText variant="caption" muted numberOfLines={5} style={{ marginTop: space.xs }}>
                    {error instanceof Error ? error.message : 'Could not load notifications.'}
                  </AppText>
                  <View style={{ marginTop: space.sm, alignSelf: 'flex-start' }}>
                    <BeeButton title="Retry" variant="secondary" onPress={() => void refetch()} />
                  </View>
                </>
              ) : null}
            </View>
          </View>
          <FlatList<NotificationItem>
            style={{ flex: 1 }}
            data={isError ? [] : list}
            keyExtractor={(i: NotificationItem) => i.id}
            extraData={markRead.isPending}
            initialNumToRender={12}
            windowSize={6}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && isFetched && !isError}
                onRefresh={() => void refetch()}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: layout.screenPaddingX,
              paddingBottom: space.xxxl,
              paddingTop: space.sm,
            }}
            ListEmptyComponent={
              isError ? null : isFetched && list.length === 0 ? (
                <AppText variant="caption" muted center style={{ marginTop: space.xl }}>
                  No notifications yet.
                </AppText>
              ) : isFetching ? (
                <View style={{ marginTop: space.xl, alignItems: 'center' }}>
                  <ActivityIndicator color={t.text} />
                </View>
              ) : null
            }
            renderItem={renderItem}
          />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4D8D',
    marginLeft: space.sm,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229,57,53,0.12)',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    marginRight: 6,
  },
  unreadPillText: {
    fontWeight: '800',
    color: '#0A0A0A',
  },
});