import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { SkillPill } from '@/components/ui/SkillPill';
import { SKILL_SUGGESTIONS } from '@/data/skills';
import { insertRequirementWithSkills } from '@/lib/data/gigs';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { GigCategory } from '@/types';
import { fontSizes, radii, space } from '@/theme';

function inferCategory(picked: string[]): GigCategory {
  const skillsLower = picked.map((s) => s.toLowerCase());
  if (skillsLower.some((s) => s.includes('shopify'))) return 'shopify';
  if (skillsLower.some((s) => s.includes('canva'))) return 'canva';
  if (skillsLower.some((s) => s.includes('video') || s.includes('capcut') || s.includes('premiere')))
    return 'video';
  if (skillsLower.some((s) => s.includes('framer'))) return 'framer';
  if (skillsLower.some((s) => s.includes('n8n') || s.includes('automation'))) return 'ai';
  if (skillsLower.some((s) => s.includes('resume'))) return 'resume';
  if (skillsLower.some((s) => s.includes('ppt') || s.includes('slide'))) return 'ppt';
  return 'code';
}

export default function ClientPost() {
  const router = useRouter();
  const qc = useQueryClient();
  const t = useThemeColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const ai = useMemo(() => [...SKILL_SUGGESTIONS], []);

  const createMut = useMutation({
    mutationFn: async () => {
      const b = Number.parseInt(budget, 10);
      const d = Number.parseInt(deadline, 10);
      if (!title.trim()) throw new Error('Enter a short title');
      if (!Number.isFinite(b) || b <= 0) throw new Error('Enter a valid budget');
      if (!Number.isFinite(d) || d <= 0) throw new Error('Enter a valid deadline (hours)');
      if (picked.length < 1) throw new Error('Pick at least one skill');
      const desc =
        description.trim().length >= 10
          ? description.trim()
          : `${title.trim()}. Skills: ${picked.join(', ')} — posted from SkillBee mobile.`;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      await insertRequirementWithSkills({
        clientId: session.user.id,
        title: title.trim(),
        description: desc,
        budget: b,
        currency: 'INR',
        deadlineHours: d,
        urgent: d <= 12,
        category: inferCategory(picked),
        skills: picked,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.gigs });
      void qc.invalidateQueries({ queryKey: queryKeys.clientRequirements });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      router.replace('/(tabs)/client-home');
    },
    onError: (e: Error) => {
      Alert.alert('Could not post', e.message);
    },
  });

  const toggle = (s: string) => {
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };

  const onFindStudents = () => {
    createMut.mutate();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={t.text} />
          </Pressable>
          <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>
            Post a task
          </AppText>
        </View>

        <BeeCard>
          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
            What do you need?
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Short title (e.g. Shopify header cleanup)"
            placeholderTextColor={t.muted}
            style={[styles.inputTitle, { color: t.text, borderColor: t.border }]}
          />
          <AppText variant="subtitle" style={{ marginTop: space.lg, marginBottom: space.sm }}>
            Details (optional, min 10 chars if you fill it)
          </AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What should the student deliver?"
            placeholderTextColor={t.muted}
            multiline
            numberOfLines={4}
            style={[styles.inputMultiline, { color: t.text, borderColor: t.border }]}
          />
        </BeeCard>

        <View style={{ height: space.lg }} />

        <BeeCard tone="yellow">
          <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
            Skill tags
          </AppText>
          <AppText variant="body" style={{ color: '#111', marginTop: space.sm }}>
            Students match on these — new posts appear on their Home feed in real time.
          </AppText>
          <View style={[styles.pills, { marginTop: space.md }]}>
            {ai.map((s) => (
              <SkillPill key={s} label={s} selected={picked.includes(s)} onPress={() => toggle(s)} />
            ))}
          </View>
        </BeeCard>

        <View style={{ height: space.lg }} />

        <BeeCard>
          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
            Budget (INR, whole rupees)
          </AppText>
          <TextInput
            keyboardType="number-pad"
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g. 90"
            placeholderTextColor={t.muted}
            style={[styles.input, { color: t.text, borderColor: t.border }]}
          />
          <AppText variant="subtitle" style={{ marginTop: space.lg, marginBottom: space.sm }}>
            Deadline (hours)
          </AppText>
          <TextInput
            keyboardType="number-pad"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="e.g. 24"
            placeholderTextColor={t.muted}
            style={[styles.input, { color: t.text, borderColor: t.border }]}
          />
        </BeeCard>

        <View style={{ height: space.xl }} />
        <BeeButton title="Publish task" loading={createMut.isPending} onPress={onFindStudents} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  inputTitle: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: fontSizes.md,
  },
  inputMultiline: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: fontSizes.md,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
