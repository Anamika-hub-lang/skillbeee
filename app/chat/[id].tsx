import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeCard } from '@/components/ui/BeeCard';
import { formatShortTime } from '@/lib/formatTime';
import { isUuid } from '@/lib/isUuid';
import { markChatRead } from '@/lib/markChatRead';
import { supabase } from '@/lib/supabase';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { useSendThreadMessage, useThreadMessages } from '@/hooks/useThreadMessages';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, layout, palette, radii, space } from '@/theme';

type Msg = { id: string; from: 'me' | 'them'; text: string; time: string };

function firstParam(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0] ?? '';
  return '';
}

export default function Chat() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    peerName?: string | string[];
    peerPhotoUrl?: string | string[];
  }>();
  const id = firstParam(params.id);
  const peerName = firstParam(params.peerName).trim();
  const peerPhotoUrl = firstParam(params.peerPhotoUrl).trim();
  const router = useRouter();
  const t = useThemeColors();
  const scheme = useAppColorScheme();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<Msg[]>([]);

  const apiThread = isUuid(id);
  const { data: rows, isFetching } = useThreadMessages(apiThread ? id : undefined);
  const sendMut = useSendThreadMessage(apiThread ? id : undefined);

  useChatRealtime(apiThread ? id : undefined);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setMyId(data.session?.user.id ?? null);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!apiThread) return undefined;
      void markChatRead(qc, id);
      return undefined;
    }, [apiThread, id, qc]),
  );

  const items = useMemo(() => {
    if (apiThread && rows && myId) {
      return rows.map(
        (m): Msg => ({
          id: m.id,
          from: m.senderId === myId ? 'me' : 'them',
          text: m.body,
          time: formatShortTime(m.createdAt),
        }),
      );
    }
    return localItems;
  }, [apiThread, rows, myId, localItems]);

  const composerBottom = Math.max(insets.bottom, 10) + 10;
  const composerPadBottom = 96 + Math.max(insets.bottom, 12);

  const renderBubble = useCallback(
    ({ item }: ListRenderItemInfo<Msg>) => (
      <View
        style={[
          styles.bubble,
          item.from === 'me' ? styles.me : styles.them,
          {
            backgroundColor: item.from === 'me' ? t.primary : t.surface,
            alignSelf: item.from === 'me' ? 'flex-end' : 'flex-start',
            borderColor: palette.black,
          },
        ]}>
        <AppText variant="body" style={{ color: item.from === 'me' ? '#0A0A0A' : t.text }}>
          {item.text}
        </AppText>
      </View>
    ),
    [t],
  );

  const deadline = useMemo(
    () =>
      new Date(Date.now() + 1000 * 60 * 60 * 5).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );
  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (apiThread) {
      sendMut.mutate(text, {
        onSuccess: () => setInput(''),
        onError: (e: Error) => Alert.alert('Message', e.message),
      });
      return;
    }
    setLocalItems((prev) => [...prev, { id: String(Date.now()), from: 'me', text, time: 'now' }]);
    setInput('');
  };

  const attach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
    if (res.canceled) return;
    Alert.alert('Attachment', `Queued: ${res.assets[0].name} (upload via Supabase Storage)`);
  };

  const voice = () => {
    Alert.alert(
      'Voice note',
      'Use expo-audio + Supabase Storage in production. Mic permission flow goes here.',
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: t.background }]}>
        <HoneycombBackground
          scheme={scheme}
          surface={scheme === 'light' ? 'cream' : 'default'}
          opacity={1}
        />
        <View style={styles.layer}>
          <View style={[styles.top, { borderBottomColor: t.border }]}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={t.text} />
            </Pressable>
            {peerPhotoUrl ? (
              <Image
                source={{ uri: peerPhotoUrl }}
                style={styles.headerAvatar}
                contentFit="cover"
                transition={120}
              />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: t.primary }]}>
                <AppText variant="subtitle" style={{ color: '#0A0A0A' }}>
                  {(peerName || id || '?')[0]?.toUpperCase() ?? '?'}
                </AppText>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: space.md }}>
              <AppText variant="subtitle" numberOfLines={1}>
                {peerName || 'Chat'}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {apiThread && isFetching ? 'syncing… · ' : ''}deadline today · {deadline}
              </AppText>
            </View>
            <Pressable onPress={() => router.push(`/task/${id}`)} hitSlop={12}>
              <Ionicons name="timer-outline" size={22} color={t.text} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}>
            <FlatList<Msg>
              style={{ flex: 1 }}
              data={items}
              keyExtractor={(m: Msg) => m.id}
              initialNumToRender={14}
              windowSize={7}
              maxToRenderPerBatch={12}
              removeClippedSubviews={Platform.OS === 'android'}
              contentContainerStyle={{
                paddingHorizontal: layout.screenPaddingX,
                paddingTop: space.md,
                paddingBottom: composerPadBottom,
              }}
              renderItem={renderBubble}
            />

            <BeeCard
              style={[styles.composer, { bottom: composerBottom }]}
              tone="default"
              padded={false}>
              <View style={styles.row}>
                <Pressable onPress={attach} hitSlop={10} style={styles.attach}>
                  <Ionicons name="attach-outline" size={22} color={t.text} />
                </Pressable>
                <Pressable onPress={voice} hitSlop={10} style={styles.attach}>
                  <Ionicons name="mic-outline" size={22} color={t.text} />
                </Pressable>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="say something nice…"
                  placeholderTextColor={t.muted}
                  style={[styles.input, { color: t.text }]}
                />
                <Pressable
                  onPress={send}
                  hitSlop={10}
                  style={{ marginLeft: space.sm }}
                  disabled={sendMut.isPending}>
                  <Ionicons name="send" size={22} color={t.text} />
                </Pressable>
              </View>
            </BeeCard>
          </KeyboardAvoidingView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: { flex: 1, zIndex: 1 },
  top: {
    paddingTop: 54,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginLeft: space.sm,
    borderWidth: 2,
    borderColor: palette.black,
  },
  headerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radii.xl,
    borderWidth: 2,
    marginBottom: space.sm,
  },
  me: {},
  them: {},
  composer: {
    position: 'absolute',
    left: layout.screenPaddingX,
    right: layout.screenPaddingX,
    padding: space.sm,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.black,
    zIndex: 20,
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attach: {
    marginRight: space.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
  },
});
