'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

function extractPostId(pathname: string) {
  const parts = String(pathname || '').split('/').filter(Boolean)
  const postsIndex = parts.indexOf('posts')

  if (postsIndex === -1) return ''
  return parts[postsIndex + 1] || ''
}

export default function SEOFixButton({ postId }: { postId?: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    const resolvedPostId = String(postId || extractPostId(pathname) || '').trim()

    if (!resolvedPostId) {
      toast.error(`Missing post ID from ${pathname || 'current page'}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(resolvedPostId)}/fix-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Fix SEO failed')
        return
      }

      toast.success(`Fixed SEO. Score: ${data.score ?? 'updated'}`)
      router.refresh()

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      console.error('[SEOFixButton]', err)
      toast.error('Request failed')
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
      {loading ? 'Fixing SEO...' : 'Fix SEO Issues'}
    </button>
  )
}
