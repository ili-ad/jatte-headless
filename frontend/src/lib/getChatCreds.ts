import { setAuthToken } from '@iliad/stream-chat-shim';

import { setAccessToken } from './authTokenStore';
import { getSupabaseClient } from './supabaseClient';

export async function getChatCreds(options: { forceRefresh?: boolean } = {}) {
  const supabase = getSupabaseClient();
  const { data, error } = options.forceRefresh
    ? await supabase.auth.refreshSession()
    : await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('No Supabase session');

  const res = await fetch('/api/token/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('token endpoint failed');

  const creds = (await res.json()) as { userID: number; userToken: string };
  if (!creds?.userToken) throw new Error('token endpoint returned no userToken');
  if (creds.userToken !== accessToken) {
    throw new Error('token endpoint did not relay the Supabase access token');
  }
  setAuthToken(creds.userToken);
  setAccessToken(creds.userToken);
  return creds;
}
