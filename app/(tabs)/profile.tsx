import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeeButton } from '@/components/ui/BeeButton';
import { Screen } from '@/components/ui/Screen';
import { SKILL_SUGGESTIONS } from '@/data/skills';
import { useAuthMe } from '@/hooks/useAuthMe';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { getDataErrorMessage } from '@/lib/errors';
import { pickProfileImage } from '@/lib/pickProfileImage';
import { canUseAppNotifications, enableAppNotifications, expoGoNotificationsMessage } from '@/lib/pushNotifications';
import { uploadProfilePhotoFromUri } from '@/lib/uploadProfilePhoto';
import { useNotificationPrefsStore } from '@/stores/notificationPrefs';
import { useSessionStore } from '@/stores/session';
import { fontSizes, fontWeights, layout, palette, radii, space } from '@/theme';

const L = {
  bg: palette.cream,
  surface: palette.white,
  text: palette.black,
  muted: palette.gray500,
  border: palette.yellow,
  inputBg: '#FFFCF3',
  placeholder: 'rgba(10,10,10,0.38)',
  empty: 'rgba(10,10,10,0.42)',
};

function LightText({
  children,
  variant = 'body',
  muted,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  muted?: boolean;
  style?: object;
  numberOfLines?: number;
}) {
  const sizes: Record<string, { fontSize: number; fontWeight: '400' | '500' | '700' | '800' | '900' }> = {
    hero: { fontSize: fontSizes.hero, fontWeight: fontWeights.heavy },
    title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold },
    subtitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
    body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular },
    caption: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
    label: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
  };
  const v = sizes[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: muted ? L.muted : L.text,
          fontSize: v.fontSize,
          fontWeight: v.fontWeight,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

function DetailBubble({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.detailBubble}>
      <LightText variant="label" muted style={styles.bubbleLabel}>
        {label}
      </LightText>
      {children}
    </View>
  );
}

function ProfileSkillPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.skillPill,
        selected ? styles.skillPillOn : styles.skillPillOff,
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}>
      <LightText variant="caption" style={{ color: selected ? palette.white : L.text, fontWeight: '700' }}>
        {label}
      </LightText>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const setStudentProfile = useSessionStore((s) => s.setStudentProfile);
  const signOut = useSessionStore((s) => s.signOut);
  const pushEnabled = useNotificationPrefsStore((s) => s.pushEnabled);
  const setPushEnabled = useNotificationPrefsStore((s) => s.setPushEnabled);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const stickyFooterPad = tabBarHeight > 0 ? tabBarHeight + space.sm : insets.bottom + space.lg;

  const [signingOut, setSigningOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);

  const { data: me, isPending: meLoading, refetch: refetchMe } = useAuthMe(Boolean(role));
  const updateMut = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [availableNow, setAvailableNow] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const syncFromServer = useCallback(() => {
    const p = me?.profile;
    if (!p) return;
    setDisplayName(p.displayName?.trim() ?? '');
    setBio(p.bio?.trim() ?? '');
    setPortfolioUrl(p.portfolioUrl?.trim() ?? '');
    setHourlyRate(String(p.hourlyRate ?? 0));
    setAvailabilityNote(p.availabilityNote?.trim() ?? '');
    setAvailableNow(Boolean(p.availableNow));
    setSkills(Array.isArray(p.skills) ? [...p.skills] : []);
    setPhotoUrl(p.photoUrl);
    setStudentProfile({
      displayName: p.displayName?.trim() ?? '',
      photoUri: p.photoUrl ?? undefined,
      skills: Array.isArray(p.skills) ? [...p.skills] : [],
      hourlyRate: p.hourlyRate ?? 0,
      availabilityNote: p.availabilityNote?.trim() ?? '',
      availableNow: Boolean(p.availableNow),
      bio: p.bio?.trim() ?? '',
      portfolioUrl: p.portfolioUrl?.trim() ?? '',
    });
  }, [me?.profile, setStudentProfile]);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const rateNum = useMemo(() => {
    const n = Number.parseInt(hourlyRate, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [hourlyRate]);

  const roleLabel = role === 'client' ? 'Client' : 'Student';
  const email = me?.email?.trim() ?? '';

  const pickAndUploadPhoto = () => {
    void (async () => {
      const picked = await pickProfileImage();
      if (!picked) return;
      setUploadingPhoto(true);
      try {
        const url = await uploadProfilePhotoFromUri(
          picked.uri,
          picked.fileName,
          picked.mimeType,
          picked.base64,
        );
        setPhotoUrl(url);
        await updateMut.mutateAsync({ photoUrl: url });
        void refetchMe();
      } catch (e) {
        Alert.alert('Photo', getDataErrorMessage(e));
      } finally {
        setUploadingPhoto(false);
      }
    })();
  };

  const saveProfile = () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      Alert.alert('Name', 'Please enter your display name.');
      return;
    }
    void updateMut.mutateAsync(
      {
        displayName: trimmedName,
        bio: bio.trim() || null,
        portfolioUrl: portfolioUrl.trim() || null,
        availabilityNote: availabilityNote.trim() || null,
        availableNow,
        skills,
        hourlyRate: role === 'student' ? rateNum : undefined,
      },
      {
        onSuccess: () => {
          void refetchMe();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsEditing(false);
          Alert.alert('Saved', 'Your profile was updated.');
        },
        onError: (e: Error) => Alert.alert('Could not save', e.message),
      },
    );
  };

  const cancelEdit = () => {
    syncFromServer();
    setIsEditing(false);
  };

  const toggleSkill = (label: string) => {
    void Haptics.selectionAsync();
    setSkills((prev) => {
      const max = role === 'student' ? 10 : 12;
      return prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label].slice(0, max);
    });
  };

  const onTogglePush = (next: boolean) => {
    void (async () => {
      if (next && !canUseAppNotifications()) {
        Alert.alert('Notifications unavailable', expoGoNotificationsMessage());
        return;
      }
      setTogglingPush(true);
      try {
        if (next) {
          await enableAppNotifications();
          setPushEnabled(true);
        } else {
          setPushEnabled(false);
        }
      } catch (e) {
        Alert.alert('Notifications', getDataErrorMessage(e));
      } finally {
        setTogglingPush(false);
      }
    })();
  };

  const handleSignOut = () => {
    void (async () => {
      setSigningOut(true);
      try {
        await signOut();
        router.replace('/auth/login');
      } catch (e) {
        Alert.alert('Sign out', getDataErrorMessage(e));
      } finally {
        setSigningOut(false);
      }
    })();
  };

  const avatarInner = photoUrl ? (
    <Image source={{ uri: photoUrl }} style={styles.avatarImg} contentFit="cover" />
  ) : (
    <View style={[styles.avatarImg, styles.avatarFallback]}>
      <LightText variant="hero" style={styles.avatarLetter}>
        {displayName?.[0]?.toUpperCase() || '?'}
      </LightText>
    </View>
  );

  const renderFieldValue = (value: string | null | undefined, emptyLabel: string) => {
    const text = value?.trim();
    return (
      <LightText variant="body" style={text ? styles.fieldValue : styles.fieldEmpty}>
        {text || emptyLabel}
      </LightText>
    );
  };

  if (meLoading && !me) {
    return (
      <Screen scroll forcedScheme="light" contentStyle={styles.pageRoot}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.black} />
          <LightText variant="caption" muted style={{ marginTop: space.md }}>
            Loading profile…
          </LightText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} forcedScheme="light" contentStyle={styles.pageRoot}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <LightText variant="caption" muted style={styles.kicker}>
          skillbee · profile
        </LightText>

        <Pressable
          onPress={isEditing ? pickAndUploadPhoto : undefined}
          disabled={!isEditing || uploadingPhoto || updateMut.isPending}
          style={styles.avatarPress}>
          <View style={styles.avatarRing}>{avatarInner}</View>
          {isEditing ? (
            <View style={styles.cameraBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={palette.black} />
              ) : (
                <Ionicons name="camera" size={16} color={palette.black} />
              )}
            </View>
          ) : null}
        </Pressable>

        {isEditing ? (
          <LightText variant="caption" muted style={styles.editPhotoHint}>
            tap photo to change
          </LightText>
        ) : null}

        <View style={styles.nameRow}>
          <LightText variant="title" style={styles.name} numberOfLines={2}>
            {displayName.trim() || 'Your profile'}
          </LightText>
          <View style={styles.rolePill}>
            <LightText variant="caption" style={styles.roleText}>
              {roleLabel}
            </LightText>
          </View>
        </View>

        {email ? (
          <LightText variant="caption" muted style={styles.email} numberOfLines={1}>
            {email}
          </LightText>
        ) : null}
      </View>

      <View style={styles.sectionHead}>
        <LightText variant="subtitle">Your details</LightText>
        {!isEditing ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsEditing(true)}
            style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.85 }]}>
            <Ionicons name="create-outline" size={16} color={palette.black} />
            <LightText variant="caption" style={styles.editChipText}>
              Edit
            </LightText>
          </Pressable>
        ) : null}
      </View>

      {!isEditing ? (
        <View style={styles.bubbleStack}>
          <DetailBubble label="display name">
            {renderFieldValue(displayName, 'Add your display name')}
          </DetailBubble>

          <DetailBubble label="about you">
            {renderFieldValue(
              bio,
              role === 'client'
                ? 'Tell students about your business'
                : 'Add a short bio about what you do',
            )}
          </DetailBubble>

          <DetailBubble label={role === 'client' ? 'website / link' : 'portfolio / website'}>
            {renderFieldValue(portfolioUrl, 'Add a link (optional)')}
          </DetailBubble>

          {role === 'student' ? (
            <>
              <DetailBubble label="expected rate">
                <LightText variant="body" style={rateNum > 0 ? styles.fieldValue : styles.fieldEmpty}>
                  {rateNum > 0 ? `₹${rateNum} / hr` : 'Set your hourly rate'}
                </LightText>
              </DetailBubble>

              <DetailBubble label="availability">
                {renderFieldValue(availabilityNote, 'When are you usually free?')}
              </DetailBubble>

              <DetailBubble label="status">
                <View style={styles.liveRow}>
                  <Ionicons
                    name={availableNow ? 'flash' : 'time-outline'}
                    size={16}
                    color={availableNow ? palette.black : L.muted}
                  />
                  <LightText variant="body" style={styles.fieldValue}>
                    {availableNow ? 'Available now' : 'Not marked available'}
                  </LightText>
                </View>
              </DetailBubble>
            </>
          ) : null}

          <DetailBubble label={role === 'student' ? 'skills' : 'tags'}>
            {skills.length > 0 ? (
              <View style={styles.pills}>
                {skills.map((s) => (
                  <ProfileSkillPill key={s} label={s} selected />
                ))}
              </View>
            ) : (
              <LightText variant="body" style={styles.fieldEmpty}>
                {role === 'student' ? 'Add skills you offer' : 'Add tags you hire for'}
              </LightText>
            )}
          </DetailBubble>
        </View>
      ) : (
        <View style={styles.bubbleStack}>
          <DetailBubble label="display name">
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How you appear to others"
              placeholderTextColor={L.placeholder}
              style={styles.input}
            />
          </DetailBubble>

          <DetailBubble label="about you">
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={
                role === 'client'
                  ? 'Your business and what you usually hire for…'
                  : 'Short bio, tools you love, what you deliver…'
              }
              placeholderTextColor={L.placeholder}
              multiline
              style={[styles.input, styles.textArea]}
            />
          </DetailBubble>

          <DetailBubble label={role === 'client' ? 'website / link' : 'portfolio / website'}>
            <TextInput
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              placeholder="https://…"
              placeholderTextColor={L.placeholder}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
            />
          </DetailBubble>

          {role === 'student' ? (
            <>
              <DetailBubble label="expected rate (INR / hr)">
                <TextInput
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="number-pad"
                  placeholder="e.g. 800"
                  placeholderTextColor={L.placeholder}
                  style={styles.input}
                />
              </DetailBubble>

              <DetailBubble label="availability">
                <TextInput
                  value={availabilityNote}
                  onChangeText={setAvailabilityNote}
                  placeholder="e.g. Weeknights after 7pm IST"
                  placeholderTextColor={L.placeholder}
                  style={styles.input}
                />
              </DetailBubble>

              <View style={styles.toggleBubble}>
                <View style={styles.toggleCopy}>
                  <LightText variant="subtitle">Available now</LightText>
                  <LightText variant="caption" muted>
                    Shows you’re open for quick gigs
                  </LightText>
                </View>
                <Switch
                  value={availableNow}
                  onValueChange={setAvailableNow}
                  trackColor={{ false: palette.gray200, true: palette.yellow }}
                  thumbColor={palette.white}
                />
              </View>
            </>
          ) : null}

          <DetailBubble label={role === 'student' ? 'skills you offer' : 'tags you hire for'}>
            <View style={styles.pills}>
              {SKILL_SUGGESTIONS.map((s) => (
                <ProfileSkillPill
                  key={s}
                  label={s}
                  selected={skills.includes(s)}
                  onPress={() => toggleSkill(s)}
                />
              ))}
            </View>
          </DetailBubble>
        </View>
      )}

      <View style={styles.footer}>
        <LightText variant="subtitle" style={styles.footerTitle}>
          Settings
        </LightText>

        <View style={styles.toggleBubble}>
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIcon}>
              <Ionicons name="notifications-outline" size={22} color={palette.black} />
            </View>
            <View style={styles.toggleCopy}>
              <LightText variant="subtitle">Notifications</LightText>
              <LightText variant="caption" muted>
                Pop-up alerts for new activity
              </LightText>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            disabled={togglingPush}
            onValueChange={onTogglePush}
            trackColor={{ false: palette.gray200, true: palette.yellow }}
            thumbColor={palette.white}
          />
        </View>
      </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: stickyFooterPad }]}>
        {isEditing ? (
          <View style={styles.actionRow}>
            <View style={styles.actionHalf}>
              <BeeButton title="Save" loading={updateMut.isPending || meLoading} onPress={saveProfile} />
            </View>
            <View style={styles.actionHalf}>
              <Pressable
                accessibilityRole="button"
                onPress={cancelEdit}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}>
                <LightText variant="subtitle" style={styles.secondaryBtnText}>
                  Cancel
                </LightText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              { opacity: pressed ? 0.88 : signingOut ? 0.6 : 1 },
            ]}>
            {signingOut ? (
              <ActivityIndicator color={palette.black} size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color={palette.black} />
                <LightText variant="caption" style={styles.signOutText}>
                  Sign out
                </LightText>
              </>
            )}
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.xs,
    paddingBottom: space.lg,
  },
  loadingWrap: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: L.surface,
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: L.border,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    marginBottom: space.lg,
  },
  kicker: {
    fontWeight: '900',
    textTransform: 'lowercase',
    letterSpacing: 1.2,
    marginBottom: space.lg,
  },
  avatarPress: {
    alignItems: 'center',
    marginBottom: space.sm,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: palette.yellow,
    backgroundColor: palette.yellow,
  },
  avatarImg: {
    width: 108,
    height: 108,
    borderRadius: 9999,
    backgroundColor: palette.white,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  avatarLetter: {
    color: palette.black,
  },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.yellow,
    borderWidth: 2,
    borderColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoHint: {
    marginBottom: space.sm,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.xs,
    marginTop: space.sm,
  },
  name: {
    letterSpacing: -0.5,
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '78%',
  },
  rolePill: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radii.lg,
    backgroundColor: palette.yellow,
    borderWidth: 2,
    borderColor: palette.black,
  },
  roleText: {
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  email: {
    marginTop: space.sm,
    textAlign: 'center',
    maxWidth: '100%',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
    paddingHorizontal: space.xxs,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.lg,
    backgroundColor: palette.yellow,
    borderWidth: 2,
    borderColor: palette.black,
  },
  editChipText: {
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  bubbleStack: {
    gap: space.md,
  },
  detailBubble: {
    backgroundColor: L.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: L.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  bubbleLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: space.sm,
  },
  fieldValue: {
    lineHeight: 22,
    color: L.text,
  },
  fieldEmpty: {
    lineHeight: 22,
    color: L.empty,
    fontStyle: 'italic',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -space.xs,
  },
  skillPill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: 2,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  skillPillOn: {
    backgroundColor: palette.black,
    borderColor: palette.black,
  },
  skillPillOff: {
    backgroundColor: L.inputBg,
    borderColor: palette.gray200,
  },
  toggleBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: L.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: L.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.md,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minWidth: 0,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.black,
    flexShrink: 0,
  },
  input: {
    borderWidth: 2,
    borderColor: palette.black,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    color: L.text,
    backgroundColor: L.inputBg,
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: space.xl,
    gap: space.md,
  },
  footerTitle: {
    paddingHorizontal: space.xxs,
  },
  stickyFooter: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.sm,
    backgroundColor: L.bg,
    borderTopWidth: 2,
    borderTopColor: L.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  actionHalf: {
    flex: 1,
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.black,
    backgroundColor: L.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontWeight: '800',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: L.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: L.border,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: 52,
  },
  signOutText: {
    fontWeight: '800',
  },
});
