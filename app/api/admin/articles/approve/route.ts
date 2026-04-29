import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => null)
  const postId = body?.postId
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('posts').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
