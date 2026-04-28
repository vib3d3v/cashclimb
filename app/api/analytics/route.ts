import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.post_id) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    await supabase.rpc('increment_post_views', { post_id_input: body.post_id })
  } catch {
    // View tracking should never block the page.
  }

  return NextResponse.json({ ok: true })
}
