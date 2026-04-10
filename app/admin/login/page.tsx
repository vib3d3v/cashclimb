'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) throw new Error('Invalid password')

      sessionStorage.setItem('cc-admin-key', password)

      toast.success('Welcome back!')
      router.push(from)
      router.refresh()
    } catch {
      toast.error('Invalid password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
      <div className="hidden lg:block">
        <p className="text-xs font-bold tracking-[0.18em] uppercase text-gold mb-4">
          Admin Access
        </p>
        <h1 className="font-serif text-5xl font-black leading-[1.05] mb-6">
          Sign in to manage
          <br />
          <span className="text-gold">CashClimb</span>
        </h1>
        <p className="text-[#9A9490] text-lg leading-relaxed max-w-xl">
          Access your publishing dashboard, create articles, edit posts, upload
          cover images, and manage the site from one place.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            ['Write', 'Create and publish articles'],
            ['Edit', 'Update existing content'],
            ['Manage', 'Review posts and comments'],
          ].map(([title, text]) => (
            <div
              key={title}
              className="bg-bg-2 border border-border rounded-2xl p-5"
            >
              <div className="text-xs font-bold tracking-widest uppercase text-gold mb-2">
                {title}
              </div>
              <div className="text-sm text-[#9A9490] leading-relaxed">
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-xl lg:ml-auto">
        <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-8">
          <div
            className="w-10 h-10 bg-gold flex items-center justify-center text-bg font-black"
            style={{
              clipPath:
                'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            }}
          >
            C
          </div>
          <span className="font-serif text-2xl font-bold">
            Cash<span className="text-gold">Climb</span>
          </span>
        </div>

        <div className="bg-bg-2 border border-border rounded-2xl p-8 lg:p-10">
          <h2 className="font-serif text-3xl font-bold mb-2">Admin Login</h2>
          <p className="text-[#9A9490] text-sm mb-8">
            Enter your password to access the publishing dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="cc-label">Password</label>
              <input
                type="password"
                className="cc-input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="cc-btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-[#6A6460] text-xs mt-5 leading-relaxed text-center lg:text-left">
          Set your password in <code className="text-gold">.env.local</code> as{' '}
          <code className="text-gold">ADMIN_PASSWORD</code>.
        </p>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="w-full max-w-5xl grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
      <div className="hidden lg:block">
        <div className="h-4 bg-bg-2 rounded w-28 mb-4 animate-pulse" />
        <div className="h-14 bg-bg-2 rounded w-[28rem] mb-4 animate-pulse" />
        <div className="h-14 bg-bg-2 rounded w-[22rem] mb-6 animate-pulse" />
        <div className="h-5 bg-bg-2 rounded w-[32rem] mb-3 animate-pulse" />
        <div className="h-5 bg-bg-2 rounded w-[24rem] animate-pulse" />
      </div>

      <div className="w-full max-w-xl lg:ml-auto">
        <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-8">
          <div
            className="w-10 h-10 bg-gold flex items-center justify-center text-bg font-black"
            style={{
              clipPath:
                'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            }}
          >
            C
          </div>
          <span className="font-serif text-2xl font-bold">
            Cash<span className="text-gold">Climb</span>
          </span>
        </div>

        <div className="bg-bg-2 border border-border rounded-2xl p-8 lg:p-10 animate-pulse">
          <div className="h-8 bg-bg-3 rounded w-40 mb-3" />
          <div className="h-4 bg-bg-3 rounded w-60 mb-8" />
          <div className="h-11 bg-bg-3 rounded mb-5" />
          <div className="h-11 bg-bg-3 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}