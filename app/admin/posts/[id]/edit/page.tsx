export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { getAutoAuthor } from '@/lib/seo-authors'

type EditPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  author: string | null
  published: boolean | null
  updated_at: string | null
}

function displayAuthor(post: EditPost) {
  const fallback = getAutoAuthor('cashclimb', post.category ?? undefined)
  if (!post.author || post.author.toLowerCase().includes('editorial')) return fallback.name
  return post.author
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, category, author, published, updated_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()

  const post = data as EditPost

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/posts" className="text-sm font-semibold text-gold hover:opacity-80">
          ← Back to posts
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold">Edit Post</h1>
        <p className="mt-2 text-sm text-[#9A9490]">
          This safe editor view avoids missing admin-only components while keeping the site deployable.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-2 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6A6460]">Title</p>
          <p className="mt-1 text-lg font-semibold text-[#F0EDE8]">{post.title}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6A6460]">Slug</p>
          <p className="mt-1 text-sm text-[#9A9490]">/{post.slug}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6A6460]">Author shown publicly</p>
          <p className="mt-1 text-sm text-[#F0EDE8]">{displayAuthor(post)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6A6460]">Category</p>
          <p className="mt-1 text-sm text-[#F0EDE8]">{post.category ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6A6460]">Status</p>
          <p className="mt-1 text-sm text-[#F0EDE8]">{post.published ? 'Published' : 'Draft'}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/blog/${post.slug}`} target="_blank" className="cc-btn-primary">
          View Article
        </Link>
        <Link href="/admin/posts" className="cc-btn-ghost">
          Done
        </Link>
      </div>
    </div>
  )
}
