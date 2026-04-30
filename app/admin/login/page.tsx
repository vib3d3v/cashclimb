'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setBusy(false)

    if (!response.ok) {
      setError('Incorrect admin password.')
      return
    }

    window.location.href = from.startsWith('/admin') ? from : '/admin'
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-bg-2 p-8 shadow-xl">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div
            className="w-8 h-8 bg-gold flex items-center justify-center text-bg font-black text-sm"
            style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}
          >
            C
          </div>
          <span className="font-serif text-xl font-bold">Cash<span className="text-gold">Climb</span></span>
        </Link>

        <p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p>
        <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">Editor login</h1>
        <p className="mt-3 text-sm text-[#9A9490]">Sign in before opening the dashboard, writer, keywords, automation, or analytics.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoFocus
              className="cc-input"
              placeholder="Admin password"
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button type="submit" disabled={busy || !password} className="cc-btn-primary w-full disabled:opacity-60">
            {busy ? 'Signing in...' : 'Open dashboard'}
          </button>
        </form>
      </section>
    </main>
  )
}
