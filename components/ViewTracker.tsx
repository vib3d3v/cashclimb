'use client'
import { useEffect } from 'react'

export default function ViewTracker({ postId, path }: { postId: string; path: string }) {
  useEffect(() => {
    // Debounce: only track once per session per post
    const key = `viewed:${postId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, path }),
    }).catch(() => {}) // fire and forget
  }, [postId, path])

  return null
}
