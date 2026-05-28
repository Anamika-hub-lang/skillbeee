import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

import { AuthSessionBridge } from '@/components/AuthSessionBridge';
import { NotificationPushBridge } from '@/components/NotificationPushBridge';
import { usePlatformRealtime } from '@/hooks/usePlatformRealtime';

const defaultClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function RealtimeBridge() {
  usePlatformRealtime();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => defaultClient);
  return (
    <QueryClientProvider client={client}>
      <AuthSessionBridge />
      <NotificationPushBridge />
      <RealtimeBridge />
      {children}
    </QueryClientProvider>
  );
}
