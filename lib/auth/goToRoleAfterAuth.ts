import type { Router } from 'expo-router';



import {

  homeRouteForAccount,

  profileCompleteForAccount,

  syncAccountProgressFromServer,

} from '@/lib/auth/syncAccountProgress';

import { useSessionStore } from '@/stores/session';



/** After login: restore role + setup state from server, then go home or one-time setup. */

export async function resumeAfterAuth(router: Pick<Router, 'replace'>): Promise<void> {

  useSessionStore.getState().completeAuthFlow();

  const synced = await syncAccountProgressFromServer();

  const store = useSessionStore.getState();

  const role = synced.role ?? store.role;

  const profileComplete = profileCompleteForAccount(role, synced.profileComplete, store.accountUserId);

  router.replace(homeRouteForAccount(role, profileComplete));

}



export function goToRoleAfterAuth(router: Pick<Router, 'replace'>): void {

  void resumeAfterAuth(router);

}

