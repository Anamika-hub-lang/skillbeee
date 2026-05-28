import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { useAcceptApplication } from '@/hooks/useAcceptApplication';
import { useRequirementApplications, type ApplicationRow } from '@/hooks/useRequirementApplications';
import { useRequirementGig } from '@/hooks/useRequirementGig';
import { useThemeColors } from '@/hooks/useThemeColors';
import { isImageSampleUrl, sampleDisplayLabel } from '@/lib/applicationSampleUrls';
import { formatGigBudget } from '@/lib/formatMoney';
import { isUuid } from '@/lib/isUuid';
import { space } from '@/theme';

export default function ClientRequirementDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const rid = id && isUuid(id) ? id : undefined;
  const router = useRouter();
  const t = useThemeColors();
  const { data: gig, isPending: gigLoading } = useRequirementGig(rid);
  const { data: apps, isPending: appsLoading } = useRequirementApplications(rid);
  const accept = useAcceptApplication(rid);

  const onAccept = (applicationId: string) => {
    Alert.alert('Accept student', 'They will be matched and others rejected for this task.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () =>
          accept.mutate(applicationId, {
            onSuccess: (_data, appId) => {
              const row = apps?.find((a) => a.id === appId);
              const peerName = row?.student.profile?.displayName?.trim() || 'Student';
              const peerPhotoUrl = row?.student.profile?.photoUrl ?? '';
              Alert.alert('Matched', 'Open chat to coordinate.', [
                {
                  text: 'OK',
                  onPress: () =>
                    router.replace({
                      pathname: '/chat/[id]',
                      params: { id: rid!, peerName, peerPhotoUrl },
                    }),
                },
              ]);
            },
            onError: (e: Error) => Alert.alert('Error', e.message),
          }),
      },
    ]);
  };

  if (!rid) {
    return (
      <Screen scroll>
        <AppText variant="title">Invalid task</AppText>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </Pressable>
          <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>
            Task
          </AppText>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/payment/checkout',
                params: {
                  requirementId: rid,
                  title: gig?.title ?? 'Task payment',
                  currency: gig?.currency ?? 'INR',
                },
              })
            }
            hitSlop={12}>
            <Ionicons name="card-outline" size={24} color={t.text} />
          </Pressable>
        </View>

        {gigLoading ? (
          <ActivityIndicator style={{ marginTop: space.lg }} color={t.text} />
        ) : gig ? (
          <BeeCard tone="yellow">
            <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
              BUDGET
            </AppText>
            <AppText variant="hero" style={{ color: '#0A0A0A', marginTop: space.sm }}>
              {formatGigBudget(gig.budget, gig.currency)}
            </AppText>
            <AppText variant="caption" style={{ color: 'rgba(10,10,10,0.65)', marginTop: space.xs }}>
              {gig.deadlineHours}h deadline · posted {gig.postedAgo}
            </AppText>
            <View style={{ height: space.md }} />
            <AppText variant="title" style={{ color: '#111' }}>
              {gig.title}
            </AppText>
            <AppText variant="body" style={{ color: 'rgba(10,10,10,0.82)', marginTop: space.sm }}>
              {gig.description}
            </AppText>
          </BeeCard>
        ) : null}

        <View style={{ height: space.lg }} />

        <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
          Applications
        </AppText>
        {appsLoading ? (
          <ActivityIndicator color={t.text} />
        ) : (
          <>
            {(apps ?? []).map((a: ApplicationRow) => (
              <BeeCard key={a.id} style={{ marginBottom: space.md }}>
                <AppText variant="subtitle">
                  {a.student.profile?.displayName?.trim() || 'Student'}
                </AppText>
                <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                  {a.status}
                </AppText>
                {a.coverNote ? (
                  <AppText variant="body" muted style={{ marginTop: space.sm }}>
                    {a.coverNote}
                  </AppText>
                ) : null}
                {(a.sampleUrls?.length ?? 0) > 0 ? (
                  <View style={{ marginTop: space.md }}>
                    <AppText variant="caption" style={{ fontWeight: '800', marginBottom: space.xs }}>
                      Work samples ({a.sampleUrls.length})
                    </AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {a.sampleUrls.map((uri) => (
                        <Pressable
                          key={uri}
                          onPress={() => void Linking.openURL(uri)}
                          style={styles.sampleThumb}>
                          {isImageSampleUrl(uri) ? (
                            <Image source={{ uri }} style={styles.sampleImg} contentFit="cover" />
                          ) : (
                            <View style={[styles.sampleImg, styles.sampleFile]}>
                              <Ionicons name="document-text-outline" size={28} color="#0A0A0A" />
                              <AppText variant="caption" numberOfLines={2} style={styles.sampleFileLabel}>
                                {sampleDisplayLabel(uri)}
                              </AppText>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
                {a.status === 'pending' ? (
                  <View style={{ marginTop: space.md }}>
                    <BeeButton
                      title="Accept"
                      loading={accept.isPending}
                      onPress={() => onAccept(a.id)}
                    />
                  </View>
                ) : null}
              </BeeCard>
            ))}
            {(apps?.length ?? 0) === 0 && !appsLoading ? (
              <AppText variant="body" muted>
                No applications yet — students see this post in real time on their Home feed.
              </AppText>
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
    paddingHorizontal: 0,
  },
  sampleThumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: space.sm,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  sampleImg: {
    width: '100%',
    height: '100%',
  },
  sampleFile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    backgroundColor: '#FFF8DC',
  },
  sampleFileLabel: {
    marginTop: space.xs,
    textAlign: 'center',
    fontWeight: '700',
    color: '#0A0A0A',
  },
});
