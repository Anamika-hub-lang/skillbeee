import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const t = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: t.tabBar,
          borderTopColor: t.border,
        },
      }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'flash' : 'flash-outline'}
              size={26}
              color={focused ? t.tabIconActive : t.tabIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: 'Earn',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={26}
              color={focused ? t.tabIconActive : t.tabIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={26}
              color={focused ? t.tabIconActive : t.tabIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={focused ? t.tabIconActive : t.tabIcon}
            />
          ),
        }}
      />
    </Tabs>
  );
}
