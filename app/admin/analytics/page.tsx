export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'

function pct(value: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

export default async function AnalyticsPage() {
  const supabase = createAdminClient()

  const [postsResult, keywordsResult, runsResult] = await Promise.all([
    supabase.from('posts').select('id,title,slug,published,status,quality_score,risk_level,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('keyword_queue').select('id,keyword,status,priority,created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('generation_runs').select('id,type,status,created_at').order('created_at', { ascending: false }).limit(20),
  ])

  const posts = postsResult.data ?? []
  const keywords = keywordsResult.data ?? []
  const runs = runsResult.data ?? []

  const published = posts.filter((post: any) => post.published).length
  const drafts = posts.length - published
  const passed = posts.filter((post: any) => Number(post.quality_score ?? 0) >= 80).length
  const queuedKeywords = keywords.filter((keyword: any) => keyword.status === 'queued').length

  const cards = [
    { label: 'Posts tracked', value: posts.length, note: `${published} published, ${drafts} drafts` },
    { label: 'SEO pass rate', value: pct(passed, posts.length), note: 'Posts scoring 80+' },
    { label: 'Keywords', value: keywords.length, note: `${queuedKeywords} still queued` },
    { label: 'Automation runs', value: runs.length, note: 'Recent generation activity' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p>
          <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">Analytics</h1>
          <p className="mt-2 text-[#9A9490]">A simple admin health view for posts, keywords, quality scores, and automation activity.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/automation" className="cc-btn-ghost">Automation</Link>
          <Link href="/admin/posts" className="cc-btn-primary">Posts</Link>
        </div>
      </div>

      {(postsResult.error || keywordsResult.error || runsResult.error) ? (
        <section className="rounded-2xl border border-border bg-bg-2 p-5 text-sm text-[#9A9490]">
          <p className="font-semibold text-[#F0EDE8]">Some analytics data could not load.</p>
          <p className="mt-2">If this is a fresh install, run the automation Supabase migration first. The page will still load with the data that is available.</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-bg-2 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6A6460]">{card.label}</p>
            <div className="mt-3 text-3xl font-black text-[#F0EDE8]">{card.value}</div>
            <p className="mt-2 text-sm text-[#9A9490]">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Recent content</p>
        </div>
        <div className="divide-y divide-border">
          {posts.slice(0, 10).map((post: any) => (
            <Link key={post.id} href={`/admin/posts/${post.id}/edit`} className="grid gap-2 px-5 py-4 hover:bg-bg-3 md:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
              <div>
                <p className="font-semibold text-[#F0EDE8]">{post.title}</p>
                <p className="mt-1 text-xs text-[#6A6460]">/{post.slug}</p>
              </div>
              <p className="text-sm text-[#9A9490]">{post.published ? 'published' : post.status || 'draft'}</p>
              <p className="text-sm text-[#9A9490]">Score: {post.quality_score ?? '-'}</p>
              <p className="text-sm text-[#9A9490]">{formatDate(post.updated_at || post.created_at)}</p>
            </Link>
          ))}
          {!posts.length ? <div className="px-5 py-10 text-center text-[#9A9490]">No posts found.</div> : null}
        </div>
      </section>
    </div>
  )
}
