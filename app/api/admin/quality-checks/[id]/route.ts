import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data: post, error: fetchError } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  if (fetchError || !post) return NextResponse.json({ error: fetchError?.message || 'Post not found' }, { status: 404 })

  const evaluation = evaluateFinanceArticle({
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    primaryKeyword: post.primary_keyword ?? null,
    category: post.category,
    seoTitle: post.seo_title ?? null,
    seoDescription: post.seo_description ?? null,
    coverUrl: post.cover_url ?? null,
  })

  const status = post.published ? 'published' : nextStatusFromEvaluation(evaluation)

  await supabase.from('posts').update({
    quality_score: evaluation.score,
    risk_level: evaluation.risk_level,
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id)

  await supabase.from('quality_checks').insert({
    post_id: params.id,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })

  return NextResponse.json({ ok: true, evaluation })
}
