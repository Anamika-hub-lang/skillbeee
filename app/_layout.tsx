import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { AppProviders } from '@/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </SafeAreaProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
