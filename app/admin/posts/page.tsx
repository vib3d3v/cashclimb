export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import DeletePostButton from '@/components/admin/DeletePostButton'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

export default async function PostsPage() {
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p>
          <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">Posts</h1>
          <p className="mt-2 text-[#9A9490]">
            Edit drafts, review SEO scores, and publish approved articles.
          </p>
        </div>
        <Link href="/admin/posts/new" className="cc-btn-primary">
          New post
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
        <div className="grid grid-cols-[1fr_120px_90px_110px_180px] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#6A6460]">
          <span>Title</span>
          <span>Status</span>
          <span>Score</span>
          <span>Updated</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-border">
          {(posts ?? []).map((post: any) => {
            const postStatus = post.published ? 'published' : post.status || 'draft'

            return (
              <div
                key={post.id}
                className="grid grid-cols-[1fr_120px_90px_110px_180px] gap-4 px-5 py-4 hover:bg-bg-3"
              >
                <Link href={`/admin/posts/${post.id}/edit`} className="min-w-0">
                  <span className="block truncate font-semibold text-[#F0EDE8]">
                    {post.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#6A6460]">
                    /{post.slug} · {post.category}
                  </span>
                </Link>

                <span className="text-sm text-[#9A9490]">{postStatus}</span>
                <span className="text-sm text-[#9A9490]">{post.quality_score ?? '—'}</span>
                <span className="text-sm text-[#9A9490]">{formatDate(post.updated_at)}</span>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/posts/${post.id}/edit`} className="cc-pill">
                    Edit
                  </Link>

                  {post.slug ? (
                    <Link href={`/blog/${post.slug}`} className="cc-pill" target="_blank">
                      View
                    </Link>
                  ) : null}

                  <DeletePostButton postId={post.id} />
                </div>
              </div>
            )
          })}

          {!(posts ?? []).length ? (
            <div className="px-5 py-10 text-center text-[#9A9490]">No posts yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}