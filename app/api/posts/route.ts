import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { getAutoAuthor } from '@/lib/seo-authors'

function safeAuthor(author: unknown, category: string) {
  const fallback = getAutoAuthor('cashclimb', category)
  const value = typeof author === 'string' ? author : ''
  if (!value || value.toLowerCase().includes('editorial')) return fallback.name
  return value
}

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
  const title = String(body.title ?? '').trim()
  const excerpt = String(body.excerpt ?? '').trim()
  const content = String(body.content ?? body.body ?? '').trim()
  const category = String(body.category ?? 'Personal Finance').trim()
  const published = Boolean(body.published)

  if (!title || !excerpt || !content || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = slugify(String(body.slug || title), { lower: true, strict: true })
  const stats = readingTime(content.replace(/<[^>]*>/g, ''))
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      excerpt,
      body: content,
      category,
      author: safeAuthor(body.author, category),
      cover_url: body.cover_url ?? null,
      published,
      status: published ? 'published' : 'draft',
      read_time: stats.text,
      published_at: published ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
