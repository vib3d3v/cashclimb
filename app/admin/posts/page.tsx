export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { getAutoAuthor } from '@/lib/seo-authors'

type PostRow = {
  id: string
  title: string
  slug: string
  category: string | null
  author: string | null
  published: boolean | null
  created_at: string | null
}

function displayAuthor(post: PostRow) {
  const fallback = getAutoAuthor('cashclimb', post.category ?? undefined)
  if (!post.author || post.author.toLowerCase().includes('editorial')) return fallback.name
  return post.author
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return date.slice(0, 10)
}

export default async function AdminPostsPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, author, published, created_at')
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as PostRow[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">All Posts</h1>
          <p className="mt-1 text-sm text-[#6A6460]">Manage CashClimb articles.</p>
        </div>
        <Link href="/admin/posts/new" className="cc-btn-primary">
          + New Post
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load posts: {error.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-[#6A6460]">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Author</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <p className="font-medium text-[#F0EDE8]">{post.title}</p>
                  <p className="mt-1 text-xs text-[#6A6460]">/{post.slug}</p>
                </td>
                <td className="px-5 py-4 text-[#9A9490]">{post.category ?? '—'}</td>
                <td className="px-5 py-4 text-[#9A9490]">{displayAuthor(post)}</td>
                <td className="px-5 py-4 text-[#9A9490]">{post.published ? 'Published' : 'Draft'}</td>
                <td className="px-5 py-4 text-[#6A6460]">{formatDate(post.created_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <Link href={`/blog/${post.slug}`} className="text-gold hover:opacity-80" target="_blank">
                      View
                    </Link>
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-gold hover:opacity-80">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
