import { createAdminClient } from '@/lib/supabase-server'
import CommentActions from '@/components/CommentActions'

export default async function AdminCommentsPage() {
  const supabase = createAdminClient()
  const { data: comments } = await supabase
    .from('comments')
    .select('*, posts(title, slug)')
    .order('created_at', { ascending: false })

  const pending  = comments?.filter(c => !c.approved) ?? []
  const approved = comments?.filter(c => c.approved)  ?? []

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-8">Comments</h1>

      {/* Pending */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-semibold text-lg">Pending Approval</h2>
          {pending.length > 0 && (
            <span className="bg-yellow-400/15 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-[#6A6460] text-sm">No comments pending. ✓</p>
        ) : (
          <div className="space-y-3">
            {pending.map(c => <CommentRow key={c.id} comment={c} />)}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="font-semibold text-lg mb-4">Approved ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-[#6A6460] text-sm">No approved comments yet.</p>
        ) : (
          <div className="space-y-3">
            {approved.map(c => <CommentRow key={c.id} comment={c} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function CommentRow({ comment }: { comment: any }) {
  return (
    <div className="bg-bg-2 border border-border rounded-xl p-5">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div>
          <span className="font-semibold text-sm text-[#F0EDE8]">{comment.author_name}</span>
          <span className="text-[#6A6460] text-xs ml-2">{comment.author_email}</span>
          {comment.posts && (
            <span className="text-[#6A6460] text-xs ml-2">on "{comment.posts.title}"</span>
          )}
        </div>
        <span className="text-xs text-[#6A6460] flex-shrink-0">{comment.created_at?.slice(0, 10)}</span>
      </div>
      <p className="text-[#9A9490] text-sm leading-relaxed mb-4">{comment.body}</p>
      <CommentActions commentId={comment.id} approved={comment.approved} />
    </div>
  )
}
