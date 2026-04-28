'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function Comments({ postId, initial }: { postId: string; initial: Comment[] }) {
  const [comments, setComments] = useState(initial)
  const [form, setForm] = useState({ author_name: '', author_email: '', body: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.body.trim() || !form.author_name.trim() || !form.author_email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, post_id: postId }),
      })
      if (!res.ok) throw new Error()
      setForm({ author_name: '', author_email: '', body: '' })
      toast.success('Comment submitted! It will appear after approval.')
    } catch {
      toast.error('Failed to submit comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-serif text-2xl font-bold mb-8">
        Discussion <span className="text-gold">({comments.length})</span>
      </h2>

      {/* Existing comments */}
      {comments.length > 0 ? (
        <div className="space-y-6 mb-12">
          {comments.map(c => (
            <div key={c.id} className="bg-bg-2 border border-border rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-sm text-[#F0EDE8]">{c.author_name}</span>
                <span className="text-xs text-[#6A6460]">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-[#9A9490] text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#6A6460] text-sm mb-10">No comments yet. Be the first to share your thoughts.</p>
      )}

      {/* Comment form */}
      <div className="bg-bg-2 border border-border rounded-xl p-6">
        <h3 className="font-serif text-lg font-bold mb-5">Leave a Comment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="cc-label">Name *</label>
              <input
                className="cc-input"
                placeholder="Your name"
                value={form.author_name}
                onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="cc-label">Email *</label>
              <input
                type="email"
                className="cc-input"
                placeholder="your@email.com (not published)"
                value={form.author_email}
                onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="cc-label">Comment *</label>
            <textarea
              className="cc-input min-h-[120px] resize-y"
              placeholder="Share your thoughts..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="cc-btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Post Comment →'}
          </button>
        </form>
      </div>
    </section>
  )
}
