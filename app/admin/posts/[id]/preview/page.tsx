export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorByName, resolvePostAuthorName } from '@/lib/authors'
import type { Post } from '@/types'

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function DraftPreviewPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const post = data as Post
  const author = getAuthorByName(resolvePostAuthorName(post))

  return (
    <main className="min-h-screen bg-bg text-[#F0EDE8]">
      <div className="border-b border-yellow-400/30 bg-yellow-400/10 px-6 py-4 text-yellow-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Draft Preview</p>
            <p className="mt-1 text-sm text-yellow-100/80">This page is visible only inside the admin area. It is not public until published.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-bg">Back to editor</Link>
            <Link href="/admin/posts" className="rounded-full border border-yellow-300/50 px-4 py-2 text-sm font-bold text-yellow-100">All posts</Link>
          </div>
        </div>
      </div>

      <article className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#9A9490]">
              <span className="text-gold">{post.category}</span>
              <span>{formatDate(post.updated_at || post.created_at)}</span>
              <span>{post.read_time}</span>
            </div>

            <h1 className="mt-4 font-serif text-4xl font-black leading-tight text-[#F0EDE8] md:text-5xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#B7B0AA]">{post.excerpt}</p>
          </div>

          <Link href={`/authors/${author.slug}`} className="mb-8 block rounded-2xl border border-border bg-bg-2 p-5 hover:border-gold">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-[#111214] text-sm font-bold text-[#F0EDE8]">{author.initials}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold">Written by</p>
                <h2 className="mt-1 font-bold text-[#F0EDE8]">{author.name}</h2>
                <p className="mt-1 text-sm text-[#9A9490]">{author.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B7B0AA]">{author.intro}</p>
              </div>
            </div>
          </Link>

          {post.cover_url ? (
            <div className="relative mb-10 aspect-[16/8] overflow-hidden rounded-3xl border border-border">
              <Image src={post.cover_url} alt={post.title} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="mb-10 rounded-3xl border border-dashed border-border bg-bg-2 p-10 text-center text-[#9A9490]">No cover image yet</div>
          )}

          <div className="prose-cashclimb" dangerouslySetInnerHTML={{ __html: post.body }} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Preview details</p>
            <div className="space-y-3 text-sm text-[#B7B0AA]">
              <p><strong className="text-[#F0EDE8]">Status:</strong> {post.published ? 'Published' : 'Draft'}</p>
              <p><strong className="text-[#F0EDE8]">Category:</strong> {post.category}</p>
              <p><strong className="text-[#F0EDE8]">Author:</strong> {author.name}</p>
            </div>
          </div>
        </aside>
      </article>
    </main>
  )
}
