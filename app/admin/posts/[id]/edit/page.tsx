import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import slugify from 'slugify'
import readingTime from 'reading-time'
import PostForm from '@/components/admin/PostForm'
import PostSaveToast from '@/components/admin/PostSaveToast'
import SEOChecklistCard from '@/components/admin/SEOChecklistCard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'
import { normalizeLinksInHtml } from '@/lib/normalize-links'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  const { data: latestCheck } = await supabase
    .from('quality_checks')
    .select('*')
    .eq('post_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const evaluation = latestCheck
    ? {
        score: latestCheck.score,
        passed: latestCheck.passed,
        risk_level: latestCheck.risk_level,
        checks: latestCheck.checks,
      }
    : evaluateFinanceArticle({
        title: post.title || '',
        excerpt: post.excerpt || '',
        body: post.body || '',
        primaryKeyword: post.primary_keyword || '',
        category: post.category || 'Personal Finance',
        seoTitle: post.seo_title || '',
        seoDescription: post.seo_description || '',
        coverUrl: post.cover_url || '',
      })

  async function updatePost(formData: FormData) {
    'use server'

    const supabase = createAdminClient()

    const title = String(formData.get('title') || '').trim()
    const body = normalizeLinksInHtml(String(formData.get('body') || '').trim())
    const category = String(formData.get('category') || 'Personal Finance')
    const status = String(formData.get('status') || 'draft')

    const related = String(formData.get('related_keywords') || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

    const payload = {
      title,
      slug: slugify(String(formData.get('slug') || title), {
        lower: true,
        strict: true,
      }),
      excerpt: String(formData.get('excerpt') || '').trim(),
      body,
      category,
      author: String(formData.get('author') || 'CashClimb Editorial').trim(),
      cover_url: String(formData.get('cover_url') || '').trim() || null,
      published: status === 'published',
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      read_time: readingTime(body.replace(/<[^>]*>/g, ' ')).text,
      primary_keyword: String(formData.get('primary_keyword') || '').trim() || null,
      related_keywords: related,
      seo_title: String(formData.get('seo_title') || '').trim() || null,
      seo_description: String(formData.get('seo_description') || '').trim() || null,
    }

    const { error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', params.id)

    if (error) throw error

    redirect(`/admin/posts/${params.id}/edit?notice=saved`)
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <PostSaveToast />
      </Suspense>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gold">
          Admin
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">
          Edit post
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PostForm post={post} action={updatePost} submitLabel="Save post" />
        <SEOChecklistCard postId={post.id} evaluation={evaluation as any} />
      </div>
    </div>
  )
}