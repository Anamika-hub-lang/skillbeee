import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !key) throw new Error('Missing Supabase service configuration');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getUserIdFromRequest(req: Request): Promise<string> {
  const auth = req.headers.get('Authorization');
  if (!auth) throw new Error('Not authenticated');

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !anon) throw new Error('Missing Supabase anon configuration');

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user?.id) throw new Error('Not authenticated');
  return data.user.id;
}
