import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const all = searchParams.get('all') === 'true'

  let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(limit)
  if (!all) query = query.eq('published', true)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, excerpt, content, category, author, cover_url, published, seo_title, seo_description, primary_keyword } = body

  if (!title || !excerpt || !content || !category || !author) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = slugify(title, { lower: true, strict: true })
  const stats = readingTime(String(content).replace(/<[^>]*>/g, ''))
  const evaluation = evaluateFinanceArticle({
    title,
    excerpt,
    body: content,
    primaryKeyword: primary_keyword ?? null,
    category,
    seoTitle: seo_title ?? null,
    seoDescription: seo_description ?? null,
    coverUrl: cover_url ?? null,
  })
  const status = published ? 'published' : nextStatusFromEvaluation(evaluation)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      excerpt,
      body: content,
      category,
      author,
      cover_url: cover_url ?? null,
      seo_title: seo_title ?? null,
      seo_description: seo_description ?? null,
      primary_keyword: primary_keyword ?? null,
      published: published ?? false,
      status,
      quality_score: evaluation.score,
      risk_level: evaluation.risk_level,
      read_time: stats.text,
      published_at: published ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('quality_checks').insert({
    post_id: data.id,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })

  return NextResponse.json(data, { status: 201 })
}
