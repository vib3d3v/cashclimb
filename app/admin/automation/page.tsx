export const dynamic = 'force-dynamic'

import Link from 'next/link'
import AutomationPanel from '@/components/admin/AutomationPanel'
import CleanupKeywordsButton from '@/components/admin/CleanupKeywordsButton'
import { createAdminClient } from '@/lib/supabase-server'

export default async function AutomationPage() {
  const supabase = createAdminClient()

  const [{ data: keywords }, { data: runs }, { data: posts }] = await Promise.all([
    supabase
      .from('keyword_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(12),

    supabase
      .from('generation_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('posts')
      .select('id,title,slug,status,quality_score,created_at')
      .eq('published', false)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gold">
          CashClimb
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">
          Content automation
        </h1>
        <p className="mt-3 max-w-3xl text-[#9A9490]">
          Generate keywords, create draft articles, and only publish after the SEO and safety checklist passes.
        </p>
      </div>

      <AutomationPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              Drafts created
            </p>
          </div>

          <div className="divide-y divide-border">
            {(posts ?? []).map((post: any) => (
              <div key={post.id} className="px-5 py-4">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="font-semibold text-[#F0EDE8] hover:text-gold"
                >
                  {post.title}
                </Link>
                <p className="mt-1 text-xs text-[#6A6460]">
                  {post.status || 'draft'} · Score {post.quality_score ?? 'not checked'}
                </p>
              </div>
            ))}

            {!(posts ?? []).length ? (
              <div className="px-5 py-8 text-sm text-[#9A9490]">
                No drafts yet.
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              Keyword queue
            </p>

            <CleanupKeywordsButton />
          </div>

          <div className="divide-y divide-border">
            {(keywords ?? []).map((item: any) => (
              <div key={item.id} className="px-5 py-4">
                <p className="font-semibold text-[#F0EDE8]">{item.keyword}</p>
                <p className="mt-1 text-xs text-[#6A6460]">
                  {item.category} · {item.intent} · {item.status}
                </p>
              </div>
            ))}

            {!(keywords ?? []).length ? (
              <div className="px-5 py-8 text-sm text-[#9A9490]">
                No queued keywords yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">
            Recent generation runs
          </p>
        </div>

        <div className="divide-y divide-border">
          {(runs ?? []).map((run: any) => (
            <div
              key={run.id}
              className="grid gap-2 px-5 py-4 md:grid-cols-[160px_1fr_120px]"
            >
              <p className="text-sm text-[#9A9490]">
                {new Date(run.created_at).toLocaleString()}
              </p>
              <p className="font-semibold text-[#F0EDE8]">{run.step}</p>
              <p
                className={
                  run.status === 'completed'
                    ? 'text-emerald-300'
                    : run.status === 'failed'
                      ? 'text-red-300'
                      : 'text-yellow-300'
                }
              >
                {run.status}
              </p>
            </div>
          ))}

          {!(runs ?? []).length ? (
            <div className="px-5 py-8 text-sm text-[#9A9490]">
              No generation runs yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}