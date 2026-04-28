import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.post_id || !body?.author_name || !body?.author_email || !body?.body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('comments').insert({
    post_id: body.post_id,
    author_name: body.author_name,
    author_email: body.author_email,
    body: body.body,
    approved: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
