import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HydrationGate } from '@/components/ui/HydrationGate';
import { useAppColorScheme, useThemeColors } from '@/hooks/useThemeColors';
import { useUnreadBadgeCounts } from '@/hooks/useUnreadBadgeCounts';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';
import type { UserRole } from '@/types';
import { layout, space, tabBarStripHeight } from '@/theme';

function tabHref(role: UserRole | null, tab: 'student' | 'client') {
  if (!role) return undefined;
  if (tab === 'student') return role === 'student' ? undefined : null;
  return role === 'client' ? undefined : null;
}

export default function TabLayout() {
  const hydrated = useSessionStore((s) => s.hydrated);
  const supabaseAuthReady = useSessionStore((s) => s.supabaseAuthReady);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  if (!hydrated || (isSupabaseConfigured() && !supabaseAuthReady)) {
    return <HydrationGate />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <AuthenticatedTabs />;
}

function AuthenticatedTabs() {
  const t = useThemeColors();
  const scheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const role = useSessionStore((s) => s.role);
  const { chatUnread } = useUnreadBadgeCounts();

  const bottomInset = insets.bottom;
  const tabBarHeight = tabBarStripHeight(bottomInset);
  const chatTabBadge =
    chatUnread > 0 ? (chatUnread > 99 ? '99+' : String(chatUnread)) : undefined;

  return (
    <View style={styles.wrap}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: t.tabIconActive,
          tabBarInactiveTintColor: t.tabIcon,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          },
          tabBarItemStyle: {
            paddingTop: 6,
            paddingBottom: 0,
          },
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: tabBarHeight,
            paddingHorizontal: 0,
            paddingTop: 6,
            paddingBottom: bottomInset + 6,
            marginHorizontal: 0,
            marginTop: 0,
            marginBottom: 0,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: scheme === 'light' ? 'rgba(10,10,10,0.08)' : t.border,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backgroundColor: t.tabBar,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
        }}>
        <Tabs.Screen
          name="discover"
          options={{
            href: tabHref(role, 'student'),
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'flash' : 'flash-outline'} size={layout.tabIconSize} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="client-home"
          options={{
            href: tabHref(role, 'client'),
            title: 'Postings',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={layout.tabIconSize} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="earn"
          options={{
            title: 'Earn',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={layout.tabIconSize} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Chat',
            tabBarBadge: chatTabBadge,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={layout.tabIconSize}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={layout.tabIconSize} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
