export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import type { Post } from '@/types'

export default async function AdminWorkflowPage() {
  const supabase = createAdminClient()
  const [{ data: postRows }, { data: checksRows }] = await Promise.all([
    supabase.from('posts').select('*').order('updated_at', { ascending: false }),
    supabase.from('quality_checks').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  const posts = (postRows ?? []) as Array<Post & { status?: string | null; quality_score?: number | null; risk_level?: string | null }>
  const checks = checksRows ?? []
  const reviewQueue = posts.filter((post) => !post.published)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Workflow</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Editorial workflow</h1>
        <p className="mt-3 max-w-2xl text-[#9A9490]">Track draft status, quality checks, and publish readiness.</p>
      </div>

      <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
        <div className="border-b border-border px-5 py-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Draft and review queue</p></div>
        <div className="divide-y divide-border">
          {reviewQueue.map((post) => (
            <div key={post.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_110px] md:items-center">
              <div>
                <Link href={`/admin/posts/${post.id}/edit`} className="font-semibold text-[#F0EDE8] hover:text-gold">{post.title}</Link>
                <p className="mt-1 text-xs text-[#6A6460]">{post.category} · {post.read_time}</p>
              </div>
              <div className="text-sm text-[#9A9490]">Score: {post.quality_score ?? '—'}</div>
              <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full border border-border px-3 py-1.5 text-center text-xs text-[#F0EDE8] hover:border-gold">Review</Link>
            </div>
          ))}
          {!reviewQueue.length ? <div className="p-6 text-sm text-[#9A9490]">No drafts waiting for review.</div> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
        <div className="border-b border-border px-5 py-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Recent quality checks</p></div>
        {checks.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-widest text-[#6A6460]">
                <tr><th className="px-5 py-4">Post</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Risk</th><th className="px-5 py-4">Passed</th></tr>
              </thead>
              <tbody>
                {checks.map((check: any) => (
                  <tr key={check.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4 text-[#9A9490]">{check.post_id}</td>
                    <td className="px-5 py-4 text-[#F0EDE8]">{check.score}</td>
                    <td className="px-5 py-4 text-[#9A9490]">{check.risk_level}</td>
                    <td className="px-5 py-4">{check.passed ? <span className="text-emerald-400">Yes</span> : <span className="text-yellow-300">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6 text-sm text-[#9A9490]">No quality checks yet.</div>}
      </section>
    </div>
  )
}
