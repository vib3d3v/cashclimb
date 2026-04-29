export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import type { Post, Comment } from '@/types'

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient()
  const [{ data: postRows }, { data: commentRows }] = await Promise.all([
    supabase.from('posts').select('*').order('view_count', { ascending: false }),
    supabase.from('comments').select('*').order('created_at', { ascending: false }),
  ])

  const posts = (postRows ?? []) as Post[]
  const comments = (commentRows ?? []) as Comment[]
  const totalViews = posts.reduce((sum, post) => sum + Number(post.view_count ?? 0), 0)
  const topPosts = posts.slice(0, 10)
  const categoryViews = posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.category] = (acc[post.category] ?? 0) + Number(post.view_count ?? 0)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Analytics</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Site analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total views', totalViews.toLocaleString()],
          ['Published posts', posts.filter((post) => post.published).length],
          ['Comments', comments.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">{label}</p>
            <p className="text-4xl font-serif font-black mt-2 text-[#F0EDE8]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
          <div className="border-b border-border px-5 py-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Top posts</p></div>
          <div className="divide-y divide-border">
            {topPosts.map((post) => (
              <Link key={post.id} href={`/admin/posts/${post.id}/edit`} className="block px-5 py-4 hover:bg-bg-3">
                <p className="font-semibold text-[#F0EDE8]">{post.title}</p>
                <p className="mt-1 text-xs text-[#9A9490]">{Number(post.view_count ?? 0).toLocaleString()} views</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
          <div className="border-b border-border px-5 py-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Views by category</p></div>
          <div className="divide-y divide-border">
            {Object.entries(categoryViews).map(([category, views]) => (
              <div key={category} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="text-[#F0EDE8]">{category}</span>
                <span className="text-[#9A9490]">{views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
