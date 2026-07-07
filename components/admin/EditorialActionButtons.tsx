'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

type WorkflowStatus =
  | 'draft'
  | 'improving'
  | 'review_required'
  | 'ready_for_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected';

export default function EditorialActionButtons({
  postId,
  status,
  published,
  compact = false,
}: {
  postId: string
  status?: WorkflowStatus | null
  published?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const canRunChecks = status !== 'published'
  const canApprove = !published && ['ready_for_review', 'review_required', 'draft'].includes(String(status || 'draft'))
  const canPublish = !published && status === 'approved'

  const buttonClass = useMemo(
    () =>
      compact
        ? 'rounded px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
        : 'rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    [compact]
  )

  async function handleRunChecks() {
    setBusyAction('checks')
    try {
      const result = await authedFetch(`/api/admin/quality-checks/${postId}`, {
        method: 'POST',
      })
      toast.success(`Quality check complete. Score: ${result?.evaluation?.score ?? '—'}`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run quality check.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    } finally {
      setBusyAction(null)
    }
  }

  async function handleApprove() {
    const notes = typeof window !== 'undefined'
      ? window.prompt('Optional approval notes:', '') ?? ''
      : ''

    setBusyAction('approve')
    try {
      await authedFetch('/api/admin/articles/approve', {
        method: 'POST',
        body: JSON.stringify({ postId, notes: notes.trim() || null }),
      })
      toast.success('Post approved and ready to publish.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve post.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    } finally {
      setBusyAction(null)
    }
  }

  async function handlePublish() {
    if (typeof window !== 'undefined' && !window.confirm('Publish this article now?')) {
      return
    }

    const notes = typeof window !== 'undefined'
      ? window.prompt('Optional publish notes:', '') ?? ''
      : ''

    setBusyAction('publish')
    try {
      await authedFetch('/api/admin/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ postId, notes: notes.trim() || null }),
      })
      toast.success('Article published.')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish post.'
      toast.error(message)
      if (/session expired/i.test(message) && typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'justify-end'}`}>
      {canRunChecks && (
        <button
          type="button"
          onClick={handleRunChecks}
          disabled={busyAction !== null}
          className={`${buttonClass} border border-border text-[#D4CECA] hover:border-gold hover:text-white`}
        >
          {busyAction === 'checks' ? 'Running…' : 'Run Check'}
        </button>
      )}

      {canApprove && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={busyAction !== null}
          className={`${buttonClass} bg-sky-400/10 text-sky-300 hover:bg-sky-400/20`}
        >
          {busyAction === 'approve' ? 'Approving…' : status === 'ready_for_review' ? 'Approve for publishing' : 'Approve anyway'}
        </button>
      )}

      {canPublish && (
        <button
          type="button"
          onClick={handlePublish}
          disabled={busyAction !== null}
          className={`${buttonClass} bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20`}
        >
          {busyAction === 'publish' ? 'Publishing…' : 'Publish'}
        </button>
      )}
    </div>
  )
}
