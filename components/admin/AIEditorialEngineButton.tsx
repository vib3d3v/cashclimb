'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

export default function AIEditorialEngineButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const payload = await authedFetch(`/api/admin/platform/editorial-engine/${postId}`, {
        method: 'POST',
        body: JSON.stringify({ threshold: 95, maxPasses: 3 }),
      })

      const result = payload?.result
      const score = result?.after?.score ?? '-'
      const status = result?.status || 'updated'
      const passes = result?.passes ?? 0

      toast.success(`Editorial engine finished. Score: ${score}. Passes: ${passes}. Status: ${status}.`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI editorial engine failed.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') window.location.href = '/admin/login'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-xl bg-gold px-4 py-4 text-xs font-black uppercase tracking-[0.18em] text-bg transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Improving until 95…' : 'Run AI Editorial Engine'}
    </button>
  )
}
