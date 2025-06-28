//frontend/src/app/login/page.tsx

'use client'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/SessionProvider'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSession } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      setError(error?.message || 'Login failed')
      return
    }
    setSession(data.session)
    const next = searchParams.get('next') || '/demo'
    router.push(next.startsWith('/') ? next : `/${next}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type='email'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type='submit'>Login</button>
      {error && <p>{error}</p>}
    </form>
  )
}
