import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import type { Category } from '@/types'
import CoverImageField from '@/components/admin/CoverImageField'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

const CATEGORIES: Category[] = [
  'Personal Finance',
  'Credit',
  'Retirement',
  'Investing',
  'Taxes',
  'Real Estate',
]

async function updatePostAction(formData: FormData) {
  'use server'

  const supabase = createAdminClient()

  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  const slug = String(formData.get('slug') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim()
  const body = String(formData.get('body') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const author = String(formData.get('author') || '').trim()
  const cover_url = String(formData.get('cover_url') || '').trim()
  const seo_title = String(formData.get('seo_title') || '').trim()
  const seo_description = String(formData.get('seo_description') || '').trim()
  const published = formData.get('published') === 'on'

  if (!id || !title || !slug || !excerpt || !body) {
    throw new Error('Missing required fields.')
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      slug,
      excerpt,
      body,
      category,
      author,
      cover_url: cover_url || null,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/admin/posts')
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      body,
      category,
      author,
      cover_url,
      seo_title,
      seo_description,
      published,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Edit Post</h1>
          <p className="mt-1 text-sm text-[#6A6460]">
            Update the article, SEO, cover image, and publication status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="rounded-lg border border-border px-4 py-2 text-sm text-[#9A9490] hover:text-white transition-colors"
          >
            Back
          </Link>

          {post.published ? (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="cc-btn-primary"
            >
              View Live
            </Link>
          ) : (
            <span className="rounded-lg bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400">
              Draft
            </span>
          )}
        </div>
      </div>

      <form action={updatePostAction} className="space-y-8">
        <input type="hidden" name="id" value={post.id} />

        <section className="rounded-xl border border-border bg-bg-2 p-6">
          <h2 className="text-lg font-bold">Content</h2>
          <div className="mt-5 grid gap-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Title
              </label>
              <input
                name="title"
                defaultValue={post.title ?? ''}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Slug
              </label>
              <input
                name="slug"
                defaultValue={post.slug ?? ''}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                defaultValue={post.excerpt ?? ''}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Body HTML
              </label>
              <textarea
                name="body"
                defaultValue={post.body ?? ''}
                rows={22}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold font-mono"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Rendered Preview
              </label>
              <div className="rounded-xl border border-border bg-bg px-6 py-6">
                <article
                  className="prose prose-invert max-w-none prose-headings:font-serif prose-a:text-gold hover:prose-a:text-gold-light"
                  dangerouslySetInnerHTML={{ __html: post.body ?? '' }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-2 p-6">
          <h2 className="text-lg font-bold">Metadata</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Category
              </label>
              <select
                name="category"
                defaultValue={post.category ?? 'Personal Finance'}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                Author
              </label>
              <input
                name="author"
                defaultValue={post.author ?? ''}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
              />
            </div>

            <CoverImageField initialUrl={post.cover_url ?? ''} title="Cover image" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-2 p-6">
          <h2 className="text-lg font-bold">SEO</h2>
          <div className="mt-5 grid gap-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                SEO Title
              </label>
              <input
                name="seo_title"
                defaultValue={post.seo_title ?? ''}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">
                SEO Description
              </label>
              <textarea
                name="seo_description"
                defaultValue={post.seo_description ?? ''}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-2 p-6">
          <h2 className="text-lg font-bold">Publishing</h2>
          <div className="mt-5 flex items-center gap-3">
            <input
              id="published"
              name="published"
              type="checkbox"
              defaultChecked={Boolean(post.published)}
              className="h-4 w-4 rounded border-border bg-bg"
            />
            <label htmlFor="published" className="text-sm text-[#D4CECA]">
              Publish this article
            </label>
          </div>

          <div className="mt-4 grid gap-4 text-xs text-[#6A6460] md:grid-cols-2">
            <div>
              Created:{' '}
              {post.created_at ? new Date(post.created_at).toLocaleString() : '—'}
            </div>
            <div>
              Updated:{' '}
              {post.updated_at ? new Date(post.updated_at).toLocaleString() : '—'}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/posts"
            className="rounded-lg border border-border px-4 py-2 text-sm text-[#9A9490] hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button type="submit" className="cc-btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}