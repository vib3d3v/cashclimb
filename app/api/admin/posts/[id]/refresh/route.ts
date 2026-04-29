import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'

function ensureHelpfulBlocks(body: string) {
  let next = body || ''

  if (!/<h2[^>]*>\s*key takeaways\s*<\/h2>/i.test(next)) {
    next = `<h2>Key Takeaways</h2><ul><li>Use this article as educational information, not personal financial advice.</li><li>Compare options carefully before making money decisions.</li><li>Match any action to your goals, risk tolerance, and timeline.</li></ul>${next}`
  }

  if (!/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(next)) {
    next += `<h2>FAQ</h2><h3>Is this financial advice?</h3><p>No. This article is for educational purposes only and should not be treated as personal financial advice.</p><h3>How should I use this guide?</h3><p>Use it as a starting point for research, then compare your options and consider speaking with a qualified professional.</p>`
  }

  if (!/not financial advice|educational purposes/i.test(next)) {
    next += `<h2>Important Note</h2><p>This content is for educational purposes only and is not financial advice.</p>`
  }

  return next
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data: post, error: fetchError } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  if (fetchError || !post) return NextResponse.json({ error: fetchError?.message || 'Post not found' }, { status: 404 })

  const body = ensureHelpfulBlocks(String(post.body || ''))
  const evaluation = evaluateFinanceArticle({
    title: post.title,
    excerpt: post.excerpt,
    body,
    primaryKeyword: post.primary_keyword ?? null,
    category: post.category,
    seoTitle: post.seo_title ?? null,
    seoDescription: post.seo_description ?? null,
    coverUrl: post.cover_url ?? null,
  })

  await supabase.from('posts').update({
    body,
    quality_score: evaluation.score,
    risk_level: evaluation.risk_level,
    status: post.published ? 'published' : nextStatusFromEvaluation(evaluation),
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
