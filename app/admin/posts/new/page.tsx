import { redirect } from 'next/navigation'
import slugify from 'slugify'
import readingTime from 'reading-time'
import PostForm from '@/components/admin/PostForm'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'

export default function NewPostPage() {
  async function createPost(formData: FormData) {
    'use server'
    const supabase = createAdminClient()
    const title = String(formData.get('title') || '').trim()
    const body = String(formData.get('body') || '').trim()
    const category = String(formData.get('category') || 'Personal Finance')
    const status = String(formData.get('status') || 'draft')
    const slug = slugify(String(formData.get('slug') || title), { lower: true, strict: true })
    const related = String(formData.get('related_keywords') || '').split(',').map((x) => x.trim()).filter(Boolean)
    const payload = {
      title,
      slug,
      excerpt: String(formData.get('excerpt') || '').trim(),
      body,
      category,
      author: String(formData.get('author') || 'CashClimb Editorial').trim(),
      cover_url: String(formData.get('cover_url') || '').trim() || null,
      published: status === 'published',
      status,
      read_time: readingTime(body.replace(/<[^>]*>/g, ' ')).text,
      primary_keyword: String(formData.get('primary_keyword') || '').trim() || null,
      related_keywords: related,
      seo_title: String(formData.get('seo_title') || '').trim() || null,
      seo_description: String(formData.get('seo_description') || '').trim() || null,
    }
    const evaluation = evaluateFinanceArticle({ title: payload.title, excerpt: payload.excerpt, body: payload.body, primaryKeyword: payload.primary_keyword, category, seoTitle: payload.seo_title, seoDescription: payload.seo_description, coverUrl: payload.cover_url })
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
