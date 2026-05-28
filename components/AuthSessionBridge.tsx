import type { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { syncAccountProgressFromServer } from '@/lib/auth/syncAccountProgress';
import { syncRealtimeAuth } from '@/lib/realtimeAuth';
import { useSessionStore } from '@/stores/session';

export function AuthSessionBridge() {
  const clearAppAuthOnly = useSessionStore((s) => s.clearAppAuthOnly);
  const applySignedIn = useSessionStore((s) => s.applySupabaseSignedIn);
  const completeAuthFlow = useSessionStore((s) => s.completeAuthFlow);
  const setSupabaseAuthReady = useSessionStore((s) => s.setSupabaseAuthReady);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSupabaseAuthReady(true);
      return undefined;
    }

    let cancelled = false;

    const syncFromSession = async (session: Session | null, event?: string) => {
      void syncRealtimeAuth();

      if (!session) {
        if (useSessionStore.getState().isAuthenticated) {
          clearAppAuthOnly();
        }
        return;
      }

      await syncAccountProgressFromServer();
      const role = useSessionStore.getState().role;

      if (role === 'client' || role === 'student') {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          completeAuthFlow();
        }
        applySignedIn();
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      void syncFromSession(session, event);
    });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) await syncFromSession(data.session, 'INITIAL_SESSION');
      } catch {
        if (!cancelled) await syncFromSession(null, 'INITIAL_SESSION');
      } finally {
        if (!cancelled) setSupabaseAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applySignedIn, clearAppAuthOnly, completeAuthFlow, setSupabaseAuthReady]);

  return null;
}
