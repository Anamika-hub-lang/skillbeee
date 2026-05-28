import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { useRequirementGig } from '@/hooks/useRequirementGig';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatGigBudget } from '@/lib/formatMoney';
import { radii, space } from '@/theme';

export default function GigDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const idRaw = params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  const router = useRouter();
  const t = useThemeColors();
  const { data: gig, isPending, isError, error } = useRequirementGig(id);

  if (!id) {
    return (
      <Screen scroll>
        <AppText variant="title">Gig not found</AppText>
        <BeeButton title="Go back" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen scroll>
          <ActivityIndicator color={t.text} style={{ marginTop: space.xl }} />
        </Screen>
      </>
    );
  }

  if (isError || !gig) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen scroll>
          <AppText variant="title">Gig not found</AppText>
          <AppText variant="body" muted style={{ marginTop: space.sm }}>
            {error instanceof Error ? error.message : 'Could not load this task.'}
          </AppText>
          <BeeButton title="Go back" onPress={() => router.back()} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
          <AppText variant="caption" style={{ marginLeft: space.xs }}>
            back
          </AppText>
        </Pressable>

        <BeeCard tone="yellow">
          <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
            BUDGET
          </AppText>
          <AppText variant="hero" style={{ color: '#0A0A0A', marginTop: space.sm }}>
            {formatGigBudget(gig.budget, gig.currency)}
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(10,10,10,0.65)', marginTop: space.xs }}>
            deadline: {gig.deadlineHours}h · posted {gig.postedAgo} ago
          </AppText>
        </BeeCard>

        <View style={{ height: space.lg }} />

        <BeeCard>
          <AppText variant="title" style={{ marginBottom: space.sm }}>
            {gig.title}
          </AppText>
          <AppText variant="body" muted style={{ marginBottom: space.lg }}>
            {gig.description}
          </AppText>
          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
            Skills
          </AppText>
          <View style={styles.skills}>
            {gig.skills.map((s) => (
              <View key={s} style={[styles.pill, { borderColor: t.border }]}>
                <AppText variant="caption">{s}</AppText>
              </View>
            ))}
          </View>
        </BeeCard>

        <View style={{ height: space.lg }} />

        <BeeCard>
          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
            Client
          </AppText>
          <View style={styles.clientRow}>
            <View style={[styles.avatar, { backgroundColor: t.primary }]}>
              <AppText variant="subtitle" style={{ color: '#0A0A0A' }}>
                {gig.clientName[0]}
              </AppText>
            </View>
            <View>
              <AppText variant="subtitle">{gig.clientName}</AppText>
              <AppText variant="caption" muted>
                verified on SkillBee
              </AppText>
            </View>
          </View>
        </BeeCard>

        <View style={{ height: space.lg }} />

        <BeeCard>
          <AppText variant="subtitle" style={{ marginBottom: space.md }}>
            Timeline
          </AppText>
          {['Brief accepted', 'Work session', 'Review', 'Payment released'].map((step, idx) => (
            <View key={step} style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: idx === 0 ? t.primary : t.border }]} />
              <AppText variant="body">{step}</AppText>
            </View>
          ))}
        </BeeCard>

        <View style={{ height: space.xl }} />
        <BeeButton title="Back to feed" onPress={() => router.replace('/(tabs)/discover')} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: space.md,
  },
});
