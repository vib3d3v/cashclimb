export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'

function SectionCard({ title, subtitle, count, href, tone }: { title: string; subtitle: string; count: number; href: string; tone: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-bg-2 p-5 transition-colors hover:border-gold">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6A6460]">{title}</p>
      <p className={`mt-3 text-3xl font-black ${tone}`}>{count}</p>
      <p className="mt-2 text-sm text-[#9A9490]">{subtitle}</p>
    </Link>
  )
}

export default async function WorkflowPage() {
  const supabase = createAdminClient()
  const [queueRes, reviewRes, approvedRes, publishedRes, qualityRes] = await Promise.all([
    supabase.from('keyword_queue').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'review_required'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('quality_checks').select('id, post_id, score, passed, risk_level, created_at, posts(title, slug)').order('created_at', { ascending: false }).limit(10),
  ])

  const recentChecks = qualityRes.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Editorial Workflow</h1>
        <p className="mt-1 text-sm text-[#9A9490]">CashClimb review-first automation for finance content.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SectionCard title="Queued Keywords" subtitle="Topics ready for generation" count={queueRes.count ?? 0} href="/admin/keywords" tone="text-gold" />
        <SectionCard title="Needs Review" subtitle="Drafts blocked for editorial review" count={reviewRes.count ?? 0} href="/admin/posts" tone="text-yellow-400" />
        <SectionCard title="Approved" subtitle="Ready to publish" count={approvedRes.count ?? 0} href="/admin/posts" tone="text-sky-400" />
        <SectionCard title="Published" subtitle="Live articles" count={publishedRes.count ?? 0} href="/admin/posts" tone="text-emerald-400" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-2">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">Recent Quality Checks</h2>
          <p className="text-sm text-[#6A6460]">Latest automated finance quality evaluations.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Post', 'Score', 'Passed', 'Risk', 'Checked'].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#6A6460]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentChecks.map((row: any) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 text-sm font-medium">
                    {row.posts?.slug ? <Link href={`/admin/posts/${row.post_id}/edit`} className="hover:text-gold">{row.posts?.title ?? row.post_id}</Link> : row.posts?.title ?? row.post_id}
                  </td>
                  <td className="px-5 py-4 text-sm">{row.score}</td>
                  <td className="px-5 py-4 text-sm">{row.passed ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-4 text-sm capitalize">{row.risk_level}</td>
                  <td className="px-5 py-4 text-sm text-[#9A9490]">{String(row.created_at).slice(0, 10)}</td>
                </tr>
              ))}
              {recentChecks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#6A6460]">No quality checks yet. Generate a draft from the keyword queue to see SEO checklist scores here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
