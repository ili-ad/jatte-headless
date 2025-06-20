export interface TokenData {
  userID: string;
  userToken: string;
}

export async function getToken(): Promise<TokenData> {
  const res = await fetch('/api/token/');
  if (!res.ok) {
    throw new Error('failed to fetch token');
  }
  const data = await res.json();
  return {
    userID: data.user_id ?? data.userID ?? data.id,
    userToken: data.token ?? data.access ?? data.userToken,
  } as TokenData;
}
