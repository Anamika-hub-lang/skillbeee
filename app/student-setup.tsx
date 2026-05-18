import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import { SKILL_SUGGESTIONS } from '@/data/dummy';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, radii, space } from '@/theme';

export default function StudentSetup() {
  const router = useRouter();
  const t = useThemeColors();
  const setProfile = useSessionStore((s) => s.setStudentProfile);
  const finish = useSessionStore((s) => s.completeStudentSetup);

  const [name, setName] = useState('Alex');
  const [rate, setRate] = useState('28');
  const [note, setNote] = useState('Nights & weekends');
  const [availableNow, setAvailableNow] = useState(true);
  const [skills, setSkills] = useState<string[]>(['Canva', 'Shopify']);

  const suggestions = useMemo(() => SKILL_SUGGESTIONS, []);

  const toggleSkill = (s: string) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].slice(0, 8),
    );
  };

  return (
    <Screen scroll>
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        Build your vibe card
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.lg }}>
        keep it honest — clients love clarity.
      </AppText>

      <BeeCard>
        <Pressable style={[styles.avatar, { borderColor: t.border }]}>
          <Ionicons name="camera" size={28} color={t.muted} />
          <AppText variant="caption" muted style={{ marginTop: space.xs }}>
            add photo
          </AppText>
        </Pressable>
        <AppText variant="label" muted style={{ marginTop: space.md }}>
          DISPLAY NAME
        </AppText>
        <TextInput
          value={name}
          onChangeText={setName}
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
          Hourly rate (USD)
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
      <BeeButton
        title="Start swiping"
        onPress={() => {
          setProfile({
            displayName: name,
            skills,
            hourlyRate: Number(rate) || 25,
            availabilityNote: note,
            availableNow,
          });
          finish();
          router.replace('/(tabs)/discover');
        }}
      />
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
