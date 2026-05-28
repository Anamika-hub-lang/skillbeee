import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import {
  useStudentApplications,
  type StudentApplicationRow,
} from '@/hooks/useStudentApplications';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  applicationStatusLabel,
  buildStudentApplicationJourney,
  type ApplicationJourneyStep,
} from '@/lib/applicationJourney';
import { formatGigBudget } from '@/lib/formatMoney';
import { formatPostedAgo } from '@/lib/formatPostedAgo';
import { useSessionStore } from '@/stores/session';
import { palette, radii, space } from '@/theme';

function JourneyTimeline({ steps }: { steps: ApplicationJourneyStep[] }) {
  return (
    <View style={styles.timeline}>
      {steps.map((step, idx) => (
        <View key={step.key} style={styles.stepRow}>
          <View style={styles.stepTrack}>
            <View
              style={[
                styles.stepDot,
                step.state === 'done' && styles.stepDotDone,
                step.state === 'current' && styles.stepDotCurrent,
                step.state === 'failed' && styles.stepDotFailed,
              ]}>
              {step.state === 'done' ? (
                <Ionicons name="checkmark" size={12} color="#0A0A0A" />
              ) : step.state === 'failed' ? (
                <Ionicons name="close" size={12} color="#fff" />
              ) : null}
            </View>
            {idx < steps.length - 1 ? <View style={styles.stepLine} /> : null}
          </View>
          <AppText
            variant="caption"
            style={[
              styles.stepLabel,
              step.state === 'current' && styles.stepLabelCurrent,
              step.state === 'failed' && styles.stepLabelFailed,
            ]}>
            {step.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export default function MyApplications() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const t = useThemeColors();
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentApplications();

  const openRow = useCallback(
    (row: StudentApplicationRow) => {
      if (row.status === 'accepted') {
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: row.requirementId,
            peerName: row.requirement.clientName,
            peerPhotoUrl: '',
          },
        });
        return;
      }
      router.push(`/gig/${row.requirementId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<StudentApplicationRow>) => {
      const journey = buildStudentApplicationJourney({
        applicationStatus: item.status,
        requirementStatus: item.requirement.status,
        currentStep: item.requirement.currentStep,
        paymentCaptured: item.paymentCaptured,
      });

      return (
        <Pressable onPress={() => openRow(item)}>
          <BeeCard style={{ marginBottom: space.md }}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle" numberOfLines={2}>
                  {item.requirement.title}
                </AppText>
                <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                  {item.requirement.clientName} · {formatPostedAgo(item.createdAt)}
                </AppText>
              </View>
              <View style={styles.statusPill}>
                <AppText variant="caption" style={styles.statusPillText}>
                  {applicationStatusLabel(item.status)}
                </AppText>
              </View>
            </View>

            <AppText variant="body" style={{ marginTop: space.sm, fontWeight: '800' }}>
              {formatGigBudget(item.requirement.budget, item.requirement.currency)}
            </AppText>

            <View style={{ height: space.md }} />
            <AppText variant="caption" style={{ fontWeight: '800', marginBottom: space.sm }}>
              Your journey
            </AppText>
            <JourneyTimeline steps={journey} />

            {item.status === 'accepted' ? (
              <View style={{ marginTop: space.md }}>
                <BeeButton
                  title="Open chat"
                  variant="secondary"
                  onPress={() => openRow(item)}
                />
              </View>
            ) : null}
          </BeeCard>
        </Pressable>
      );
    },
    [openRow],
  );

  if (role === 'client') {
    return (
      <Screen scroll>
        <AppText variant="title">My applications</AppText>
        <AppText variant="body" muted style={{ marginTop: space.sm }}>
          This page is for student accounts.
        </AppText>
        <View style={{ height: space.md }} />
        <BeeButton title="Go to postings" onPress={() => router.replace('/(tabs)/client-home')} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </Pressable>
          <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>
            My applications
          </AppText>
        </View>
        <AppText variant="body" muted style={{ marginBottom: space.md }}>
          Track every application from submit to payment.
        </AppText>

        <FlatList<StudentApplicationRow>
          style={{ flex: 1 }}
          data={data ?? []}
          keyExtractor={(row) => row.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          contentContainerStyle={{ paddingBottom: space.xxxl }}
          ListEmptyComponent={
            isPending ? (
              <ActivityIndicator color={t.text} style={{ marginTop: space.xl }} />
            ) : isError ? (
              <View style={{ paddingTop: space.lg }}>
                <AppText variant="body" muted>
                  {error instanceof Error ? error.message : 'Could not load applications.'}
                </AppText>
                <View style={{ height: space.md }} />
                <BeeButton title="Retry" variant="secondary" onPress={() => void refetch()} />
              </View>
            ) : (
              <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
                <AppText variant="body" muted center>
                  No applications yet. Swipe right on a gig in Home to apply with your work samples.
                </AppText>
                <View style={{ height: space.md }} />
                <BeeButton title="Browse gigs" onPress={() => router.replace('/(tabs)/discover')} />
              </View>
            )
          }
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  statusPill: {
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.black,
    backgroundColor: palette.yellow,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    fontWeight: '800',
    color: '#0A0A0A',
  },
  timeline: {
    gap: space.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepTrack: {
    alignItems: 'center',
    width: 22,
    marginRight: space.sm,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.black,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: palette.yellow,
  },
  stepDotCurrent: {
    backgroundColor: palette.black,
  },
  stepDotFailed: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 14,
    backgroundColor: 'rgba(10,10,10,0.15)',
    marginTop: 2,
  },
  stepLabel: {
    flex: 1,
    color: 'rgba(10,10,10,0.55)',
    paddingTop: 1,
  },
  stepLabelCurrent: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  stepLabelFailed: {
    color: '#C62828',
    fontWeight: '800',
  },
});
