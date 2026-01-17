import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const isProd = process.env.NODE_ENV === 'production'

function projectRefFromUrl(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'missing env' }, { status: 500 })
  }

  let password: string | undefined
  try {
    const body = await req.json()
    password = body?.password
  } catch {
    // ignore
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'missing password' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await supabase.auth.signOut().catch(() => {
    // ignore
  })

  res.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  res.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  const ref = projectRefFromUrl(supabaseUrl)
  if (ref) {
    res.cookies.set(`sb-${ref}-auth-token`, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return res
}
