import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-guard'

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const postId = String(body.postId ?? '').trim()
  const notes = body.notes ? String(body.notes).trim() : null

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ status: 'approved', approved_at: new Date().toISOString(), review_notes: notes })
    .eq('id', postId)
    .select('id, status, approved_at, review_notes')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('publish_events').insert({
    post_id: postId,
    action: 'approved',
    actor: 'admin',
    notes,
  })

  return NextResponse.json(data)
}
