'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const focusOptions = ['Personal Finance', 'Credit', 'Investing', 'Retirement', 'Taxes', 'Real Estate']
const audienceOptions = ['Beginners', 'Young professionals', 'Families', 'Freelancers', 'Homebuyers', 'Mixed']
const intentOptions = ['Mixed', 'Beginner guide', 'Checklist', 'Comparison', 'Mistakes', 'Glossary']
const marketOptions = ['US', 'US / Canada / UK / Australia']
const riskOptions = ['Low', 'Medium']
const countOptions = [10, 20, 30]

async function authedFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  const payload = await response.json().catch(() => null)

  if (response.status === 401) {
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed')
  }

  return payload
}

export default function KeywordGeneratorPanel() {
  const router = useRouter()
  const [howMany, setHowMany] = useState('20')
  const [focus, setFocus] = useState('Personal Finance')
  const [audience, setAudience] = useState('Beginners')
  const [intentMix, setIntentMix] = useState('Mixed')
  const [riskTolerance, setRiskTolerance] = useState('Low')
  const [market, setMarket] = useState('US / Canada / UK / Australia')
  const [seasonal, setSeasonal] = useState(true)
  const [busy, setBusy] = useState<'keywords' | 'draft1' | 'draft3' | null>(null)

  async function handleGenerateKeywords() {
    setBusy('keywords')
    try {
      const result = await authedFetch('/api/admin/keywords/generate', {
        method: 'POST',
        body: JSON.stringify({ howMany, focus, audience, intentMix, riskTolerance, market, seasonal }),
      })
      toast.success(`Added ${result.inserted ?? 0} keywords to the queue.`)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate keywords.'
      toast.error(message)
      if (/session expired/i.test(message)) {
        window.location.href = `/admin/login?from=${encodeURIComponent('/admin/keywords')}`
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleDraft(count: number) {
    setBusy(count === 1 ? 'draft1' : 'draft3')
    try {
      const result = await authedFetch(`/api/cron/daily-draft?count=${count}`, { method: 'GET' })
      const created = Array.isArray(result.results)
        ? result.results.filter((item: any) => item.created).length
        : result.created ? 1 : 0

      toast.success(
        created > 0
          ? `Created ${created} draft article${created === 1 ? '' : 's'}.`
          : result?.reason || 'No draft created this run.'
      )
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create drafts.'
      toast.error(message)
      if (/session expired/i.test(message)) {
        window.location.href = `/admin/login?from=${encodeURIComponent('/admin/keywords')}`
      }
    } finally {
      setBusy(null)
    }
  }

  const selectClass = 'w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-gold'

  return (
    <section className="rounded-3xl border border-border bg-bg-2 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#A46A38]">AI Keyword Ideas</p>
      <h1 className="mt-3 font-serif text-4xl font-black text-[#F3EEE8]">Generate keywords automatically</h1>
      <p className="mt-3 text-lg text-[#9A9490]">Create fresh finance keyword ideas and turn them into drafts.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">How many</label>
          <select className={selectClass} value={howMany} onChange={(e) => setHowMany(e.target.value)}>
            {countOptions.map((value) => <option key={value} value={String(value)}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">Focus</label>
          <select className={selectClass} value={focus} onChange={(e) => setFocus(e.target.value)}>
            {focusOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">Audience</label>
          <select className={selectClass} value={audience} onChange={(e) => setAudience(e.target.value)}>
            {audienceOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">Intent mix</label>
          <select className={selectClass} value={intentMix} onChange={(e) => setIntentMix(e.target.value)}>
            {intentOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">Risk tolerance</label>
          <select className={selectClass} value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value)}>
            {riskOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4CECA]">Country / market</label>
          <select className={selectClass} value={market} onChange={(e) => setMarket(e.target.value)}>
            {marketOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-3 pt-8 text-sm text-[#D4CECA]">
          <input type="checkbox" checked={seasonal} onChange={(e) => setSeasonal(e.target.checked)} className="h-4 w-4" />
          Include seasonal topics
        </label>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={handleGenerateKeywords} disabled={busy !== null} className="cc-btn-primary disabled:opacity-60">
          {busy === 'keywords' ? 'Generating…' : 'Generate keyword ideas'}
        </button>
        <button type="button" onClick={() => handleDraft(1)} disabled={busy !== null} className="rounded-full border border-border px-6 py-3 font-semibold text-[#F0EDE8] hover:border-gold disabled:opacity-60">
          {busy === 'draft1' ? 'Drafting…' : 'Generate next draft now'}
        </button>
        <button type="button" onClick={() => handleDraft(3)} disabled={busy !== null} className="rounded-full border border-border px-6 py-3 font-semibold text-[#F0EDE8] hover:border-gold disabled:opacity-60">
          {busy === 'draft3' ? 'Drafting…' : 'Generate next 3 drafts'}
        </button>
      </div>
    </section>
  )
}