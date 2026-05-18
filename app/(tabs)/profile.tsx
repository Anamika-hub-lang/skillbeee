import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { SkillPill } from '@/components/ui/SkillPill';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/stores/session';
import { useUIStore } from '@/stores/ui';
import { space } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const t = useThemeColors();
  const schemePref = useUIStore((s) => s.colorScheme);
  const setSchemePref = useUIStore((s) => s.setColorScheme);
  const resolved = useAppColorScheme();
  const profile = useSessionStore((s) => s.studentProfile);
  const role = useSessionStore((s) => s.role);
  const signOut = useSessionStore((s) => s.signOut);

  const darkEnabled = schemePref === 'dark' || (schemePref === 'system' && resolved === 'dark');

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: t.primary }]}>
          <AppText variant="hero" style={{ color: '#0A0A0A' }}>
            {profile.displayName?.[0] ?? 'S'}
          </AppText>
        </View>
        <AppText variant="title" style={{ marginTop: space.md }}>
          {profile.displayName || 'SkillBee creator'}
        </AppText>
        <AppText variant="caption" muted>
          {role === 'client' ? 'Client mode' : 'Student mode'} · {profile.hourlyRate}/hr
        </AppText>
      </View>

      <BeeCard>
        <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
          Skills
        </AppText>
        <View style={styles.pills}>
          {(profile.skills.length ? profile.skills : ['Canva', 'Notion']).map((s) => (
            <SkillPill key={s} label={s} selected />
          ))}
        </View>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">Dark mode</AppText>
            <AppText variant="caption" muted>
              system default + manual override
            </AppText>
          </View>
          <Switch
            value={darkEnabled}
            onValueChange={(v) => setSchemePref(v ? 'dark' : 'light')}
          />
        </View>
        <Pressable
          onPress={() => setSchemePref('system')}
          style={{ marginTop: space.md }}>
          <AppText variant="caption" muted>
            Reset to system theme
          </AppText>
        </Pressable>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
          Portfolio
        </AppText>
        <View style={styles.portfolio}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.tile, { backgroundColor: t.border }]} />
          ))}
        </View>
        <View style={styles.stats}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" muted>
              Rating
            </AppText>
            <AppText variant="title" style={{ marginTop: space.xs }}>
              4.9
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" muted>
              Gigs done
            </AppText>
            <AppText variant="title" style={{ marginTop: space.xs }}>
              38
            </AppText>
          </View>
        </View>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeButton
        title="Notifications"
        variant="secondary"
        onPress={() => router.push('/notifications')}
      />
      <View style={{ height: space.md }} />
      <BeeButton
        title="Sign out"
        variant="ghost"
        onPress={() => {
          signOut();
          router.replace('/auth/login');
        }}
      />
      <View style={{ height: space.md }} />
      <View style={styles.footerNote}>
        <Ionicons name="ribbon-outline" size={18} color={t.muted} />
        <AppText variant="caption" muted style={{ marginLeft: space.sm, flex: 1 }}>
          badges: Speedster, 5-star streak, Night Owl
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  tile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 18,
  },
  stats: {
    flexDirection: 'row',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
  },
});
