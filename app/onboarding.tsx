import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkillBeeLogo } from '@/components/brand/SkillBeeLogo';
import { useSessionStore } from '@/stores/session';
import { fontSizes, fontWeights, layout, palette, radii, space } from '@/theme';

type Slide = {
  key: string;
  image: number;
  titleLine1?: string;
  titleHighlight?: string;
  title?: string;
  body: string;
  bodyHighlight?: string;
  final?: boolean;
};

const SLIDES: Slide[] = [
  {
    key: '1',
    image: require('@/assets/images/onboarding-1.png'),
    titleLine1: 'Turn your skills',
    titleHighlight: 'into cash.',
    body: 'Quick tasks in video editing, coding, and design.',
  },
  {
    key: '2',
    image: require('@/assets/images/onboarding-2.png'),
    title: 'Instant buzz matching.',
    body: 'Set your status to Active and get matched with local clients who need your skills right now. No more waiting, just buzzing.',
    bodyHighlight: 'Active',
  },
  {
    key: '3',
    image: require('@/assets/images/onboarding-3.png'),
    title: 'Flex your schedule.',
    body: 'Earn in the Honey Pot during weekends or between your classes. Work when you want.',
    bodyHighlight: 'Honey Pot',
    final: true,
  },
];

const CREAM = '#FAF7EF';
const OLIVE = '#3D3428';
const ART_BG = '#F5F2EA';

function HighlightedBody({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) {
    return <Text style={styles.body}>{text}</Text>;
  }
  const [before, after] = text.split(highlight);
  return (
    <Text style={styles.body}>
      {before}
      <Text style={styles.bodyHighlight}>{highlight}</Text>
      {after}
    </Text>
  );
}

function SlideCopy({ item }: { item: Slide }) {
  return (
    <View style={styles.copy}>
      {item.titleLine1 ? (
        <View style={styles.titleStack}>
          <Text style={styles.title}>{item.titleLine1}</Text>
          {item.titleHighlight ? (
            <View style={styles.titlePill}>
              <Text style={styles.titlePillText}>{item.titleHighlight}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.title}>{item.title}</Text>
      )}
      <HighlightedBody text={item.body} highlight={item.bodyHighlight} />
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const complete = useSessionStore((s) => s.completeOnboarding);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isFinal = page === SLIDES.length - 1;
  const footerHeight = isFinal ? 196 : 148;
  const headerHeight = 56;
  const slideHeight =
    screenHeight - insets.top - insets.bottom - headerHeight - footerHeight;
  const artWidth = screenWidth - layout.screenPaddingX * 2;
  const artHeight = Math.min(artWidth * 0.72, 280);

  const finish = () => {
    complete();
    router.replace('/auth/login');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / screenWidth));
  };

  const goNext = () => {
    if (page < SLIDES.length - 1) {
      listRef.current?.scrollToOffset({ offset: (page + 1) * screenWidth, animated: true });
      return;
    }
    finish();
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <ScrollView
      style={{ width: screenWidth, maxHeight: slideHeight }}
      contentContainerStyle={styles.slideScroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      bounces={false}>
      <View style={[styles.slide, { width: screenWidth }]}>
        <View style={[styles.artFrame, { width: artWidth, height: artHeight }]}>
          <Image source={item.image} style={styles.art} contentFit="contain" />
        </View>
        <SlideCopy item={item} />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        {!isFinal ? <SkillBeeLogo size="header" /> : <View style={styles.headerSpacer} />}
        <Pressable
          onPress={finish}
          hitSlop={12}
          style={[styles.skipBtn, isFinal && styles.skipBtnFinal]}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding">
          <Text style={[styles.skipText, isFinal && styles.skipTextFinal]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList<Slide>
        ref={listRef}
        data={SLIDES}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ maxHeight: slideHeight }}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        nestedScrollEnabled
      />

      <View style={styles.bottom}>
        {isFinal ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Step 3 of 3</Text>
              <Text style={styles.progressLabel}>Setup Complete</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                i === page && (isFinal ? styles.dotActiveFinal : styles.dotActive),
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.nextBtn} onPress={goNext} accessibilityRole="button">
            <Text style={styles.nextBtnText}>{isFinal ? 'Get Started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={22} color={OLIVE} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    minHeight: 56,
  },
  headerSpacer: {
    width: 132,
  },
  skipBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  skipBtnFinal: {
    backgroundColor: 'rgba(10,10,10,0.06)',
    borderRadius: radii.pill,
  },
  skipText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: palette.gray600,
  },
  skipTextFinal: {
    color: palette.gray500,
    fontWeight: fontWeights.medium,
  },
  slideScroll: {
    paddingBottom: space.lg,
  },
  slide: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.xs,
    alignItems: 'center',
  },
  artFrame: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: ART_BG,
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      },
    ]),
  },
  art: {
    width: '100%',
    height: '100%',
  },
  copy: {
    marginTop: space.lg,
    paddingHorizontal: space.xs,
    width: '100%',
  },
  titleStack: {
    marginBottom: space.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: fontWeights.heavy,
    color: palette.black,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: space.xs,
  },
  titlePill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.black,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    marginTop: space.xs,
  },
  titlePillText: {
    fontSize: 30,
    fontWeight: fontWeights.heavy,
    color: palette.yellow,
    letterSpacing: -0.6,
  },
  body: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: 'rgba(10,10,10,0.72)',
    fontWeight: fontWeights.regular,
  },
  bodyHighlight: {
    fontWeight: fontWeights.heavy,
    color: palette.yellowDark,
  },
  bottom: {
    marginTop: 'auto',
  },
  progressWrap: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: space.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(10,10,10,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.yellow,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  progressLabel: {
    fontSize: fontSizes.xs,
    color: palette.gray500,
    fontWeight: fontWeights.medium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(10,10,10,0.15)',
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.yellow,
  },
  dotActiveFinal: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: OLIVE,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: space.md,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: palette.yellow,
    borderRadius: radii.pill,
    minHeight: 56,
    borderWidth: 2,
    borderColor: palette.black,
  },
  nextBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.heavy,
    color: OLIVE,
  },
});
