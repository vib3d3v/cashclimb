export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createAdminClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeletePostButton from '@/components/DeletePostButton'
import EditorialActionButtons from '@/components/admin/EditorialActionButtons'
import { getAutoAuthor } from '@/lib/seo-authors'

type PostRow = {
  id: string
  title: string
  slug: string
  category: string | null
  author: string | null
  published: boolean
  status: 'draft' | 'review_required' | 'approved' | 'published' | 'rejected' | null
  quality_score: number | null
  risk_level: 'low' | 'medium' | 'high' | null
  view_count: number | null
  created_at: string | null
}

function resolveAuthorName(post: { author: string | null; category: string | null }) {
  const fallbackAuthor = getAutoAuthor('cashclimb', post.category || undefined)

  if (!post.author || post.author.toLowerCase().includes('editorial')) {
    return fallbackAuthor.name
  }

  return post.author
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return date.slice(0, 10)
}

function StatusBadge({ published, status }: { published: boolean; status: PostRow['status'] }) {
  const label = published ? 'Published' : status ?? 'draft'
  const tone =
    label === 'published'
      ? 'bg-emerald-400/10 text-emerald-400'
      : label === 'approved'
        ? 'bg-sky-400/10 text-sky-300'
        : label === 'review_required'
          ? 'bg-yellow-400/10 text-yellow-400'
          : label === 'rejected'
            ? 'bg-red-400/10 text-red-300'
            : 'bg-zinc-400/10 text-zinc-300'

  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold capitalize ${tone}`}>
      {String(label).replace('_', ' ')}
    </span>
  )
}

function PostsTable({
  posts,
  emptyMessage,
}: {
  posts: PostRow[]
  emptyMessage: string
}) {
  if (!posts.length) {
    return (
      <div className="text-center py-12 text-[#6A6460] text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {['Title', 'Category', 'Author', 'Views', 'Workflow', 'Date', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-bold tracking-widest uppercase text-[#6A6460]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr
              key={p.id}
              className="border-b border-border last:border-0 hover:bg-bg-3 transition-colors"
            >
              <td className="px-5 py-4">
                <div className="max-w-[320px]">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-[#6A6460] truncate">/{p.slug}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {p.quality_score !== null && (
                      <span className="rounded bg-bg px-2 py-1 text-[11px] text-[#BFB8B2]">
                        Score: {p.quality_score}
                      </span>
                    )}
                    {p.risk_level && (
                      <span className="rounded bg-bg px-2 py-1 text-[11px] capitalize text-[#BFB8B2]">
                        Risk: {p.risk_level}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-xs text-[#9A9490]">
                {p.category || '—'}
              </td>

              <td className="px-5 py-4 text-xs text-[#9A9490]">
                {resolveAuthorName(p)}
              </td>

              <td className="px-5 py-4 text-xs text-[#9A9490]">
                {p.view_count ?? 0}
              </td>

              <td className="px-5 py-4">
                <StatusBadge published={p.published} status={p.status} />
              </td>

              <td className="px-5 py-4 text-xs text-[#6A6460]">
                {formatDate(p.created_at)}
              </td>

              <td className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="text-xs text-[#9A9490] hover:text-gold transition-colors"
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="text-xs text-gold hover:text-gold-light transition-colors font-semibold"
                  >
                    Edit
                  </Link>

                  <EditorialActionButtons
                    postId={p.id}
                    status={
                    p.status === 'approved' ||
                    p.status === 'published' ||
                    p.status === 'review_required' ||
                    p.status === 'rejected'
                      ? p.status
                      : undefined
                  }
                  published={p.published}
                  compact
                />

                  <DeletePostButton postId={p.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminPostsPage() {
  const supabase = createAdminClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, author, published, status, quality_score, risk_level, view_count, created_at')
    .order('created_at', { ascending: false })

  const safePosts: PostRow[] = posts ?? []
  const draftPosts = safePosts.filter((post) => !post.published)
  const livePosts = safePosts.filter((post) => post.published)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="font-serif text-3xl font-bold">All Posts</h1>
          <p className="text-sm text-[#6A6460] mt-1">
            Manage drafts and published articles in one place.
          </p>
        </div>

        <Link href="/admin/posts/new" className="cc-btn-primary">
          + New Post
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load posts: {error.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-bg-2 border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">
            Total Posts
          </p>
          <p className="mt-2 text-2xl font-bold">{safePosts.length}</p>
        </div>

        <div className="bg-bg-2 border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">
            Drafts
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">{draftPosts.length}</p>
        </div>

        <div className="bg-bg-2 border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">
            Live
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{livePosts.length}</p>
        </div>
      </div>

      <section className="bg-bg-2 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Drafts</h2>
            <p className="text-sm text-[#6A6460]">
              Review these before publishing.
            </p>
          </div>

          <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-400/10 text-yellow-400">
            {draftPosts.length} draft{draftPosts.length === 1 ? '' : 's'}
          </span>
        </div>

        <PostsTable
          posts={draftPosts}
          emptyMessage="No drafts yet. Your daily automation drafts will appear here."
        />
      </section>

      <section className="bg-bg-2 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Published</h2>
            <p className="text-sm text-[#6A6460]">
              Articles currently live on the site.
            </p>
          </div>

          <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-400/10 text-emerald-400">
            {livePosts.length} live
          </span>
        </div>

        <PostsTable
          posts={livePosts}
          emptyMessage="No published posts yet."
        />
      </section>
    </div>
  )
}