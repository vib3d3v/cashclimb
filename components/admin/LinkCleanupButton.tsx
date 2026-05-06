'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function LinkCleanupButton() {
  const [loading, setLoading] = useState(false)

  async function runCleanup() {
    if (loading) return

    const ok = window.confirm(
      'Scan all recent posts, replace known dead source links, and remove confirmed 404/410 links?'
    )

    if (!ok) return

    setLoading(true)

    try {
      const res = await fetch('/api/admin/links/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false, limit: 250 }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Link cleanup failed')
        return
      }

      toast.success(
        `Cleaned ${data.updatedPosts ?? 0} posts. Replaced ${data.replacedLinks ?? 0}, removed ${data.removedLinks ?? 0}.`
      )
    } catch (error) {
      console.error('[LinkCleanupButton]', error)
      toast.error('Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={runCleanup}
      disabled={loading}
      className="mt-4 inline-flex text-sm font-semibold text-gold hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Cleaning links...' : 'Clean broken links →'}
    </button>
  )
}
