import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { consumeAuthCallbackUrl } from '@/lib/auth/authRedirect';
import { goToRoleAfterAuth } from '@/lib/auth/goToRoleAfterAuth';
import { supabase } from '@/lib/supabase';
import { palette, space } from '@/theme';

/**
 * Deep link return for Google OAuth, email confirmation, and password recovery
 * (`skillbee://auth/callback` or `Linking.createURL` from the reset email).
 */
export default function AuthCallback() {
  const router = useRouter();
  const [hint, setHint] = useState('Finishing sign-in…');

  useEffect(() => {
    let cancelled = false;

    const go = (flow: 'recovery' | 'signup' | 'signin' | null) => {
      void supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        if (!data.session) {
          router.replace('/auth/login');
          return;
        }
        if (flow === 'recovery') {
          router.replace('/auth/new-password');
          return;
        }
        goToRoleAfterAuth(router);
      });
    };

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        const r = await consumeAuthCallbackUrl(initial);
        if (cancelled) return;
        if (r.ok) {
          go(r.flow);
          return;
        }
        if (r.reason !== 'No auth parameters in link') {
          setHint(r.reason);
          setTimeout(() => {
            if (!cancelled) router.replace('/auth/login');
          }, 2200);
          return;
        }
      }
      go(null);
    })();

    const sub = Linking.addEventListener('url', ({ url }) => {
      void (async () => {
        const r = await consumeAuthCallbackUrl(url);
        if (!cancelled && r.ok) go(r.flow);
      })();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.yellow }}>
      <ActivityIndicator size="large" color={palette.black} />
      <AppText variant="caption" style={{ marginTop: space.md, paddingHorizontal: space.lg, textAlign: 'center' }}>
        {hint}
      </AppText>
    </View>
  );
}
