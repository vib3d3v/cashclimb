'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authedFetch } from './authedFetch'

const categories = ['Mixed', 'Personal Finance', 'Credit', 'Investing', 'Retirement', 'Taxes', 'Real Estate']

export default function AutomationPanel() {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [focus, setFocus] = useState('Mixed')
  const [keywordCount, setKeywordCount] = useState('10')
  const [draftCount, setDraftCount] = useState('1')

  async function run(path: string, label: string, body: Record<string, unknown> = {}) {
    setBusy(label)
    try {
      const result = await authedFetch(path, { method: 'POST', body: JSON.stringify(body) })
      if (path.includes('/keywords')) toast.success(`Added ${result.inserted ?? 0} keywords.`)
      else if (path.includes('/draft')) toast.success(result.created ? 'Draft created.' : result.reason || 'No draft created.')
      else toast.success('Automation run complete.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Automation failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-bg-2 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Automation</p>
          <h2 className="mt-2 font-serif text-3xl font-black text-[#F0EDE8]">Keyword to draft engine</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#9A9490]">
            Generates SEO-focused keywords, creates safe finance drafts, runs the checklist, and keeps everything unpublished until you approve it.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button className="cc-btn-ghost disabled:opacity-60" disabled={!!busy} onClick={() => run('/api/admin/automation/keywords', 'keywords', { focus, howMany: keywordCount })}>
            {busy === 'keywords' ? 'Working…' : 'Generate keywords'}
          </button>
          <button className="cc-btn-ghost disabled:opacity-60" disabled={!!busy} onClick={() => run('/api/admin/automation/draft', 'draft')}>
            {busy === 'draft' ? 'Working…' : 'Draft next'}
          </button>
          <button className="cc-btn-primary disabled:opacity-60" disabled={!!busy} onClick={() => run('/api/admin/automation/run', 'run', { focus, keywordCount, draftCount })}>
            {busy === 'run' ? 'Working…' : 'Run batch'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Focus</span>
          <select className="cc-input" value={focus} onChange={(event) => setFocus(event.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Keywords</span>
          <input className="cc-input" value={keywordCount} onChange={(event) => setKeywordCount(event.target.value)} inputMode="numeric" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Drafts</span>
          <input className="cc-input" value={draftCount} onChange={(event) => setDraftCount(event.target.value)} inputMode="numeric" />
        </label>
      </div>
    </section>
  )
}
