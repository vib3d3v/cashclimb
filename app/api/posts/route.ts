import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import slugify from 'slugify'
import readingTime from 'reading-time'

// GET /api/posts — list published posts (public)
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search   = searchParams.get('search')
  const limit    = parseInt(searchParams.get('limit') ?? '50')
  const all      = searchParams.get('all') === 'true' // admin: include drafts

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!all) query = query.eq('published', true)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/posts — create new post (admin only)
export async function POST(req: NextRequest) {
  // Verify admin auth header
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, excerpt, content, category, author, cover_url, published } = body

  if (!title || !excerpt || !content || !category || !author) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = slugify(title, { lower: true, strict: true })
  const stats = readingTime(content.replace(/<[^>]*>/g, ''))
  const read_time = stats.text

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({ title, slug, excerpt, body: content, category, author, cover_url, published: published ?? false, read_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
