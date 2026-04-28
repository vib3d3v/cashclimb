'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })

const CATEGORIES = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

function getAdminKey(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cc-admin-key') ?? ''
}

const fieldClass =
  'w-full rounded-xl border border-border bg-[#111214] text-[#F0EDE8] placeholder:text-[#6A6460] px-4 py-3 outline-none transition-colors focus:border-gold'

const labelClass =
  'block text-sm font-medium text-[#F0EDE8] mb-2'

export default function NewPostPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    category: 'Investing',
    author: 'Daniel Reeves',
  })
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-admin-key': getAdminKey() },
        body: fd,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setCoverUrl(data.url)
      setCoverPreview(URL.createObjectURL(file))
      toast.success('Image uploaded!')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(published: boolean) {
    if (!form.title || !form.excerpt || !content || !form.author) {
      toast.error('Please fill in all required fields.')
      return
    }

    const adminKey = getAdminKey()
    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          ...form,
          content,
          cover_url: coverUrl || null,
          published,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(published ? 'Post published! 🎉' : 'Draft saved.')
      router.push('/admin/posts')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-gold mb-4">
            Publishing
          </p>
          <h1 className="font-serif text-5xl font-black leading-none mb-3">
            New Post
          </h1>
          <p className="text-[#9A9490] text-base max-w-2xl">
            Write, refine, and publish a new article that matches the CashClimb brand.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(false)}
            className="border border-border text-[#9A9490] text-xs font-bold tracking-widest uppercase px-4 py-3 rounded-xl transition-all hover:text-gold hover:border-gold"
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="border border-gold bg-gold text-black text-xs font-bold tracking-widest uppercase px-5 py-3 rounded-xl transition-all hover:opacity-90"
            disabled={saving}
          >
            {saving ? 'Publishing…' : 'Publish →'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-bg-2 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                className={`${fieldClass} text-lg`}
                placeholder="Enter a compelling headline..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>Excerpt *</label>
              <textarea
                className={`${fieldClass} min-h-[140px] resize-y`}
                placeholder="Write a concise, high-trust summary that makes readers want to keep going..."
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_220px_220px]">
              <div>
                <label className={labelClass}>Cover Image</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {coverPreview ? (
                    <div className="relative h-32 w-52 overflow-hidden rounded-2xl border border-border bg-[#111214]">
                      <Image
                        src={coverPreview}
                        alt="cover preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-52 items-center justify-center rounded-2xl border border-dashed border-border bg-[#111214] text-xs text-[#6A6460]">
                      No image selected
                    </div>
                  )}

                  <div className="pt-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      className="border border-border text-[#9A9490] text-xs font-bold tracking-widest uppercase px-4 py-3 rounded-xl transition-all hover:text-gold hover:border-gold"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading
                        ? 'Uploading…'
                        : coverPreview
                        ? 'Change Image'
                        : 'Upload Cover'}
                    </button>
                    <p className="mt-3 text-xs text-[#6A6460] leading-relaxed">
                      JPEG, PNG, WebP<br />Max 5 MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={fieldClass}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#111214] text-[#F0EDE8]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Author *</label>
                <input
                  className={fieldClass}
                  placeholder="Author name"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-bg-2 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <label className={labelClass}>Body *</label>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-[#111214]">
            <RichEditor value={content} onChange={setContent} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleSubmit(false)}
            className="border border-border text-[#9A9490] text-xs font-bold tracking-widest uppercase px-4 py-3 rounded-xl transition-all hover:text-gold hover:border-gold"
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="border border-gold bg-gold text-black text-xs font-bold tracking-widest uppercase px-5 py-3 rounded-xl transition-all hover:opacity-90"
            disabled={saving}
          >
            {saving ? 'Publishing…' : 'Publish →'}
          </button>
        </div>
      </div>
    </div>
  )
}