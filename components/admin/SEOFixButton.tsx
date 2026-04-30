'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

export default function SEOFixButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const payload = await authedFetch(`/api/admin/posts/${postId}/fix-seo`, {
        method: 'POST',
      })

      const fixed = payload?.fixesApplied?.length ?? 0
      const unresolved = payload?.unresolved?.length ?? 0
      const score = payload?.evaluation?.score ?? '—'

      if (unresolved > 0) {
        toast.success(`Fixed ${fixed}. Score: ${score}. ${unresolved} item(s) still need review.`)
      } else {
        toast.success(`SEO issues fixed. Score: ${score}.`)
      }

      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fix SEO issues.'
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
      {loading ? 'Fixing SEO issues…' : 'Fix SEO issues'}
    </button>
  )
}
