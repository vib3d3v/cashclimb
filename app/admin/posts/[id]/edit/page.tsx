export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import type { Post } from '@/types'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  const post = data as Post | null

  if (!post) notFound()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Edit post</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">{post.title}</h1>
      </div>

      <div className="rounded-2xl border border-border bg-bg-2 p-6">
        <p className="text-[#9A9490] leading-relaxed">
          This lightweight editor view is included to keep the admin route stable. Edit this post directly in Supabase or through your existing content workflow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/posts" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-[#F0EDE8] hover:border-gold">Back to posts</Link>
          {post.published ? (
            <Link href={`/blog/${post.slug}`} className="rounded-full border border-gold px-4 py-2 text-sm font-semibold text-gold">View article</Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
