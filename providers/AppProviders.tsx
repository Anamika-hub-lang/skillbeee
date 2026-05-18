import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

const defaultClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => defaultClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
