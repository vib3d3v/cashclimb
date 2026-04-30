'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

type Props = {
  keywordId: string
  keyword: string
  status: string
}

export default function KeywordRowActions({ keywordId, keyword, status }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleGenerateDraft() {
    setBusy(true)
    try {
      const result = await authedFetch('/api/admin/automation/draft', {
        method: 'POST',
        body: JSON.stringify({ keywordId }),
      })

      if (result?.created && result?.post?.id) {
        toast.success(`Draft created for “${keyword}”.`)
      } else if (result?.skipped) {
        toast(result.reason || 'Keyword was skipped.')
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Draft generation finished.')
      }

      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate draft.'
      toast.error(message)
      if (/session expired/i.test(message)) {
        window.location.href = `/admin/login?from=${encodeURIComponent('/admin/keywords')}`
      }
    } finally {
      setBusy(false)
    }
  }

  const normalizedStatus = String(status).toLowerCase()
  const canGenerate = normalizedStatus === 'queued' || normalizedStatus === 'failed'
  const isDisabled = busy || !canGenerate

  return (
    <button
      type="button"
      onClick={handleGenerateDraft}
      disabled={isDisabled}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-[#F0EDE8] hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? 'Drafting…' : normalizedStatus === 'failed' ? 'Retry draft' : 'Generate draft'}
    </button>
  )
}
