import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { useSessionStore } from '@/stores/session';
import type { UserRole } from '@/types';
import { palette, radii, space } from '@/theme';

export default function RoleSelect() {
  const router = useRouter();
  const setRole = useSessionStore((s) => s.setRole);

  const choose = (role: UserRole) => {
    setRole(role);
    if (role === 'student') {
      router.replace('/student-setup');
    } else {
      router.replace('/(tabs)/discover');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppText variant="caption" style={styles.kicker}>
        choose your lane
      </AppText>
      <AppText variant="hero" style={styles.title}>
        Who are you today?
      </AppText>
      <AppText variant="body" muted style={styles.sub}>
        Students swipe gigs. Clients post lightning tasks.
      </AppText>

      <BeeCard style={styles.card} tone="default">
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: palette.yellow }]}>
            <Ionicons name="school" size={26} color="#0A0A0A" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">Student</AppText>
            <AppText variant="caption" muted>
              earn on your schedule
            </AppText>
          </View>
        </View>
        <View style={{ height: space.md }} />
        <BeeButton title="I'm a student" onPress={() => choose('student')} />
      </BeeCard>

      <BeeCard style={styles.card} tone="default">
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: '#111' }]}>
            <Ionicons name="briefcase" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">Client</AppText>
            <AppText variant="caption" muted>
              hire talent in minutes
            </AppText>
          </View>
        </View>
        <View style={{ height: space.md }} />
        <BeeButton title="I'm hiring" onPress={() => choose('client')} />
      </BeeCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.yellow,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  kicker: {
    textTransform: 'lowercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: space.sm,
    letterSpacing: -0.8,
  },
  sub: {
    marginTop: space.sm,
    marginBottom: space.xl,
  },
  card: {
    marginBottom: space.lg,
    borderRadius: radii.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
});
