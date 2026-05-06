export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorByName, resolvePostAuthorName } from '@/lib/authors'
import LinkCleanupButton from '@/components/admin/LinkCleanupButton'
import type { Post, Comment } from '@/types'

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [{ data: postRows }, { data: commentsRows }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(6),
  ])

  const posts = (postRows ?? []) as Post[]
  const comments = (commentsRows ?? []) as Comment[]
  const published = posts.filter((post) => post.published)
  const drafts = posts.filter((post) => !post.published)
  const totalViews = posts.reduce((sum, post) => sum + Number(post.view_count ?? 0), 0)
  const recentPosts = posts.slice(0, 6)
  const needsReview = posts.filter((post: any) => !post.published && ['review_required', 'draft'].includes(post.status ?? 'draft'))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Admin</p>
          <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">CashClimb Dashboard</h1>
          <p className="mt-3 max-w-2xl text-[#9A9490]">
            Manage articles, drafts, comments, workflow checks, and publishing from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/posts/new" className="cc-btn-primary">New post</Link>
          <Link href="/admin/posts" className="cc-btn-ghost">All posts</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total posts', posts.length],
          ['Published', published.length],
          ['Drafts', drafts.length],
          ['Views', totalViews.toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">{label}</p>
            <p className="text-4xl font-serif font-black mt-2 text-[#F0EDE8]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
        <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold">Recent posts</p>
              <p className="mt-1 text-sm text-[#6A6460]">Newest articles and drafts.</p>
            </div>
            <Link href="/admin/posts" className="text-sm font-semibold text-gold hover:opacity-80">View all →</Link>
          </div>

          <div className="divide-y divide-border">
            {recentPosts.map((post) => {
              const author = getAuthorByName(resolvePostAuthorName(post))
              return (
                <div key={post.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_140px_110px] md:items-center">
                  <div>
                    <Link href={`/admin/posts/${post.id}/edit`} className="font-semibold text-[#F0EDE8] hover:text-gold">
                      {post.title}
                    </Link>
                    <p className="mt-1 text-xs text-[#6A6460]">{post.category} · {author.name} · {formatDate(post.updated_at || post.created_at)}</p>
                  </div>
                  <span className={post.published ? 'text-sm text-emerald-400' : 'text-sm text-[#9A9490]'}>
                    {post.published ? 'Published' : (post as any).status || 'Draft'}
                  </span>
                  <div className="flex gap-2 md:justify-end">
                    <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">Edit</Link>
                    {post.published ? (
                      <Link href={`/blog/${post.slug}`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">View</Link>
                    ) : (
                      <Link href={`/admin/posts/${post.id}/preview`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">Preview</Link>
                    )}
                  </div>
                </div>
              )
            })}

            {!recentPosts.length ? (
              <div className="px-5 py-10 text-center text-[#9A9490]">No posts yet.</div>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Workflow</p>
            <p className="mt-3 text-3xl font-serif font-black text-[#F0EDE8]">{needsReview.length}</p>
            <p className="mt-2 text-sm text-[#9A9490]">Drafts or review items needing attention.</p>
            <Link href="/admin/workflow" className="mt-4 inline-flex text-sm font-semibold text-gold hover:opacity-80">Open workflow →</Link>
          </section>



          <section className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Site health</p>
            <p className="mt-3 text-3xl font-serif font-black text-[#F0EDE8]">Links</p>
            <p className="mt-2 text-sm text-[#9A9490]">Scan posts, replace known dead source URLs, and remove confirmed broken external links.</p>
            <LinkCleanupButton />
          </section>

          <section className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs uppercase tracking-widest text-gold font-bold">Recent comments</p>
            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border bg-bg p-3">
                  <p className="text-sm font-semibold text-[#F0EDE8]">{comment.author_name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#9A9490]">{comment.body}</p>
                </div>
              ))}
              {!comments.length ? <p className="text-sm text-[#9A9490]">No comments yet.</p> : null}
            </div>
            <Link href="/admin/comments" className="mt-4 inline-flex text-sm font-semibold text-gold hover:opacity-80">Manage comments →</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
