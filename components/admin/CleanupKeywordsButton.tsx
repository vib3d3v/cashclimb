'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CleanupKeywordsButton() {
  const router = useRouter()

  async function cleanup() {
    if (!confirm('Remove duplicate keywords from the queue?')) return

    const res = await fetch('/api/admin/keywords/cleanup', {
      method: 'POST',
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(data.error || 'Cleanup failed')
      return
    }

    toast.success(`Removed ${data.removed ?? 0} duplicate keyword(s)`)
    router.refresh()
  }

  return (
    <button type="button" onClick={cleanup} className="cc-pill">
      Clean duplicates
    </button>
  )
}