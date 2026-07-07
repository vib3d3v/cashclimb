import { redirect } from 'next/navigation'
import readingTime from 'reading-time'
import PostForm from '@/components/admin/PostForm'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'
import { cleanKeywordList, cleanSeoText, cleanSlugText, normalizeTargetKeyword } from '@/lib/seo/keyword-quality'

export default function NewPostPage() {
  async function createPost(formData: FormData) {
    'use server'
    const supabase = createAdminClient()
    const title = cleanSeoText(formData.get('title') || '')
    const body = cleanSeoText(formData.get('body') || '')
    const category = String(formData.get('category') || 'Personal Finance')
    const status = String(formData.get('status') || 'draft')
    const primaryKeyword = normalizeTargetKeyword(formData.get('primary_keyword') || title)
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
      read_time: readingTime(body.replace(/<[^>]*>/g, ' ')).text,
      primary_keyword: primaryKeyword || null,
      related_keywords: cleanKeywordList(formData.get('related_keywords') || ''),
      seo_title: cleanSeoText(formData.get('seo_title') || title) || null,
      seo_description: cleanSeoText(formData.get('seo_description') || formData.get('excerpt') || '') || null,
    }
    const evaluation = evaluateFinanceArticle({ title: payload.title, excerpt: payload.excerpt, body: payload.body, primaryKeyword: payload.primary_keyword, category, seoTitle: payload.seo_title, seoDescription: payload.seo_description, coverUrl: null })
    const { data, error } = await supabase.from('posts').insert({ ...payload, quality_score: evaluation.score, risk_level: evaluation.risk_level }).select('id').single()
    if (error) throw error
    await supabase.from('quality_checks').insert({ post_id: data.id, score: evaluation.score, passed: evaluation.passed, risk_level: evaluation.risk_level, checks: evaluation.checks })
    redirect(`/admin/posts/${data.id}/edit?notice=saved`)
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-gold">Admin</p><h1 className="mt-2 font-serif text-4xl font-black text-[#F0EDE8]">New post</h1></div>
      <PostForm action={createPost} submitLabel="Create post" />
    </div>
  )
}
