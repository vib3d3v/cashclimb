export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-server'
import type { Comment } from '@/types'

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminCommentsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, posts(title, slug)')
    .order('created_at', { ascending: false })
    .limit(100)

  const comments = (data ?? []) as Array<Comment & { posts?: { title?: string; slug?: string } | null }>

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Comments</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Comment moderation</h1>
        <p className="mt-3 max-w-2xl text-[#9A9490]">Review, approve, or delete reader comments.</p>
      </div>

      <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-[#9A9490]">Comments table is not available yet.</div>
        ) : comments.length ? (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div key={comment.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-[#F0EDE8]">{comment.author_name}</p>
                    <span className={comment.approved ? 'text-xs text-emerald-400' : 'text-xs text-yellow-300'}>
                      {comment.approved ? 'Approved' : 'Pending'}
                    </span>
                    <span className="text-xs text-[#6A6460]">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6A6460]">{comment.author_email}</p>
                  <p className="mt-3 text-sm leading-7 text-[#D7D0CA]">{comment.body}</p>
                  {comment.posts?.title ? <p className="mt-3 text-xs text-[#9A9490]">On: {comment.posts.title}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end lg:self-start">
                  {!comment.approved ? (
                    <form action={`/api/admin/comments/${comment.id}/approve`} method="POST">
                      <button className="rounded-full border border-border px-3 py-1.5 text-xs text-[#F0EDE8] hover:border-gold">Approve</button>
                    </form>
                  ) : null}
                  <form action={`/api/admin/comments/${comment.id}/delete`} method="POST">
                    <button className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:border-red-300">Delete</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-[#9A9490]">No comments yet.</div>
        )}
      </section>
    </div>
  )
}
