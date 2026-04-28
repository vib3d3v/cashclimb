import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-guard'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, excerpt, body, primary_keyword, category, seo_title, seo_description, cover_url, status')
    .eq('id', params.postId)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: error?.message ?? 'Post not found' }, { status: 404 })
  }

  const evaluation = evaluateFinanceArticle({
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    primaryKeyword: post.primary_keyword,
    category: post.category,
    seoTitle: post.seo_title,
    seoDescription: post.seo_description,
    coverUrl: post.cover_url,
  })

  const nextStatus = nextStatusFromEvaluation(evaluation)

  const [{ error: checkError }, { error: postError }] = await Promise.all([
    supabase.from('quality_checks').insert({
      post_id: post.id,
      score: evaluation.score,
      passed: evaluation.passed,
      risk_level: evaluation.risk_level,
      checks: evaluation.checks,
    }),
    supabase
      .from('posts')
      .update({
        quality_score: evaluation.score,
        risk_level: evaluation.risk_level,
        status: post.status === 'published' ? 'published' : nextStatus,
      })
      .eq('id', post.id),
  ])

  if (checkError || postError) {
    return NextResponse.json(
      { error: checkError?.message ?? postError?.message ?? 'Failed to save quality check' },
      { status: 500 }
    )
  }

  return NextResponse.json({ postId: post.id, status: nextStatus, evaluation })
}
