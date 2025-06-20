import { supabase } from './supabaseClient'

export interface TokenData {
  userID: string
  userToken: string
}

export async function getToken(): Promise<TokenData> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) throw new Error('not authenticated')

  const res = await fetch('/api/token/', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    throw new Error('failed to fetch token')
  }
  const dataRes = await res.json()
  return {
    userID: dataRes.user_id ?? dataRes.userID ?? dataRes.id,
    userToken: dataRes.token ?? dataRes.access ?? dataRes.userToken,
  } as TokenData
}
