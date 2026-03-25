import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// GET /api/comments?post_id=xxx  (approved only, public)
// GET /api/comments?all=true     (all comments, admin)
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('post_id')
  const all    = searchParams.get('all') === 'true'
  const isAdmin = req.headers.get('x-admin-key') === process.env.ADMIN_PASSWORD

  let query = supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })

  if (postId) query = query.eq('post_id', postId)
  if (!all || !isAdmin) query = query.eq('approved', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/comments  (public, pending approval)
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { post_id, author_name, author_email, body: commentBody } = body

  if (!post_id || !author_name || !author_email || !commentBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Basic spam: check post exists and is published
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', post_id)
    .eq('published', true)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, author_name, author_email, body: commentBody, approved: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/comments  — approve/reject (admin)
export async function PATCH(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { id, approved } = await req.json()

  const { data, error } = await supabase
    .from('comments')
    .update({ approved })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/comments  — delete comment (admin)
export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { id } = await req.json()

  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
