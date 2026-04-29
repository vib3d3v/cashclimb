import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const postId = body?.postId
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: post, error: fetchError } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle()
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

  if (evaluation.score < 80 || !evaluation.passed || !post.cover_url) {
    return NextResponse.json({ error: 'Post does not pass the publish gate yet.' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('posts').update({ published: true, status: 'published', published_at: post.published_at || now, updated_at: now }).eq('id', postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
