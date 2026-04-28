'use client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCookies } from '@/lib/use-cookies'

export default function CommentActions({ commentId, approved }: { commentId: string; approved: boolean }) {
  const router   = useRouter()
  const adminKey = useCookies('cc-admin-token')

  async function toggleApprove() {
    const res = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: commentId, approved: !approved }),
    })
    if (res.ok) { toast.success(approved ? 'Comment unapproved.' : 'Comment approved!'); router.refresh() }
    else toast.error('Action failed.')
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: commentId }),
    })
    if (res.ok) { toast.success('Comment deleted.'); router.refresh() }
    else toast.error('Delete failed.')
  }

  return (
    <div className="flex gap-3">
      <button onClick={toggleApprove}
        className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors
          ${approved
            ? 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
            : 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10'}`}>
        {approved ? 'Unapprove' : 'Approve'}
      </button>
      <button onClick={handleDelete}
        className="text-xs font-semibold px-3 py-1.5 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">
        Delete
      </button>
    </div>
  )
}
