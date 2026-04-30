'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

export default function AdvancedContentFixButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const payload = await authedFetch('/api/admin/posts/' + postId + '/fix-content', { method: 'POST' })
      const score = payload?.evaluation?.score ?? '-'
      const wordCount = payload?.wordCount ?? '-'
      const unresolved = payload?.unresolved?.length ?? 0
      if (unresolved > 0) {
        toast.success('Expanded to ' + wordCount + ' words. Score: ' + score + '. ' + unresolved + ' item(s) still need review.')
      } else {
        toast.success('Content depth and tone fixed. ' + wordCount + ' words. Score: ' + score + '.')
      }
      router.refresh()
      setTimeout(() => router.refresh(), 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fix content depth and tone.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') window.location.href = '/admin/login'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="cc-btn-ghost w-full disabled:opacity-60">
      {loading ? 'Fixing depth and tone...' : 'Fix Content Depth + Tone'}
    </button>
  )
}
