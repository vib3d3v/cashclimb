import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getAutoAuthor } from '@/lib/seo-authors'

function safeAuthor(author: unknown, category: string) {
  const fallback = getAutoAuthor('cashclimb', category)
  const value = typeof author === 'string' ? author : ''
  if (!value || value.toLowerCase().includes('editorial')) return fallback.name
  return value
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('posts').select('*').eq('id', params.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const category = String(body.category ?? 'Personal Finance')
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of ['title', 'slug', 'excerpt', 'body', 'category', 'cover_url', 'published']) {
    if (key in body) update[key] = body[key]
  }

  if ('author' in body) update.author = safeAuthor(body.author, category)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
