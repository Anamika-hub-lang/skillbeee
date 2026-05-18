import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useThemeColors } from '@/hooks/useThemeColors';
import { radii, space } from '@/theme';

const THREADS = [
  { id: 't1', name: 'Maya', last: 'Can you start tonight?', time: '2m', unread: 2 },
  { id: 't2', name: 'Jordan', last: 'Deck looks 🔥', time: '1h', unread: 0 },
  { id: 't3', name: 'Alex', last: 'Sending b-roll now', time: 'Yesterday', unread: 1 },
];

export default function Inbox() {
  const router = useRouter();
  const t = useThemeColors();

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="title">Chats</AppText>
        <AppText variant="caption" muted>
          realtime-ready via Supabase
        </AppText>
      </View>
      <FlatList
        data={THREADS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <View style={[styles.avatar, { backgroundColor: t.primary }]}>
              <AppText variant="subtitle" style={{ color: '#0A0A0A' }}>
                {item.name[0]}
              </AppText>
            </View>
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
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: space.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
});
