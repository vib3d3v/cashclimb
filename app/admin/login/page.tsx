'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLogin() {
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
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-10 h-10 bg-gold flex items-center justify-center text-bg font-black"
               style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
            C
          </div>
          <span className="font-serif text-2xl font-bold">Cash<span className="text-gold">Climb</span></span>
        </div>

        <div className="bg-bg-2 border border-border rounded-2xl p-8">
          <h1 className="font-serif text-2xl font-bold mb-1">Admin Access</h1>
          <p className="text-[#9A9490] text-sm mb-6">Enter your password to manage CashClimb.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="cc-label">Password</label>
              <input
                type="password"
                className="cc-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                required
              />
            </div>
            <button type="submit" className="cc-btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6A6460] text-xs mt-6">
          Set your password in <code className="text-gold">.env.local</code> → <code className="text-gold">ADMIN_PASSWORD</code>
        </p>
      </div>
    </div>
  )
}
