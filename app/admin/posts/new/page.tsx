'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useCookies } from '@/lib/use-cookies'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })

const CATEGORIES = ['Investing', 'Personal Finance', 'Credit', 'Taxes', 'Real Estate', 'Retirement']

export default function NewPostPage() {
  const router   = useRouter()
  const adminKey = useCookies('cc-admin-token')
  const fileRef  = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', excerpt: '', category: 'Investing',
    author: '', published: false,
  })
  const [content,    setContent]    = useState('')
  const [coverUrl,   setCoverUrl]   = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [coverPreview, setCoverPreview] = useState('')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
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
    setSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ ...form, content, cover_url: coverUrl || null, published }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(published ? 'Post published! 🎉' : 'Draft saved.')
      router.push('/admin/posts')
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold">New Post</h1>
        <div className="flex gap-3">
          <button onClick={() => handleSubmit(false)} className="cc-btn-ghost" disabled={saving}>
            Save Draft
          </button>
          <button onClick={() => handleSubmit(true)} className="cc-btn-primary" disabled={saving}>
            {saving ? 'Publishing…' : 'Publish →'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="cc-label">Title *</label>
          <input className="cc-input text-lg" placeholder="Enter a compelling headline…"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        {/* Excerpt */}
        <div>
          <label className="cc-label">Excerpt *</label>
          <textarea className="cc-input min-h-[90px] resize-y" placeholder="1–2 sentence hook that makes readers click…"
            value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
        </div>

        {/* Cover image */}
        <div>
          <label className="cc-label">Cover Image</label>
          <div className="flex items-start gap-4">
            {coverPreview && (
              <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                <Image src={coverPreview} alt="cover preview" fill className="object-cover" />
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button type="button" className="cc-btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : coverPreview ? 'Change Image' : 'Upload Cover Image'}
              </button>
              <p className="text-xs text-[#6A6460] mt-2">JPEG, PNG, WebP · Max 5 MB</p>
            </div>
          </div>
        </div>

        {/* Category + Author */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Category *</label>
            <select className="cc-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="cc-label">Author *</label>
            <input className="cc-input" placeholder="Author name" value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
          </div>
        </div>

        {/* Rich editor */}
        <div>
          <label className="cc-label">Body *</label>
          <RichEditor value={content} onChange={setContent} />
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button onClick={() => handleSubmit(false)} className="cc-btn-ghost" disabled={saving}>Save Draft</button>
          <button onClick={() => handleSubmit(true)}  className="cc-btn-primary" disabled={saving}>
            {saving ? 'Publishing…' : 'Publish →'}
          </button>
        </div>
      </div>
    </div>
  )
}
