'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAutoAuthor } from '@/lib/seo-authors'

const CATEGORIES = ['Investing', 'Personal Finance', 'Credit', 'Taxes', 'Real Estate', 'Retirement']

function getAdminKey() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cc-admin-key') ?? ''
}

const inputClass = 'w-full rounded-xl border border-border bg-[#111214] px-4 py-3 text-[#F0EDE8] outline-none focus:border-gold'
const labelClass = 'mb-2 block text-sm font-semibold text-[#F0EDE8]'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', excerpt: '', category: 'Personal Finance', cover_url: '', body: '', published: false })
  const fallbackAuthor = getAutoAuthor('cashclimb', form.category)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
      body: JSON.stringify({
        title: form.title,
        excerpt: form.excerpt,
        category: form.category,
        author: fallbackAuthor.name,
        cover_url: form.cover_url || null,
        content: form.body,
        published: form.published,
      }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      alert(data?.error ?? 'Failed to save post')
      return
    }

    router.push('/admin/posts')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">New Post</h1>
        <p className="mt-2 text-sm text-[#9A9490]">Author will be assigned automatically as {fallbackAuthor.name}.</p>
      </div>

      <div>
        <label className={labelClass}>Title</label>
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>

      <div>
        <label className={labelClass}>Excerpt</label>
        <textarea className={inputClass} rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Cover image URL</label>
          <input className={inputClass} value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Body HTML</label>
        <textarea className={inputClass} rows={18} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
      </div>

      <label className="flex items-center gap-3 text-sm text-[#F0EDE8]">
        <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
        Publish immediately
      </label>

      <button type="submit" disabled={saving} className="cc-btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Post'}
      </button>
    </form>
  )
}
