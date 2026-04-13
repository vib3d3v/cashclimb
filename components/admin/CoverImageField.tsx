'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

type CoverImageFieldProps = {
  name?: string
  initialUrl?: string | null
  title?: string
}

function getAdminKey(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cc-admin-key') ?? ''
}

export default function CoverImageField({
  name = 'cover_url',
  initialUrl = '',
  title = 'Cover image',
}: CoverImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [coverUrl, setCoverUrl] = useState(initialUrl ?? '')
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? '')
  const [uploading, setUploading] = useState(false)

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
      setPreviewUrl(data.url)
      toast.success('Cover image uploaded!')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function clearCover() {
    setCoverUrl('')
    setPreviewUrl('')
  }

  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
        {title}
      </label>

      <input type="hidden" name={name} value={coverUrl} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <input
            value={coverUrl}
            onChange={(e) => {
              setCoverUrl(e.target.value)
              setPreviewUrl(e.target.value)
            }}
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
            placeholder="Paste image URL or upload below"
          />

          <div className="flex flex-wrap gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-border px-4 py-2 text-sm text-[#9A9490] hover:text-white transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : coverUrl ? 'Replace Image' : 'Upload Image'}
            </button>

            {coverUrl ? (
              <button
                type="button"
                onClick={clearCover}
                className="rounded-lg border border-border px-4 py-2 text-sm text-[#9A9490] hover:text-white transition-colors"
              >
                Remove Cover
              </button>
            ) : null}
          </div>

          <p className="text-xs text-[#6A6460] leading-relaxed">
            Uploaded image always wins over stock rotation. Leave this blank to keep using the automatic stock cover.
          </p>
        </div>

        <div>
          {previewUrl ? (
            <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border bg-bg">
              <Image
                src={previewUrl}
                alt={title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-44 w-full items-center justify-center rounded-xl border border-dashed border-border bg-bg text-xs text-[#6A6460]">
              No cover selected
            </div>
          )}
        </div>
      </div>
    </div>
  )
}