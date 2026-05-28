import { Redirect, Slot } from 'expo-router';

import { useSessionStore } from '@/stores/session';

export default function ClientLayout() {
  const role = useSessionStore((s) => s.role);
  if (role !== 'client') {
    return <Redirect href="/(tabs)/discover" />;
  }
  return <Slot />;
}
