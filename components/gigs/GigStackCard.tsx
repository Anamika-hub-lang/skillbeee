import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gigCardImageUri } from '@/lib/gigCardPlaceholders';
import { formatGigBudget } from '@/lib/formatMoney';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Gig } from '@/types';
import { fontSizes, fontWeights, palette, radii, space } from '@/theme';

import { AppText } from '../ui/AppText';

const textShadowSoft = {
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

const textShadowStrong = {
  textShadowColor: 'rgba(0,0,0,0.9)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 10,
};

/**
 * Swipe card: full-bleed image + black gradient scrim (readable type), yellow frame.
 */
export function GigStackCard({ gig }: { gig: Gig }) {
  const t = useThemeColors();
  const uri = gigCardImageUri(gig);
  const budgetLabel = formatGigBudget(gig.budget, gig.currency);

  return (
    <View style={styles.shadow}>
      <ImageBackground source={{ uri }} style={styles.card} imageStyle={styles.imageRadius}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.52)',
            'rgba(0,0,0,0.78)',
            'rgba(0,0,0,0.94)',
          ]}
          locations={[0, 0.28, 0.52, 1]}
          style={styles.gradient}>
          <View style={styles.flexSpacer} />
          {gig.urgent ? (
            <View style={[styles.badge, { backgroundColor: t.primary }]}>
              <AppText variant="caption" style={styles.badgeText}>
                Urgent
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" style={styles.meta}>
            {gig.postedAgo} ago · {gig.deadlineHours}h window
          </AppText>
          <AppText variant="title" style={styles.title} numberOfLines={2}>
            {gig.title}
          </AppText>
          <AppText variant="body" style={styles.desc} numberOfLines={4}>
            {gig.description}
          </AppText>
          <View style={styles.priceRow}>
            <AppText variant="title" style={styles.price}>
              {budgetLabel}
            </AppText>
            <AppText variant="caption" style={styles.client}>
              {gig.clientName}
            </AppText>
          </View>
          <View style={styles.skills}>
            {(gig.skills ?? []).slice(0, 4).map((s) => (
              <View key={s} style={styles.skillPill}>
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
    width: '100%',
    height: '100%',
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: palette.yellow,
    ...StyleSheet.flatten([
      {
        shadowColor: palette.yellow,
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 14,
      },
    ]),
  },
  card: {
    flex: 1,
    width: '100%',
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  imageRadius: {
    borderRadius: radii.xxl,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    paddingTop: space.md,
    justifyContent: 'flex-end',
  },
  flexSpacer: {
    flex: 1,
    minHeight: space.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
    marginBottom: space.sm,
  },
  badgeText: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  meta: {
    color: '#FFF4C8',
    marginBottom: space.xs,
    fontWeight: '800',
    fontSize: fontSizes.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    ...textShadowSoft,
  },
  title: {
    color: '#FFFFFF',
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.heavy,
    marginBottom: space.xs,
    letterSpacing: -0.4,
    lineHeight: 32,
    ...textShadowStrong,
  },
  desc: {
    color: 'rgba(255,255,255,0.96)',
    lineHeight: 24,
    marginBottom: space.md,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    ...textShadowSoft,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  price: {
    color: palette.yellow,
    fontSize: 30,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.8,
    ...textShadowStrong,
  },
  client: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSizes.sm,
    marginBottom: 4,
    ...textShadowSoft,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  skillPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,41,0.75)',
  },
  skillText: {
    color: '#FFF9E6',
    fontWeight: '800',
    fontSize: fontSizes.sm,
    ...textShadowSoft,
  },
});
