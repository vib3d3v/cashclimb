'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    category: 'Investing',
    author: '',
    published: false,
  })
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const adminKey = getAdminKey()

    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

    fetch(`/api/posts/${id}`, {
      headers: { 'x-admin-key': adminKey },
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed to load post')
        return data
      })
      .then((data) => {
        setForm({
          title: data.title,
          excerpt: data.excerpt,
          category: data.category,
          author: data.author,
          published: data.published,
        })
        setContent(data.body)
        setCoverUrl(data.cover_url ?? '')
        setCoverPreview(data.cover_url ?? '')
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load post')
        setLoading(false)
      })
  }, [id])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const adminKey = getAdminKey()
    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

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
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setCoverUrl(data.url)
      setCoverPreview(URL.createObjectURL(file))
      toast.success('Image uploaded!')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(published: boolean) {
    const adminKey = getAdminKey()
    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
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
      if (!res.ok) throw new Error(data.error || 'Save failed')

      toast.success('Post saved!')
      router.push('/admin/posts')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-[#6A6460] text-sm">Loading post…</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold">Edit Post</h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            className="cc-btn-ghost"
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="cc-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : form.published ? 'Update Live Post' : 'Publish →'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="cc-label">Title *</label>
          <input
            className="cc-input text-lg"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="cc-label">Excerpt *</label>
          <textarea
            className="cc-input min-h-[90px] resize-y"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
        </div>

        <div>
          <label className="cc-label">Cover Image</label>
          <div className="flex items-start gap-4">
            {coverPreview && (
              <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <Image src={coverPreview} alt="cover" fill className="object-cover" />
              </div>
            )}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                className="cc-btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Change Cover Image'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Category</label>
            <select
              className="cc-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="cc-label">Author</label>
            <input
              className="cc-input"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="cc-label">Body *</label>
          <RichEditor value={content} onChange={setContent} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={() => handleSave(false)}
            className="cc-btn-ghost"
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="cc-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes →'}
          </button>
        </div>
      </div>
    </div>
  )
}