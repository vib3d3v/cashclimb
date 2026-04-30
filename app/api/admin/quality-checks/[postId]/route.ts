import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = {
  params: {
    postId: string
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const supabase = createAdminClient()
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', params.postId).single()
    if (error) throw error
    if (!post) throw new Error('Post not found.')

    const evaluation = evaluateFinanceArticle({
      title: post.title || '',
      excerpt: post.excerpt || '',
      body: post.body || '',
      primaryKeyword: post.primary_keyword || null,
      category: post.category || null,
      seoTitle: post.seo_title || null,
      seoDescription: post.seo_description || null,
      coverUrl: post.cover_url || null,
    })

    const status = nextStatusFromEvaluation(evaluation)

    await supabase.from('posts').update({
      quality_score: evaluation.score,
      risk_level: evaluation.risk_level,
      status,
      review_notes: evaluation.passed
        ? `SEO checklist passed with score ${evaluation.score}.`
        : `SEO checklist needs review. Failed: ${evaluation.checks.filter((check) => !check.passed).map((check) => check.name).join(', ')}.`,
    }).eq('id', params.postId)

    await supabase.from('quality_checks').insert({
      post_id: params.postId,
      score: evaluation.score,
      passed: evaluation.passed,
      risk_level: evaluation.risk_level,
      checks: evaluation.checks,
    })

    return NextResponse.json({ success: true, evaluation })
  } catch (error: any) {
    console.error('[quality-checks] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to run SEO checklist.' },
      { status: 500 }
    )
  }
}
