import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { Gig } from '@/types';
import { fontSizes, fontWeights, radii, space } from '@/theme';

import { AppText } from '../ui/AppText';

export function GigStackCard({ gig }: { gig: Gig }) {
  const t = useThemeColors();
  return (
    <View style={styles.shadow}>
      <ImageBackground
        source={{ uri: gig.imageUrl }}
        style={styles.card}
        imageStyle={styles.image}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
          style={styles.gradient}>
          {gig.urgent ? (
            <View style={[styles.badge, { backgroundColor: t.primary }]}>
              <AppText variant="caption" style={styles.badgeText}>
                Urgent
              </AppText>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <AppText variant="caption" style={styles.meta}>
            {gig.postedAgo} ago · {gig.deadlineHours}h window
          </AppText>
          <AppText variant="title" style={styles.title}>
            {gig.title}
          </AppText>
          <AppText variant="body" style={styles.desc} numberOfLines={2}>
            {gig.description}
          </AppText>
          <View style={styles.row}>
            <AppText variant="subtitle" style={styles.price}>
              ${gig.budget}
            </AppText>
            <AppText variant="caption" style={styles.client}>
              {gig.clientName}
            </AppText>
          </View>
          <View style={styles.skills}>
            {gig.skills.slice(0, 3).map((s) => (
              <View key={s} style={styles.skillDot}>
                <AppText variant="caption" style={styles.skillText}>
                  {s}
                </AppText>
              </View>
            ))}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 12,
      },
    ]),
  },
  card: {
    height: '100%',
    width: '100%',
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  image: {
    borderRadius: radii.xxl,
  },
  gradient: {
    flex: 1,
    padding: space.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
  },
  badgeText: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: space.xs,
  },
  title: {
    color: '#fff',
    marginBottom: space.sm,
  },
  desc: {
    color: 'rgba(255,255,255,0.92)',
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  price: {
    color: '#fff',
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.heavy,
  },
  client: {
    color: 'rgba(255,255,255,0.9)',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  skillDot: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
  },
  skillText: {
    color: '#fff',
    fontWeight: '700',
  },
});
