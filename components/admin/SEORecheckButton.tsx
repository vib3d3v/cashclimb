'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

export default function SEORecheckButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const payload = await authedFetch(`/api/admin/quality-checks/${postId}`, {
        method: 'POST',
      })
      toast.success(`Checklist refreshed. Score: ${payload?.evaluation?.score ?? '—'}`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run SEO checklist.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="cc-btn-primary w-full disabled:opacity-60">
      {loading ? 'Re-running…' : 'Re-run SEO checklist'}
    </button>
  )
}
