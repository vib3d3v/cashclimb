export const dynamic = 'force-dynamic'

import AutomationPanel from '@/components/admin/AutomationPanel'
import KeywordRowActions from '@/components/admin/KeywordRowActions'
import { createAdminClient } from '@/lib/supabase-server'

export default async function KeywordsPage() {
  const supabase = createAdminClient()
  const { data: keywords } = await supabase.from('keyword_queue').select('*').order('status', { ascending: true }).order('priority', { ascending: true }).limit(100)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p>
        <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">Keywords</h1>
        <p className="mt-2 text-[#9A9490]">Queue keyword ideas, then generate safe draft articles from the best opportunities.</p>
      </div>

      <AutomationPanel />

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-2">
        <div className="grid grid-cols-[1fr_130px_120px_130px] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#6A6460]">
          <span>Keyword</span><span>Category</span><span>Status</span><span>Action</span>
        </div>
        <div className="divide-y divide-border">
          {(keywords ?? []).map((item: any) => (
            <div key={item.id} className="grid grid-cols-[1fr_130px_120px_130px] gap-4 px-5 py-4">
              <div>
                <p className="font-semibold text-[#F0EDE8]">{item.keyword}</p>
                <p className="mt-1 text-xs text-[#6A6460]">{item.intent} · priority {item.priority}</p>
              </div>
              <p className="text-sm text-[#9A9490]">{item.category}</p>
              <p className="text-sm text-[#9A9490]">{item.status}</p>
              <KeywordRowActions keywordId={item.id} keyword={item.keyword} status={item.status} />
            </div>
          ))}
          {!(keywords ?? []).length ? <div className="px-5 py-10 text-center text-[#9A9490]">No keywords queued yet.</div> : null}
        </div>
      </section>
    </div>
  )
}
