import { setAuthToken } from '@iliad/stream-chat-shim';

import { supabase } from './supabaseClient';

export async function getChatCreds() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('No Supabase session');

  const res = await fetch('/api/token/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('token endpoint failed');

  const creds = (await res.json()) as { userID: number; userToken: string };
  setAuthToken(creds?.userToken ?? null);
  return creds;
}
