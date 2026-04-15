import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-guard'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import { improveFailedChecks } from '@/lib/ai-editor'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, body, primary_keyword, category, seo_title, seo_description, cover_url, status, published, author')
    .eq('id', params.postId)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: error?.message ?? 'Post not found' }, { status: 404 })
  }

  const currentEvaluation = evaluateFinanceArticle({
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    primaryKeyword: post.primary_keyword,
    category: post.category,
    seoTitle: post.seo_title,
    seoDescription: post.seo_description,
    coverUrl: post.cover_url,
  })

  const failedChecks = currentEvaluation.checks.filter((check) => !check.passed)

  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('published', true)
    .neq('id', post.id)
    .eq('category', post.category)
    .limit(3)

  let rewritten
  try {
    rewritten = await improveFailedChecks(post, failedChecks, relatedPosts ?? [])
  } catch (error) {
    return NextResponse.json(
      { error: 'The rewrite took too long. Please try again.' },
      { status: 504 }
    )
  }
  const evaluation = evaluateFinanceArticle({
    title: rewritten.title,
    excerpt: rewritten.excerpt,
    body: rewritten.contentHtml,
    primaryKeyword: post.primary_keyword,
    category: post.category,
    seoTitle: rewritten.seoTitle,
    seoDescription: rewritten.seoDescription,
    coverUrl: post.cover_url,
  })

  const nextStatus = post.published ? 'published' : nextStatusFromEvaluation(evaluation)

  const [{ error: updateError }, { error: checkError }] = await Promise.all([
    supabase
      .from('posts')
      .update({
        title: rewritten.title,
        excerpt: rewritten.excerpt,
        body: rewritten.contentHtml,
        seo_title: rewritten.seoTitle,
        seo_description: rewritten.seoDescription,
        author: rewritten.author,
        quality_score: evaluation.score,
        risk_level: evaluation.risk_level,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id),
    supabase.from('quality_checks').insert({
      post_id: post.id,
      score: evaluation.score,
      passed: evaluation.passed,
      risk_level: evaluation.risk_level,
      checks: evaluation.checks,
    }),
  ])

  if (updateError || checkError) {
    return NextResponse.json(
      { error: updateError?.message || checkError?.message || 'Failed to improve article' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    postId: post.id,
    previousScore: currentEvaluation.score,
    evaluation,
    status: nextStatus,
  })
}
