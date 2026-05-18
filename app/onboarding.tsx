import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { useSessionStore } from '@/stores/session';
import { palette, radii, space } from '@/theme';

type Slide = { key: string; title: string; body: string; emoji: string };

const SLIDES: Slide[] = [
  {
    key: '1',
    title: 'Swipe quick gigs',
    body: '1–4 hour wins. no corporate energy.',
    emoji: '⚡️',
  },
  {
    key: '2',
    title: 'Match. chat. ship.',
    body: 'instant convos with clients who respect your time.',
    emoji: '💬',
  },
  {
    key: '3',
    title: 'Get paid like a founder',
    body: 'track milestones, releases, and weekly earnings in one flow.',
    emoji: '💸',
  },
];

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const router = useRouter();
  const complete = useSessionStore((s) => s.completeOnboarding);
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / width));
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.heroCard}>
        <AppText style={styles.emoji}>{item.emoji}</AppText>
        <AppText variant="hero" style={styles.title}>
          {item.title}
        </AppText>
        <AppText variant="body" muted center style={styles.body}>
          {item.body}
        </AppText>
      </View>
    </View>
  );

  return (
    <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.topRow}>
        <AppText variant="caption" style={{ letterSpacing: 4, fontWeight: '800' }}>
          SKILLBEE
        </AppText>
        <Ionicons name="sparkles" size={22} color={palette.black} />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              { opacity: i === page ? 1 : 0.35, transform: [{ scale: i === page ? 1.1 : 1 }] },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <BeeButton
          title={page < SLIDES.length - 1 ? 'Next' : "Let's go"}
          onPress={() => {
            if (page < SLIDES.length - 1) {
              listRef.current?.scrollToOffset({
                offset: (page + 1) * width,
                animated: true,
              });
            } else {
              complete();
              router.replace('/auth/login');
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  slide: {
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: palette.white,
    borderRadius: radii.xxl,
    paddingVertical: space.xxxl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
        elevation: 8,
      },
    ]),
  },
  emoji: {
    fontSize: 72,
    marginBottom: space.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: space.md,
    letterSpacing: -0.6,
  },
  body: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: space.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.black,
    marginHorizontal: space.xs,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
});
