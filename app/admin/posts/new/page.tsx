export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import slugify from 'slugify'
import readingTime from 'reading-time'
import RichEditor from '@/components/RichEditor'
import CoverImageField from '@/components/admin/CoverImageField'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import { resolvePostAuthorName } from '@/lib/authors'
import type { Category } from '@/types'

const CATEGORIES: Category[] = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

async function createPost(formData: FormData) {
  'use server'

  const title = String(formData.get('title') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim()
  const body = String(formData.get('body') || '').trim()
  const category = String(formData.get('category') || 'Personal Finance') as Category
  const authorInput = String(formData.get('author') || '').trim()
  const coverUrl = String(formData.get('cover_url') || '').trim()
  const seoTitle = String(formData.get('seo_title') || '').trim()
  const seoDescription = String(formData.get('seo_description') || '').trim()
  const primaryKeyword = String(formData.get('primary_keyword') || '').trim()
  const shouldPublish = formData.get('publish') === 'true'

  if (!title || !excerpt || !body || !category) {
    throw new Error('Title, excerpt, body, and category are required.')
  }

  const slug = slugify(title, { lower: true, strict: true })
  const stats = readingTime(body.replace(/<[^>]*>/g, ' '))
  const evaluation = evaluateFinanceArticle({
    title,
    excerpt,
    body,
    primaryKeyword: primaryKeyword || null,
    category,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    coverUrl: coverUrl || null,
  })

  const publishAllowed = shouldPublish && evaluation.score >= 80 && evaluation.passed && Boolean(coverUrl)
  const status = publishAllowed ? 'published' : nextStatusFromEvaluation(evaluation)
  const now = new Date().toISOString()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      excerpt,
      body,
      category,
      author: resolvePostAuthorName({ title, category, author: authorInput }),
      cover_url: coverUrl || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      primary_keyword: primaryKeyword || null,
      published: publishAllowed,
      status,
      quality_score: evaluation.score,
      risk_level: evaluation.risk_level,
      read_time: stats.text,
      published_at: publishAllowed ? now : null,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('quality_checks').insert({
    post_id: data.id,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })

  redirect(`/admin/posts/${data.id}/edit`)
}

export default function NewPostPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">New post</p>
        <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Create article</h1>
        <p className="mt-3 max-w-2xl text-[#9A9490]">
          Draft a CashClimb article. Publishing is blocked unless the article passes the editorial gate.
        </p>
      </div>

      <form action={createPost} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 rounded-2xl border border-border bg-bg-2 p-6">
          <div>
            <label className="cc-label">Title</label>
            <input name="title" required className="cc-input w-full" placeholder="Article title" />
          </div>

          <div>
            <label className="cc-label">Excerpt</label>
            <textarea name="excerpt" required className="cc-input min-h-[110px] w-full" placeholder="Short summary for cards and metadata" />
          </div>

          <div>
            <label className="cc-label">Body HTML</label>
            <textarea name="body" required className="cc-input min-h-[420px] w-full font-mono text-sm" placeholder="Paste or write article HTML here. Use h2, p, ul, and links." />
            <p className="mt-2 text-xs text-[#6A6460]">Tip: include Key Takeaways, 4+ H2 sections, examples, internal links, and FAQ.</p>
          </div>

          <CoverImageField />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-bg-2 p-5">
            <label className="cc-label">Category</label>
            <select name="category" className="cc-input w-full">
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          <div className="rounded-2xl border border-border bg-bg-2 p-5 space-y-4">
            <div>
              <label className="cc-label">Author override</label>
              <input name="author" className="cc-input w-full" placeholder="Leave blank for auto-author" />
            </div>
            <div>
              <label className="cc-label">Primary keyword</label>
              <input name="primary_keyword" className="cc-input w-full" />
            </div>
            <div>
              <label className="cc-label">SEO title</label>
              <input name="seo_title" className="cc-input w-full" />
            </div>
            <div>
              <label className="cc-label">SEO description</label>
              <textarea name="seo_description" className="cc-input min-h-[90px] w-full" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-2 p-5 space-y-3">
            <button name="publish" value="false" className="cc-btn-primary w-full">Save draft</button>
            <button name="publish" value="true" className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-[#F0EDE8] hover:border-gold">Publish if eligible</button>
          </div>
        </aside>
      </form>
    </div>
  )
}
