'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

export default function HumanizeButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await authedFetch(`/api/admin/posts/${postId}/humanize`, {
        method: 'POST',
      })
      toast.success('Article humanized and rescored.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to humanize article.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-[#F0EDE8] hover:border-gold disabled:opacity-60">
      {loading ? 'Humanizing…' : 'Humanize again'}
    </button>
  )
}
