export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-server'
import KeywordGeneratorPanel from '@/components/admin/KeywordGeneratorPanel'
import KeywordRowActions from '@/components/admin/KeywordRowActions'

type KeywordRow = {
  id: string
  keyword: string
  category?: string | null
  status?: string | null
  priority?: number | null
  created_at?: string | null
}

export default async function AdminKeywordsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('keyword_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const keywords = (data ?? []) as KeywordRow[]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Keywords</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Keyword queue</h1>
        <p className="mt-3 max-w-2xl text-[#9A9490]">
          Generate article ideas, queue topics, and draft the next CashClimb guides.
        </p>
      </div>

      <KeywordGeneratorPanel />

      <section className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Queued keywords</p>
        </div>

        {error ? (
          <div className="p-6 text-sm text-[#9A9490]">
            Keyword queue table is not available yet. Create or connect <code className="text-gold">keyword_queue</code> in Supabase to use this section.
          </div>
        ) : keywords.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-widest text-[#6A6460]">
                <tr>
                  <th className="px-5 py-4">Keyword</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-[#F0EDE8]">{row.keyword}</td>
                    <td className="px-5 py-4 text-[#9A9490]">{row.category || '—'}</td>
                    <td className="px-5 py-4 text-[#9A9490]">{row.status || 'queued'}</td>
                    <td className="px-5 py-4 text-[#9A9490]">{row.priority ?? '—'}</td>
                    <td className="px-5 py-4"><KeywordRowActions keywordId={row.id} keyword={row.keyword} status={row.status || 'queued'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-[#9A9490]">No keywords queued yet.</div>
        )}
      </section>
    </div>
  )
}
