export const dynamic = 'force-dynamic'

import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { createAdminClient } from '@/lib/supabase-server'

const KeywordGeneratorPanel = nextDynamic(() => import('@/components/admin/KeywordGeneratorPanel'), { ssr: false })
const KeywordRowActions = nextDynamic(() => import('@/components/admin/KeywordRowActions'), { ssr: false })

export default async function AdminKeywordsPage() {
  const supabase = createAdminClient()
  const { data: queue, error } = await supabase
    .from('keyword_queue')
    .select('id, keyword, category, intent, status, source, created_at, processed_at, brief, notes')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = queue ?? []
  const queuedCount = rows.filter((row: any) => row.status === 'queued').length

  return (
    <div className="space-y-8">
      <KeywordGeneratorPanel />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load keyword queue: {error.message}
        </div>
      )}

      <section className="rounded-3xl border border-border bg-bg-2 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-8 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#A46A38]">Keyword Queue</p>
            <h2 className="mt-2 font-serif text-3xl font-black">Queued and recent keywords</h2>
          </div>
          <span className="rounded-full bg-bg px-4 py-2 text-sm font-bold text-[#F0EDE8]">{queuedCount} queued</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                {['Keyword', 'Category', 'Intent', 'Status', 'Source', 'Added', 'Draft', 'Action'].map((heading) => (
                  <th key={heading} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.28em] text-[#9A9490]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => {
                const postId = row.brief?.post_id
                const postSlug = row.brief?.post_slug
                return (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-5 text-base text-[#F0EDE8]">{row.keyword}</td>
                    <td className="px-6 py-5 text-sm text-[#9A9490]">{row.category}</td>
                    <td className="px-6 py-5 text-sm text-[#9A9490]">{row.intent}</td>
                    <td className="px-6 py-5 text-sm capitalize text-[#F0EDE8]">{String(row.status).replace('_', ' ')}</td>
                    <td className="px-6 py-5 text-sm text-[#9A9490]">{row.source}</td>
                    <td className="px-6 py-5 text-sm text-[#9A9490]">{String(row.created_at).slice(0, 10)}</td>
                    <td className="px-6 py-5 text-sm">
                      {postId ? (
                        <div className="flex flex-col gap-1">
                          <Link href={`/admin/posts/${postId}/edit`} className="font-semibold text-gold hover:text-gold-light">View draft</Link>
                          {postSlug ? <Link href={`/blog/${postSlug}`} target="_blank" className="text-[#9A9490] hover:text-gold">Preview</Link> : null}
                        </div>
                      ) : (
                        <span className="text-[#9A9490]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      {postId ? (
                        <Link href={`/admin/posts/${postId}/edit`} className="font-semibold text-gold hover:text-gold-light">Edit draft</Link>
                      ) : (
                        <KeywordRowActions keywordId={row.id} keyword={row.keyword} status={row.status} />
                      )}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#9A9490]">No keywords in the queue yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
