export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import readingTime from 'reading-time'
import CoverImageField from '@/components/admin/CoverImageField'
import SEOChecklistCard from '@/components/admin/SEOChecklistCard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import { getAuthorByName, resolvePostAuthorName } from '@/lib/authors'
import type { Category, Post, WorkflowEvaluation } from '@/types'

const CATEGORIES: Category[] = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

async function updatePost(formData: FormData) {
  'use server'

  const id = getString(formData, 'id')
  const title = getString(formData, 'title')
  const excerpt = getString(formData, 'excerpt')
  const body = getString(formData, 'body')
  const category = getString(formData, 'category') as Category
  const authorInput = getString(formData, 'author')
  const coverUrl = getString(formData, 'cover_url')
  const seoTitle = getString(formData, 'seo_title')
  const seoDescription = getString(formData, 'seo_description')
  const primaryKeyword = getString(formData, 'primary_keyword')
  const action = getString(formData, 'action')

  if (!id || !title || !excerpt || !body || !category) {
    throw new Error('Missing required post fields.')
  }

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
  const publishAllowed = action === 'publish' && evaluation.score >= 80 && evaluation.passed && Boolean(coverUrl)
  const status = publishAllowed ? 'published' : nextStatusFromEvaluation(evaluation)
  const stats = readingTime(body.replace(/<[^>]*>/g, ' '))
  const now = new Date().toISOString()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('posts')
    .update({
      title,
      excerpt,
      body,
      category,
      author: resolvePostAuthorName({ title, category, author: authorInput }),
      cover_url: coverUrl || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      primary_keyword: primaryKeyword || null,
      published: publishAllowed ? true : action === 'draft' ? false : undefined,
      status,
      quality_score: evaluation.score,
      risk_level: evaluation.risk_level,
      read_time: stats.text,
      published_at: publishAllowed ? now : undefined,
      updated_at: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await supabase.from('quality_checks').insert({
    post_id: id,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })

  redirect(`/admin/posts/${id}/edit`)
}

async function getLatestEvaluation(post: Post): Promise<WorkflowEvaluation> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('quality_checks')
    .select('*')
    .eq('post_id', post.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data?.checks && typeof data.score === 'number') {
    return {
      score: data.score,
      passed: Boolean(data.passed),
      risk_level: data.risk_level || 'medium',
      checks: data.checks,
    }
  }

  return evaluateFinanceArticle({
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    primaryKeyword: (post as any).primary_keyword ?? null,
    category: post.category,
    seoTitle: (post as any).seo_title ?? null,
    seoDescription: (post as any).seo_description ?? null,
    coverUrl: post.cover_url,
  })
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()

  const post = data as Post & {
    seo_title?: string | null
    seo_description?: string | null
    primary_keyword?: string | null
    quality_score?: number | null
    risk_level?: string | null
    status?: string | null
  }
  const evaluation = await getLatestEvaluation(post)
  const author = getAuthorByName(resolvePostAuthorName(post))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Edit post</p>
          <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">{post.title}</h1>
          <p className="mt-3 text-[#9A9490]">Current author: {author.name} · Status: {post.published ? 'Published' : post.status || 'Draft'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/posts" className="cc-btn-ghost">Back to posts</Link>
          {post.published ? <Link href={`/blog/${post.slug}`} className="cc-btn-primary">View live</Link> : <Link href={`/admin/posts/${post.id}/preview`} className="cc-btn-primary">Preview draft</Link>}
        </div>
      </div>

      <form action={updatePost} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <input type="hidden" name="id" value={post.id} />

        <div className="space-y-5 rounded-2xl border border-border bg-bg-2 p-6">
          <div>
            <label className="cc-label">Title</label>
            <input name="title" required defaultValue={post.title} className="cc-input w-full" />
          </div>

          <div>
            <label className="cc-label">Excerpt</label>
            <textarea name="excerpt" required defaultValue={post.excerpt} className="cc-input min-h-[110px] w-full" />
          </div>

          <div>
            <label className="cc-label">Body HTML</label>
            <textarea name="body" required defaultValue={post.body} className="cc-input min-h-[520px] w-full font-mono text-sm" />
          </div>

          <CoverImageField initialUrl={post.cover_url} />
        </div>

        <aside className="space-y-5">
          <SEOChecklistCard postId={post.id} evaluation={evaluation} />

          <div className="rounded-2xl border border-border bg-bg-2 p-5 space-y-4">
            <div>
              <label className="cc-label">Category</label>
              <select name="category" defaultValue={post.category} className="cc-input w-full">
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="cc-label">Author override</label>
              <input name="author" defaultValue={post.author ?? ''} className="cc-input w-full" placeholder="Leave blank for auto-author" />
            </div>
            <div>
              <label className="cc-label">Primary keyword</label>
              <input name="primary_keyword" defaultValue={post.primary_keyword ?? ''} className="cc-input w-full" />
            </div>
            <div>
              <label className="cc-label">SEO title</label>
              <input name="seo_title" defaultValue={post.seo_title ?? ''} className="cc-input w-full" />
            </div>
            <div>
              <label className="cc-label">SEO description</label>
              <textarea name="seo_description" defaultValue={post.seo_description ?? ''} className="cc-input min-h-[90px] w-full" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-2 p-5 space-y-3">
            <button name="action" value="save" className="cc-btn-primary w-full">Save changes</button>
            <button name="action" value="draft" className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-[#F0EDE8] hover:border-gold">Save as draft</button>
            <button name="action" value="publish" className="w-full rounded-lg border border-emerald-400/30 px-4 py-3 text-sm font-semibold text-emerald-300 hover:border-emerald-300">Publish if eligible</button>
            <p className="text-xs leading-relaxed text-[#6A6460]">Publishing requires score 80+, passing checks, and a cover image.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}
