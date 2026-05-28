import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { SkillPill } from '@/components/ui/SkillPill';
import { SKILL_SUGGESTIONS } from '@/data/skills';
import { useThemeColors } from '@/hooks/useThemeColors';
import { updateUserProfile } from '@/lib/data/profileAndDashboard';
import { syncAccountProgressFromServer, profileCompleteForAccount } from '@/lib/auth/syncAccountProgress';
import { pickProfileImage, type PickedProfileImage } from '@/lib/pickProfileImage';
import { supabase } from '@/lib/supabase';
import { uploadProfilePhotoFromUri } from '@/lib/uploadProfilePhoto';
import { useSessionStore } from '@/stores/session';
import { fontSizes, palette, radii, space } from '@/theme';

export default function StudentSetup() {
  const router = useRouter();
  const t = useThemeColors();
  const setProfile = useSessionStore((s) => s.setStudentProfile);
  const finish = useSessionStore((s) => s.completeStudentSetup);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void syncAccountProgressFromServer().then(({ role, profileComplete }) => {
      const store = useSessionStore.getState();
      const done = profileCompleteForAccount(role, profileComplete, store.accountUserId);
      if (role === 'student' && done) {
        router.replace('/(tabs)/discover');
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const [name, setName] = useState('');
  const [rate, setRate] = useState('500');
  const [note, setNote] = useState('');
  const [availableNow, setAvailableNow] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [pickedPhoto, setPickedPhoto] = useState<PickedProfileImage | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => SKILL_SUGGESTIONS, []);

  const toggleSkill = (s: string) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].slice(0, 8),
    );
  };

  const pickPhoto = () => {
    void (async () => {
      const picked = await pickProfileImage();
      if (picked) setPickedPhoto(picked);
    })();
  };

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name', 'Please enter your display name.');
      return;
    }

    void (async () => {
      setSaving(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('Sign in required.');

        let photoUrl: string | undefined;
        if (pickedPhoto) {
          photoUrl = await uploadProfilePhotoFromUri(
            pickedPhoto.uri,
            pickedPhoto.fileName,
            pickedPhoto.mimeType,
            pickedPhoto.base64,
          );
        }

        const hourlyRate = Number.parseInt(rate, 10) || 500;
        await updateUserProfile(session.user.id, {
          displayName: trimmedName,
          skills,
          hourlyRate,
          availabilityNote: note.trim() || null,
          availableNow,
          ...(photoUrl ? { photoUrl } : {}),
        });

        const verified = await syncAccountProgressFromServer();
        if (!verified.profileComplete) {
          throw new Error('Profile saved but could not be verified. Check your connection and try again.');
        }

        setProfile({
          displayName: trimmedName,
          skills,
          hourlyRate,
          availabilityNote: note.trim(),
          availableNow,
          photoUri: photoUrl ?? pickedPhoto?.uri ?? undefined,
        });
        finish();
        router.replace('/(tabs)/discover');
      } catch (e) {
        Alert.alert('Setup failed', e instanceof Error ? e.message : 'Could not save your profile.');
      } finally {
        setSaving(false);
      }
    })();
  };

  if (checking) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={palette.yellow} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        Build your vibe card
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.lg }}>
        Add your photo and details — clients will see this when you match.
      </AppText>

      <BeeCard>
        <Pressable onPress={pickPhoto} disabled={saving} style={[styles.avatar, { borderColor: t.border }]}>
          {pickedPhoto ? (
            <Image source={{ uri: pickedPhoto.uri }} style={styles.avatarImg} />
          ) : (
            <>
              <Ionicons name="camera" size={28} color={t.muted} />
              <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                add photo
              </AppText>
            </>
          )}
        </Pressable>
        <AppText variant="label" muted style={{ marginTop: space.md }}>
          DISPLAY NAME
        </AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="How you appear to clients"
          placeholderTextColor={t.muted}
          style={[styles.input, { color: t.text, borderColor: t.border }]}
        />
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
          Skills
        </AppText>
        <View style={styles.pills}>
          {suggestions.map((s) => (
            <SkillPill
              key={s}
              label={s}
              selected={skills.includes(s)}
              onPress={() => toggleSkill(s)}
            />
          ))}
        </View>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
          Hourly rate (INR)
        </AppText>
        <TextInput
          keyboardType="number-pad"
          value={rate}
          onChangeText={setRate}
          style={[styles.input, { color: t.text, borderColor: t.border }]}
        />
        <AppText variant="subtitle" style={{ marginTop: space.lg, marginBottom: space.sm }}>
          Availability note
        </AppText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Weeknights after 7pm IST"
          placeholderTextColor={t.muted}
          style={[styles.input, { color: t.text, borderColor: t.border }]}
        />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">Available now</AppText>
            <AppText variant="caption" muted>
              boosts your match priority
            </AppText>
          </View>
          <Switch value={availableNow} onValueChange={setAvailableNow} />
        </View>
      </BeeCard>

      <View style={{ height: space.xl }} />
      {saving ? <ActivityIndicator color={palette.black} style={{ marginBottom: space.md }} /> : null}
      <BeeButton title="Start swiping" loading={saving} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: 120,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  input: {
    marginTop: space.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: fontSizes.md,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
  },
});
