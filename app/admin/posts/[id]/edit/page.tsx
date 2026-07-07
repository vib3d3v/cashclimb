import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import readingTime from 'reading-time'
import PostForm from '@/components/admin/PostForm'
import PostSaveToast from '@/components/admin/PostSaveToast'
import SEOChecklistCard from '@/components/admin/SEOChecklistCard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'
import { cleanupExternalLinks } from '@/lib/normalize-links'
import { cleanKeywordList, cleanSeoText, cleanSlugText, normalizeTargetKeyword } from '@/lib/seo/keyword-quality'

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
        coverUrl: null,
      })

  async function updatePost(formData: FormData) {
    'use server'

    const supabase = createAdminClient()
    const title = cleanSeoText(formData.get('title') || '')
    const body = await cleanupExternalLinks(cleanSeoText(formData.get('body') || ''), {
      validateExternal: true,
      removeInvalid: true,
    })
    const category = String(formData.get('category') || 'Personal Finance')
    const status = String(formData.get('status') || 'draft')
    const related = cleanKeywordList(String(formData.get('related_keywords') || ''))
    const primaryKeyword = normalizeTargetKeyword(formData.get('primary_keyword') || title)
    const seoTitle = cleanSeoText(formData.get('seo_title') || title)
    const seoDescription = cleanSeoText(formData.get('seo_description') || formData.get('excerpt') || '')

    const payload = {
      title,
      slug: cleanSlugText(formData.get('slug') || title),
      excerpt: cleanSeoText(formData.get('excerpt') || ''),
      body,
      category,
      author: cleanSeoText(formData.get('author') || 'CashClimb Editorial'),
      cover_url: null,
      published: status === 'published',
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      read_time: readingTime(body.replace(/<[^>]*>/g, ' ')).text,
      primary_keyword: primaryKeyword || null,
      related_keywords: related,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
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
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p>
        <h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">Edit post</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PostForm post={post} action={updatePost} submitLabel="Save post" />
        <SEOChecklistCard postId={params.id} evaluation={evaluation as any} />
      </div>
    </div>
  )
}
