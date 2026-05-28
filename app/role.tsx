import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HoneycombBackground } from '@/components/backgrounds/HoneycombBackground';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { syncBackendUser } from '@/lib/auth/supabaseSync';
import {
  homeRouteForAccount,
  syncAccountProgressFromServer,
} from '@/lib/auth/syncAccountProgress';
import { supabase } from '@/lib/supabase';
import { useAppColorScheme } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/stores/session';
import type { UserRole } from '@/types';
import { layout, palette, radii, space } from '@/theme';

export default function RoleSelect() {
  const router = useRouter();
  const scheme = useAppColorScheme();
  const setRole = useSessionStore((s) => s.setRole);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void (async () => {
      const authFlowComplete = useSessionStore.getState().authFlowComplete;
      if (!authFlowComplete) {
        router.replace('/auth/login');
        return;
      }

      const { role: savedRole, profileComplete } = await syncAccountProgressFromServer();
      if (savedRole === 'client' || savedRole === 'student') {
        router.replace(homeRouteForAccount(savedRole, profileComplete));
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  const choose = (role: UserRole) => {
    if (busy) return;
    void (async () => {
      setBusy(true);
      try {
        const { data: existingRole } = await supabase.rpc('get_my_role');
        if (existingRole === 'client' || existingRole === 'student') {
          Alert.alert(
            'Role already saved',
            `This email is registered as ${existingRole === 'client' ? 'a client' : 'a student'}.`,
          );
          setRole(existingRole);
          const { profileComplete } = await syncAccountProgressFromServer();
          router.replace(homeRouteForAccount(existingRole, profileComplete));
          return;
        }

        setRole(role);
        await syncBackendUser(role);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const { profileComplete } = await syncAccountProgressFromServer();
          if (profileComplete) {
            router.replace(homeRouteForAccount(role, true));
            return;
          }
        }

        router.replace(role === 'student' ? '/student-setup' : '/client-setup');
      } catch (e) {
        Alert.alert('Could not save role', e instanceof Error ? e.message : 'Try again.');
      } finally {
        setBusy(false);
      }
    })();
  };

  if (checking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.yellow }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="body" muted>
            Loading your account…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.layer}>
        <HoneycombBackground scheme={scheme} surface="yellow" opacity={0.88} />
        <View style={styles.root}>
          <AppText variant="caption" style={styles.kicker}>
            choose your lane
          </AppText>
          <AppText variant="hero" style={styles.title}>
            Who are you today?
          </AppText>
          <AppText variant="body" muted style={styles.sub}>
            One email = one role. Pick once — we remember it for next time.
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
            <BeeButton title="I'm a student" loading={busy} onPress={() => choose('student')} />
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
            <BeeButton title="I'm hiring" loading={busy} onPress={() => choose('client')} />
          </BeeCard>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    backgroundColor: palette.yellow,
  },
  root: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: space.lg,
    zIndex: 1,
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
