'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

function getAdminKey() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cc-admin-key') ?? ''
}

export default function RefreshArticleButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    const adminKey = getAdminKey()
    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/posts/${postId}/refresh`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Failed to refresh article.')
      toast.success('Article refreshed, tool block strengthened, and rescored.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh article.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-[#F0EDE8] hover:border-gold disabled:opacity-60">
      {loading ? 'Refreshing…' : 'Refresh article'}
    </button>
  )
}
